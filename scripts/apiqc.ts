import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createBaselineSnapshot, serializeBaselineSnapshot } from '../src/engine/audit/baseline';
import { runAudit } from '../src/engine/audit/runner';
import { PROVIDER_ADAPTERS, detectAuditProvider } from '../src/engine/audit/providerAdapters';
import { AuditProfile, AuditProvider } from '../src/types/audit';

type ParsedArgs = Record<string, string | boolean>;

const LOGO = `\x1b[38;5;209m
    █████╗ ██████╗ ██╗      ██████╗ ██╗   ██╗██╗ ██████╗
   ██╔══██╗██╔══██╗██║     ██╔═══██╗██║   ██║██║██╔════╝
   ███████║██████╔╝██║     ██║   ██║██║   ██║██║██║
   ██╔══██║██╔═══╝ ██║     ██║   ██║╚██╗ ██╔╝██║██║
   ██║  ██║██║     ███████╗╚██████╔╝ ╚████╔╝ ██║╚██████╗
   ╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝   ╚═══╝  ╚═╝ ╚═════╝\x1b[0m
                 \x1b[38;5;245mA P I  •  Q U I C K C H E C K\x1b[0m`;

function printHelp(): void {
  process.stdout.write(`${LOGO}\n\n用法:\n  npm run apiqc -- audit --model <id> --base-url <url> [选项]\n  npm run apiqc -- baseline capture --model <id> --base-url <url> [选项]\n\n选项:\n  --provider <auto|openai|anthropic|gemini|xai>\n  --profile <quick|balanced|deep>\n  --probes <id,id,...>       只执行指定测试\n  --api-key <key>            或使用 APIQC_API_KEY 环境变量\n  --out <file>               默认 audit-report.json\n  --baseline <id>            加载本地 baseline 文件 ID\n\n密钥只用于本次进程，不会写入报告。\n`);
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
  if (command !== 'audit' && command !== 'baseline') {
    throw new Error('Usage: apiqc audit|baseline capture --provider <provider> --model <id> --profile <profile> --out <file>');
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
  const output = typeof args.out === 'string' ? args.out : isCapture ? `baseline-${model}.json` : 'audit-report.json';

  process.stdout.write(`${LOGO}\n\n目标: ${provider} / ${model}\n档位: ${profile}\n\n`);
  const selectedProbeIds = typeof args.probes === 'string' ? args.probes.split(',').map((id) => id.trim()).filter(Boolean) : undefined;
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
