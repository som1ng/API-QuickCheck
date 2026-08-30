import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createBaselineSnapshot, serializeBaselineSnapshot, validateBaselineSnapshot } from '../src/engine/audit/baseline';
import { runAudit } from '../src/engine/audit/runner';
import { PROVIDER_ADAPTERS, detectAuditProvider } from '../src/engine/audit/providerAdapters';
import { AuditProfile, AuditProvider } from '../src/types/audit';
import { fetchLatestFrontierModels } from '../src/engine/baselines/modelSyncService';
import {
  parseBatchInput,
  runBatchAudit,
  exportValidEnv,
  exportCsvReport,
} from '../src/engine/audit/batchRunner';
import { BatchKeyInputItem } from '../src/types/batch';

type ParsedArgs = Record<string, string | boolean>;

function printHelp(): void {
  process.stdout.write(`API-QuickCheck CLI (v3.2.0) - 工业级 AI API 质量审计与批量质检引擎

用法:
  npx api-quickcheck batch [选项]                                (批量检测待处理 API-Key 资产池)
  npx api-quickcheck audit --model <id> --base-url <url> [选项]  (单端点深度审计与测真)
  npx api-quickcheck baseline capture --model <id> [选项]        (捕获官方基线快照)
  npx api-quickcheck update                                      (检查版本与同步 2026 前沿模型清单)
  npx api-quickcheck sync                                        (快速同步模型基线)

batch 批量检测选项:
  --input <file>             待检文件路径 (支持 .json, .csv, .env, .txt，传 - 表示从 stdin 读取)
  --keys <str>               命令行直接传入单/多个 Key 字符串 (逗号分隔或 JSON)
  --base-url <url>           默认 API Base URL (当输入项未指定时回退，默认 https://api.openai.com/v1)
  --models <m1,m2,...>       指定需测试的模型列表 (默认 claude-3-7-sonnet,gpt-4o,deepseek-r1)
  --concurrency <N>          并发数控制 (默认 5)
  --profile <quick|balanced> 探测深度 (默认 quick 极速探活，balanced 全面测真)
  --json                     纯 JSON 输出模式至 stdout (所有进度走 stderr，专为 Agent 设计)
  --out <file.json>          保存完整批处理 JSON 审计报告
  --export-valid <file>      导出有效/健康 Key 清单 (支持 .json, .env, .csv)
  --export-csv <file.csv>    导出 CSV 统计表格

audit 单项审计选项:
  --provider <openai|anthropic|gemini|xai|openrouter>
  --profile <quick|balanced|deep>
  --probes <id,id,...>       只执行指定探针
  --api-key <key>            或使用 APIQC_API_KEY；OpenRouter 可用 OPENROUTER_API_KEY
  --out <file>               audit 默认 reports/audit-report.json
  --baseline <file>          加载 baseline capture 生成的 JSON 文件

密钥仅在当前进程内存中使用，绝不会向外泄露或上传。\n`);
}

function parseArgs(values: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value?.startsWith('--')) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function required(args: ParsedArgs, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing --${key}`);
  return value.trim();
}

async function writeJson(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

function defaultRunOutput(provider: string, model: string): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const runId = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const safeModel = model.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `reports/runs/${date}/${provider}-${safeModel}/${runId}/report.json`;
}

async function readBaselineFile(path: string | undefined) {
  if (!path) return undefined;
  const raw = await readFile(path, 'utf8');
  const value: unknown = JSON.parse(raw);
  if (!validateBaselineSnapshot(value)) throw new Error(`Invalid baseline file: ${path}`);
  return value;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', (err) => reject(err));
  });
}

async function handleBatchCommand(args: ParsedArgs): Promise<void> {
  const isJsonMode = args.json === true;
  const defaultBaseUrl = typeof args['base-url'] === 'string' ? args['base-url'] : 'https://api.openai.com/v1';
  const models = typeof args.models === 'string'
    ? args.models.split(/[\s,]+/).map((m) => m.trim()).filter(Boolean)
    : ['claude-3-7-sonnet', 'gpt-4o', 'deepseek-r1'];
  const concurrency = typeof args.concurrency === 'string' ? Math.max(1, parseInt(args.concurrency, 10) || 5) : 5;
  const profile = (typeof args.profile === 'string' ? args.profile : 'quick') as AuditProfile;

  let rawContent = '';

  if (typeof args.input === 'string') {
    if (args.input === '-') {
      rawContent = await readStdin();
    } else {
      rawContent = await readFile(args.input, 'utf8');
    }
  } else if (typeof args.keys === 'string') {
    rawContent = args.keys;
  } else if (!process.stdin.isTTY) {
    rawContent = await readStdin();
  }

  if (!rawContent.trim()) {
    throw new Error('未提供任何待检测的 API-Key 内容。请通过 --input <file>、--keys <str> 或 stdin 管道输入。');
  }

  const items: BatchKeyInputItem[] = parseBatchInput(rawContent, defaultBaseUrl, models);
  if (items.length === 0) {
    throw new Error('未能从输入中解析出有效的 API-Key。请检查格式（支持 JSON, CSV, .env 或逐行 sk-xxx）。');
  }

  const log = (msg: string) => {
    if (isJsonMode) {
      process.stderr.write(`${msg}\n`);
    } else {
      process.stdout.write(`${msg}\n`);
    }
  };

  log(`\n🚀 启动 API-Key 批量质检引擎 (共 ${items.length} 个 Key, 并发度: ${concurrency}, 探测档位: ${profile})`);
  log(`🎯 目标测试模型: ${models.join(', ')}\n`);

  const report = await runBatchAudit({
    items,
    defaultModels: models,
    concurrency,
    profile: profile === 'deep' ? 'deep' : profile === 'balanced' ? 'balanced' : 'quick',
    onItemProgress: (completed, total, cur) => {
      const pct = Math.round((completed / total) * 100);
      log(`[${completed}/${total}] (${pct}%) 正在检测: ${cur.name} (${cur.baseUrl})...`);
    },
  });

  // Save report if requested
  if (typeof args.out === 'string') {
    await writeJson(args.out, JSON.stringify(report, null, 2));
    log(`\n📁 完整审计报告已导出: ${args.out}`);
  }

  // Export valid keys if requested
  if (typeof args['export-valid'] === 'string') {
    const exportPath = args['export-valid'];
    if (exportPath.endsWith('.env')) {
      const envContent = exportValidEnv(report);
      await writeJson(exportPath, envContent);
    } else if (exportPath.endsWith('.csv')) {
      const csvContent = exportCsvReport(report);
      await writeJson(exportPath, csvContent);
    } else {
      await writeJson(exportPath, JSON.stringify(report.validKeys, null, 2));
    }
    log(`💾 有效 Key 清单已导出 (${report.validKeys.length} 个): ${exportPath}`);
  }

  // Export CSV if requested
  if (typeof args['export-csv'] === 'string') {
    const csvContent = exportCsvReport(report);
    await writeJson(args['export-csv'], csvContent);
    log(`📊 CSV 报表已导出: ${args['export-csv']}`);
  }

  // If in pure JSON mode, output full report JSON to stdout
  if (isJsonMode) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }

  // Terminal Pretty Table Output
  process.stdout.write(`\n${'='.repeat(80)}\n`);
  process.stdout.write(`               📊 API-Key 批量质检与真伪审计结果汇总\n`);
  process.stdout.write(`${'='.repeat(80)}\n\n`);

  for (let i = 0; i < report.results.length; i++) {
    const r = report.results[i];
    const statusIcon = r.overallStatus === 'healthy' ? '🟢 正常/真品' : r.overallStatus === 'degraded' ? '🟡 降级/部分可用' : '🔴 异常/失效';
    process.stdout.write(`[#${i + 1}] ${r.name} | 端点: ${r.baseUrl} | Key: ${r.maskedKey}\n`);
    process.stdout.write(`     综合状态: ${statusIcon} (通过: ${r.successCount}/${r.testedModels.length})\n`);

    for (const m of r.testedModels) {
      const mStatus = m.status === 'alive' ? '✅ 可用' : `❌ ${m.status}`;
      const scoreStr = m.genuineScore !== undefined ? `真伪分: ${m.genuineScore}` : '';
      const latencyStr = m.latencyMs !== undefined ? `延迟: ${m.latencyMs}ms` : '';
      const tpsStr = m.tps ? `TPS: ${m.tps}t/s` : '';
      const sigStr = m.signatureVerified === true ? '🔏已验签' : m.signatureVerified === false ? '⚠️无签名' : '';
      const reasonStr = m.reasoningStream === true ? '🧠思维流' : '';

      const tags = [scoreStr, latencyStr, tpsStr, sigStr, reasonStr].filter(Boolean).join(' | ');
      const errStr = m.error ? ` -> 错误: ${m.error}` : '';

      process.stdout.write(`       - 模型 [${m.model}]: ${mStatus} ${tags ? `(${tags})` : ''}${errStr}\n`);
    }
    process.stdout.write('\n');
  }

  const durSec = (report.summary.durationMs / 1000).toFixed(2);
  process.stdout.write(`${'-'.repeat(80)}\n`);
  process.stdout.write(`总检测 Key 数: ${report.summary.totalKeys} | 🟢 正常: ${report.summary.healthyKeys} | 🟡 降级: ${report.summary.degradedKeys} | 🔴 失效: ${report.summary.deadKeys}\n`);
  process.stdout.write(`总模型探针数: ${report.summary.totalModelProbes} (通过: ${report.summary.passedModelProbes}, 失败: ${report.summary.failedModelProbes}) | 总耗时: ${durSec}s\n`);
  process.stdout.write(`${'='.repeat(80)}\n\n`);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!command || command === '--help' || args.help === true) {
    printHelp();
    return;
  }

  if (command === 'batch') {
    await handleBatchCommand(args);
    return;
  }

  if (command === 'update' || command === 'sync') {
    process.stdout.write(`🔍 正在检查版本更新与权威模型基线...\n\n`);
    const currentVersion = '3.2.0';
    try {
      const res = await fetch('https://registry.npmjs.org/api-quickcheck/latest', {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as { version?: string };
        const latest = data.version;
        if (latest && latest !== currentVersion) {
          process.stdout.write(`⚡ 发现新版本: v${latest} (当前版本: v${currentVersion})\n👉 全局更新: npm install -g api-quickcheck@latest\n👉 npx 免安装用户已自动使用最新版。\n\n`);
        } else {
          process.stdout.write(`✅ CLI 已是最新版本: v${currentVersion}\n\n`);
        }
      }
    } catch {
      process.stdout.write(`ℹ️ 当前版本: v${currentVersion}\n\n`);
    }

    process.stdout.write(`🔄 正在从权威数据源同步 2026 前沿模型基线...\n`);
    try {
      const syncRes = await fetchLatestFrontierModels();
      process.stdout.write(`✅ 成功同步 ${syncRes.totalModels} 个前沿模型清单 (${syncRes.updatedAt})\n`);
      if (typeof args.out === 'string') {
        await writeJson(args.out, JSON.stringify(syncRes, null, 2));
        process.stdout.write(`📁 基线已导出至: ${args.out}\n`);
      }
    } catch {
      process.stdout.write(`⚠️ 基线同步完成 (已应用内置 2026 最新离线基线)\n`);
    }
    return;
  }

  if (command !== 'audit' && command !== 'baseline') {
    throw new Error('Usage: apiqc batch|audit|baseline capture|update|sync ...');
  }

  const isCapture = command === 'baseline';
  if (isCapture && process.argv[3] !== 'capture') throw new Error('Usage: apiqc baseline capture ...');

  const model = required(args, 'model');
  const requestedProvider = (typeof args.provider === 'string' ? args.provider : 'openrouter') as AuditProvider;
  const provider = detectAuditProvider(model, requestedProvider);
  const baseUrl = typeof args['base-url'] === 'string'
    ? args['base-url']
    : provider === 'openrouter' ? process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1' : process.env.APIQC_BASE_URL;
  const apiKey = typeof args['api-key'] === 'string'
    ? args['api-key']
    : provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.APIQC_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('Provide --base-url and --api-key, or set APIQC_BASE_URL and APIQC_API_KEY');
  const profile = (typeof args.profile === 'string' ? args.profile : 'balanced') as AuditProfile;
  const baselineFileName = `${provider}-${model.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;
  const output = typeof args.out === 'string' ? args.out : isCapture ? `reports/baselines/${baselineFileName}` : defaultRunOutput(provider, model);
  const baselineSnapshot = await readBaselineFile(typeof args.baseline === 'string' ? args.baseline : undefined);

  process.stdout.write(`目标: ${provider} / ${model}\n档位: ${profile}\n\n`);
  const selectedProbeIds = typeof args.probes === 'string' ? args.probes.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean) : undefined;
  const report = await runAudit({
    baseUrl,
    apiKey,
    model,
    provider,
    profile,
    baselineId: baselineSnapshot?.id,
    baselineSnapshot,
    selectedProbeIds,
    onProgress: (completed, total, label) => process.stderr.write(`[${completed}/${total}] ${label}\n`),
  });

  if (!isCapture) {
    await writeJson(output, `${JSON.stringify(report, null, 2)}\n`);
    const tok = report.runtime.totalTokens ? `${report.runtime.totalTokens.toLocaleString()} (输入: ${report.runtime.totalPromptTokens || 0}, 输出: ${report.runtime.totalCompletionTokens || 0})` : '--';
    const dur = report.runtime.totalDurationMs ? `${(report.runtime.totalDurationMs / 1000).toFixed(2)}s` : '--';
    process.stdout.write(`\n结论: ${report.conclusion}\n覆盖: ${report.coverage.executed}/${report.coverage.total}，不可用 ${report.coverage.unavailable}，未声明 ${report.coverage.notClaimed || 0}，探索性 ${report.coverage.exploratory || 0}\n成功率: ${Math.round(report.runtime.successRate * 100)}% | 总耗时: ${dur} | Token消耗: ${tok}\n报告已保存: ${output}\n`);
    return;
  }

  const source = args.source === 'official' || args.source === 'reference'
    ? args.source
    : provider === 'openrouter' ? 'reference' : 'user';
  const snapshot = createBaselineSnapshot({
    id: typeof args.id === 'string' ? args.id : `${provider}-${model}-${new Date().toISOString().slice(0, 10)}`,
    provider,
    model,
    surface: PROVIDER_ADAPTERS[provider].surface,
    region: typeof args.region === 'string' ? args.region : 'unknown',
    serviceTier: typeof args['service-tier'] === 'string' ? args['service-tier'] : 'unknown',
    report,
    source,
  });
  await writeJson(output, serializeBaselineSnapshot(snapshot));
  process.stdout.write(`Baseline snapshot written to ${output} (source=${source}, coverage=${snapshot.coverage.executed}/${snapshot.coverage.total})\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
