import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parseAaModels } from '../src/engine/leaderboard/parseAaModels';
import { parseArenaAgents } from '../src/engine/leaderboard/parseArenaAgents';

// 1. Process Artificial Analysis HTML
function processAaHtml(htmlPath: string): string {
  const html = readFileSync(htmlPath, 'utf-8');
  const trs = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  const mdLines: string[] = [
    '# LLM Leaderboard - Comparison of AI models from OpenAI, Anthropic, Google, SpaceXAI & others',
    '',
    '| Model | Context Window | Creator | Artificial Analysis Intelligence Index | Cost per TaskUSD | MedianTokens/s | LatencyFirst Chunk (s) | TotalResponse (s) | Further Analysis |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (let i = 2; i < trs.length; i++) {
    const tr = trs[i];
    const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 9) continue;

    // 0: Model
    const nameMatch = tds[0]?.match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!name) continue;

    // 1: Context Window
    const ctxMatch = tds[1].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const ctx = ctxMatch ? ctxMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 2: Creator & logo
    const imgMatch = tds[2].match(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/i) || tds[2].match(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["']/i);
    const creatorText = tds[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let creatorCell = creatorText;
    if (imgMatch) {
      const src = imgMatch[1].startsWith('http') ? imgMatch[1] : 'https://artificialanalysis.ai' + imgMatch[1];
      const alt = imgMatch[2] || creatorText;
      creatorCell = `![${alt}](${src})${creatorText}`;
    }

    // 3: Intelligence Index
    const intelMatch = tds[3].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const intel = intelMatch ? intelMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 4: Cost per Task USD
    const costMatch = tds[4].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const cost = costMatch ? costMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 5: Median Tokens/s
    const speedMatch = tds[5].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const speed = speedMatch ? speedMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 6: Latency First Chunk (s)
    const latencyMatch = tds[6].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const latency = latencyMatch ? latencyMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 7: Total Response (s)
    const totalMatch = tds[7].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
    const total = totalMatch ? totalMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // 8: Further Analysis
    const modelLinkMatch = tds[8].match(/href=["'](\/models\/[^"']+)["'][^>]*>Model/i);
    const provLinkMatch = tds[8].match(/href=["'](\/models\/[^"']+\/providers)["'][^>]*>Providers/i);
    let analysis = '';
    if (modelLinkMatch) {
      analysis += `[Model](https://artificialanalysis.ai${modelLinkMatch[1]})`;
    }
    if (provLinkMatch) {
      if (analysis) analysis += '<br>';
      analysis += `[Providers](https://artificialanalysis.ai${provLinkMatch[1]})`;
    }

    mdLines.push(`| ${[name, ctx, creatorCell, intel, cost, speed, latency, total, analysis].join(' | ')} |`);
  }

  return mdLines.join('\n');
}

// 2. Process Arena Agents HTML
function processArenaHtml(htmlPath: string): string {
  const html = readFileSync(htmlPath, 'utf-8');
  const trs = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  const dateMatch = html.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  const dateStr = dateMatch ? dateMatch[0] : 'Sep 1, 2026';

  const mdLines: string[] = [
    '# Agent Arena🏆Overall',
    '',
    dateStr,
    '',
    '| Rank | Model | Net Improvement | Confirmed Success | Praise vs Complaint | Steerability | Bash Recovery | Tool Hallucination | Sessions | Cost/Task (P50) | Output Tokens/Task (P50) | Price $/M |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (let i = 1; i < trs.length; i++) {
    const tr = trs[i];
    const tds = tr.match(/<td[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 12) continue;

    // 0: Rank
    const rankPart = (tds[0] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const rankNum = rankPart.split(/\s+/)[0];
    if (!rankNum || isNaN(Number(rankNum))) continue;

    // 1: Model
    const modelLinkMatch = tds[1]?.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const modelUrl = modelLinkMatch ? modelLinkMatch[1] : '';
    const modelName = modelLinkMatch ? modelLinkMatch[2].replace(/<[^>]+>/g, '').trim() : '';

    // Lab & License
    // usually: Lab<br>[Name](url)<br>Lab · License
    // Let's find lab and license
    const labSpanMatch = tds[1]?.match(/<span[^>]*class=["'][^"']*truncate[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const labLicense = labSpanMatch ? labSpanMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const [labName] = labLicense.split('·').map(s => s.trim());

    const modelCell = `${labName || 'Lab'}<br>[${modelName || 'Model'}](${modelUrl})<br>${labLicense || 'Proprietary'}`;

    // Helper for metric cells (extract % and ±%)
    function parseMetric(td: string, allowNegative = false): string {
      const isDown = td.includes('aria-label="Down"');
      const pctMatch = td.match(/([0-9.]+)\s*(?:<!-- -->)?\s*%/);
      const ciMatch = td.match(/±\s*([0-9.]+)%/);
      if (!pctMatch) return '--';
      const sign = (allowNegative && isDown) ? '-' : '';
      const ci = ciMatch ? `±${ciMatch[1]}%` : '';
      return `${sign}${pctMatch[1]}%${ci}`;
    }

    // 2: Net Improvement
    const netImp = parseMetric(tds[2], true);

    // 3: Confirmed Success
    const confSuccess = parseMetric(tds[3]);

    // 4: Praise vs Complaint
    const praise = parseMetric(tds[4]);

    // 5: Steerability
    const steer = parseMetric(tds[5]);

    // 6: Bash Recovery
    const bash = parseMetric(tds[6]);

    // 7: Tool Hallucination
    const toolHall = parseMetric(tds[7]);

    // 8: Sessions
    const sessions = tds[8].replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();

    // 9: Cost/Task (P50)
    const costMatch = tds[9].match(/\$([0-9.]+)/);
    const cost = costMatch ? `$${costMatch[1]}` : '--';

    // 10: Output Tokens/Task (P50)
    const tokens = tds[10].replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();

    // 11: Price $/M
    const price = tds[11].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    mdLines.push(`| ${rankNum} | ${modelCell} | ${netImp} | ${confSuccess} | ${praise} | ${steer} | ${bash} | ${toolHall} | ${sessions} | ${cost} | ${tokens} | ${price} |`);
  }

  return mdLines.join('\n');
}

async function main() {
  console.log('🔄 [Live Sync] 正在从数据源构建排行榜 Markdown 与 JSON 快照...');

  const defaultAaHtml = 'C:/Users/Lenovo/.gemini/antigravity/brain/9a91d0c4-96ed-4939-8183-4b7caf6702c2/.system_generated/steps/118/content.md';
  const defaultArenaHtml = 'C:/Users/Lenovo/.gemini/antigravity/brain/9a91d0c4-96ed-4939-8183-4b7caf6702c2/.system_generated/steps/126/content.md';

  const aaHtmlPath = process.argv[2] || (existsSync('./.firecrawl/aa-models.html') ? './.firecrawl/aa-models.html' : defaultAaHtml);
  const arenaHtmlPath = process.argv[3] || (existsSync('./.firecrawl/arena-agent.html') ? './.firecrawl/arena-agent.html' : defaultArenaHtml);

  const aaMd = processAaHtml(aaHtmlPath);
  const arenaMd = processArenaHtml(arenaHtmlPath);

  // Write to .firecrawl/
  writeFileSync('.firecrawl/aa-models.md', aaMd, 'utf-8');
  writeFileSync('.firecrawl/arena-agent.md', arenaMd, 'utf-8');
  console.log('✅ 已更新 .firecrawl/aa-models.md 和 .firecrawl/arena-agent.md');

  // Parse and generate snapshots
  const aaRows = parseAaModels(aaMd);
  const arenaRows = parseArenaAgents(arenaMd);

  const nowIso = new Date().toISOString();
  const aaSnapshot = {
    source: 'aa-models' as const,
    sourceUrl: 'https://artificialanalysis.ai/leaderboards/models',
    sourceName: 'Artificial Analysis LLM Leaderboard',
    fetchedAt: nowIso,
    asOf: nowIso.slice(0, 10),
    rowCount: aaRows.length,
    rows: aaRows,
  };

  const arenaSnapshot = {
    source: 'arena-agent' as const,
    sourceUrl: 'https://arena.ai/leaderboard/agent',
    sourceName: 'Arena Agent Leaderboard',
    fetchedAt: nowIso,
    asOf: '2026-09-01',
    rowCount: arenaRows.length,
    rows: arenaRows,
  };

  writeFileSync('src/content/leaderboards/aa-models.json', JSON.stringify(aaSnapshot, null, 2));
  writeFileSync('src/content/leaderboards/arena-agents.json', JSON.stringify(arenaSnapshot, null, 2));

  console.log('🎉 排行榜同步完成:');
  console.log(`  - Artificial Analysis: ${aaRows.length} 个模型 (最新榜首: ${aaRows[0]?.name}, 指数: ${aaRows[0]?.intelligenceIndex})`);
  console.log(`  - Arena Agent: ${arenaRows.length} 个模型 (最新榜首: ${arenaRows[0]?.name}, 改进率: ${arenaRows[0]?.netImprovementPct}%)`);
}

main().catch(err => {
  console.error('❌ 同步失败:', err);
  process.exit(1);
});
