import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchLatestFrontierModels } from '../src/engine/baselines/modelSyncService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

async function main() {
  console.log('🔄 [API-QuickCheck] 正在同步 2026 前沿模型基线清单...');
  
  const startTime = Date.now();
  const syncResult = await fetchLatestFrontierModels();
  const duration = Date.now() - startTime;

  console.log(`✅ 成功获取 ${syncResult.totalModels} 个前沿基线模型 (耗时 ${duration}ms)`);
  console.log(`📅 最新同步日期: ${syncResult.updatedAt}`);

  // 1. Write to documentation Markdown file
  const docPath = join(ROOT_DIR, 'src/content/docs/01-intro/frontier-model-baseline-2026-08-16.md');
  await mkdir(dirname(docPath), { recursive: true });
  await writeFile(docPath, syncResult.rawMarkdown, 'utf-8');
  console.log(`📄 已更新 Markdown 文档: src/content/docs/01-intro/frontier-model-baseline-2026-08-16.md`);

  // 2. Write to structured JSON baseline
  const jsonPath = join(ROOT_DIR, 'src/content/baselines/frontierModels.json');
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        updatedAt: syncResult.updatedAt,
        totalModels: syncResult.totalModels,
        models: syncResult.models,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`📦 已生成结构化 JSON: src/content/baselines/frontierModels.json`);

  console.log(`🎉 2026 模型基线自动更新圆满完成！`);
}

main().catch((err) => {
  console.error('❌ 同步模型基线失败:', err);
  process.exit(1);
});
