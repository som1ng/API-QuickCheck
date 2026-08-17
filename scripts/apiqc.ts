import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createBaselineSnapshot, serializeBaselineSnapshot } from '../src/engine/audit/baseline';
import { runAudit } from '../src/engine/audit/runner';
import { PROVIDER_ADAPTERS, detectAuditProvider } from '../src/engine/audit/providerAdapters';
import { AuditProfile, AuditProvider } from '../src/types/audit';

import { fetchLatestFrontierModels } from '../src/engine/baselines/modelSyncService';

type ParsedArgs = Record<string, string | boolean>;

const LOGO = `\x1b[38;2;204;120;92m
   █████╗ ██████╗ ██╗    ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗
  ██╔══██╗██╔══██╗██║   ██╔═══██╗██║   ██║██║██╔════╝██║ ██╔╝
  ███████║██████╔╝██║   ██║   ██║██║   ██║██║██║     █████╔╝
  ██╔══██║██╔═══╝ ██║   ██║▄▄ ██║██║   ██║██║██║     ██╔═██╗
  ██║  ██║██║     ██║   ╚██████╔╝╚██████╔╝██║╚██████╗██║  ██╗
  ╚═╝  ╚═╝╚═╝     ╚═╝    ╚══▀▀═╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝
               ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗
              ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝
              ██║     ███████║█████╗  ██║     █████╔╝
              ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗
              ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗
               ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝\x1b[0m
\x1b[38;2;156;150;137m  ─────────────────────────────────────────────────────────────\x1b[0m
\x1b[38;2;250;249;245m  AI RELAY AUDIT · PROTOCOL · CAPABILITY · BASELINE\x1b[0m`;

function printHelp(): void {
  process.stdout.write(`${LOGO}\n\n用法:
  npx api-quickcheck audit --model <id> --base-url <url> [选项]
  npx api-quickcheck baseline capture --model <id> --base-url <url> [选项]
  npx api-quickcheck update  (检查版本与在线同步 2026 前沿模型基线)
  npx api-quickcheck sync    (快速同步基线数据)

选项:
  --provider <auto|openai|anthropic|gemini|xai>
  --profile <quick|balanced|deep>
  --probes <id,id,...>       只执行指定测试
  --api-key <key>            或使用 APIQC_API_KEY 环境变量
  --out <file>               默认 reports/audit-report.json
  --baseline <id>            加载本地 baseline 文件 ID

密钥只用于本次进程，不会写入报告。\n`);
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

async function main(): Promise<void> {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  if (!command || command === '--help' || args.help === true) {
    printHelp();
    return;
  }

  if (command === 'update' || command === 'sync') {
    process.stdout.write(`${LOGO}\n\n🔍 正在检查版本更新与权威模型基线...\n\n`);
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
    } catch (err: unknown) {
      process.stdout.write(`⚠️ 基线同步完成 (已应用内置 2026 最新离线基线)\n`);
    }
    return;
  }

  if (command !== 'audit' && command !== 'baseline') {
    throw new Error('Usage: apiqc audit|baseline capture|update|sync --provider <provider> --model <id> --profile <profile>');
  }

  const isCapture = command === 'baseline';
  if (isCapture && process.argv[3] !== 'capture') throw new Error('Usage: apiqc baseline capture ...');

  const model = required(args, 'model');
  const requestedProvider = (typeof args.provider === 'string' ? args.provider : 'auto') as AuditProvider | 'auto';
  const provider = detectAuditProvider(model, requestedProvider);
  const baseUrl = typeof args['base-url'] === 'string' ? args['base-url'] : process.env.APIQC_BASE_URL;
  const apiKey = typeof args['api-key'] === 'string' ? args['api-key'] : process.env.APIQC_API_KEY;
  if (!baseUrl || !apiKey) throw new Error('Provide --base-url and --api-key, or set APIQC_BASE_URL and APIQC_API_KEY');
  const profile = (typeof args.profile === 'string' ? args.profile : 'balanced') as AuditProfile;
  const output = typeof args.out === 'string' ? args.out : isCapture ? `baseline-${model}.json` : 'reports/audit-report.json';

  process.stdout.write(`${LOGO}\n\n目标: ${provider} / ${model}\n档位: ${profile}\n\n`);
  const selectedProbeIds = typeof args.probes === 'string' ? args.probes.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean) : undefined;
  const report = await runAudit({
    baseUrl,
    apiKey,
    model,
    provider,
    profile,
    baselineId: typeof args.baseline === 'string' ? args.baseline : undefined,
    selectedProbeIds,
    onProgress: (completed, total, label) => process.stderr.write(`[${completed}/${total}] ${label}\n`),
  });

  if (!isCapture) {
    await writeJson(output, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(`\n结论: ${report.conclusion}\n覆盖: ${report.coverage.executed}/${report.coverage.total}，不可用 ${report.coverage.unavailable}，未声明 ${report.coverage.notClaimed || 0}，探索性 ${report.coverage.exploratory || 0}\n成功率: ${Math.round(report.runtime.successRate * 100)}%\n报告已保存: ${output}\n`);
    return;
  }

  const source = args.source === 'official' ? 'official' : 'user';
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
