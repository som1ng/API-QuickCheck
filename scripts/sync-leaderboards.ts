import { readFileSync, writeFileSync } from 'fs';
import { parseAaModels } from '../src/engine/leaderboard/parseAaModels';
import { parseArenaAgents } from '../src/engine/leaderboard/parseArenaAgents';

const aaMarkdown = readFileSync('./.firecrawl/aa-models.md', 'utf-8').trim();
const arenaMarkdown = readFileSync('./.firecrawl/arena-agent.md', 'utf-8').trim();

const aaRows = parseAaModels(aaMarkdown);
const arenaRows = parseArenaAgents(arenaMarkdown);

const snapshot = {
  source: 'aa-models' as const,
  sourceUrl: 'https://artificialanalysis.ai/leaderboards/models',
  sourceName: 'Artificial Analysis LLM Leaderboard',
  fetchedAt: new Date().toISOString(),
  asOf: new Date().toISOString().slice(0, 10), // AA 页面未标注数据日期，以抓取日为准
  rowCount: aaRows.length,
  rows: aaRows,
};

writeFileSync('src/content/leaderboards/aa-models.json', JSON.stringify(snapshot, null, 2));

// Arena 页面自带更新日期（如 "Aug 19, 2026"），解析为 ISO 日期；解析不到则回退为抓取日
function parseAsOfDate(markdown: string, fetchedAt: string): string {
  const match = markdown.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  if (!match) return fetchedAt.slice(0, 10);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = match[1].match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  const monthIdx = parts ? MONTHS.indexOf(parts[1]) : -1;
  if (monthIdx < 0 || !parts) return fetchedAt.slice(0, 10);
  const day = parts[2].padStart(2, '0');
  return `${parts[3]}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
}

const arenaSnapshot = {
  source: 'arena-agent' as const,
  sourceUrl: 'https://arena.ai/leaderboard/agent',
  sourceName: 'Arena Agent Leaderboard',
  fetchedAt: new Date().toISOString(),
  asOf: parseAsOfDate(arenaMarkdown, new Date().toISOString()),
  rowCount: arenaRows.length,
  rows: arenaRows,
};

writeFileSync('src/content/leaderboards/arena-agents.json', JSON.stringify(arenaSnapshot, null, 2));

console.log('✅ Sync completed:');
console.log(`  aa-models: ${aaRows.length} rows`);
console.log(`  arena-agents: ${arenaRows.length} rows`);
console.log(`  Files written to src/content/leaderboards/`);