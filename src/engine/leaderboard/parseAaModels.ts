import { AaModelRow } from '../../types/leaderboard';

export function parseAaModels(markdown: string): AaModelRow[] {
  const rows: AaModelRow[] = [];
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);

  let rankCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|') || line.includes('---')) continue;

    const values = line.split('|').map((v) => v.trim()).slice(1, -1);
    if (values.length < 8) continue;

    const nameRaw = values[0] || '';
    // Skip header lines
    if (
      !nameRaw ||
      nameRaw.toLowerCase() === 'model' ||
      nameRaw.toLowerCase() === 'features' ||
      values[1]?.toLowerCase() === 'features' ||
      values[1]?.toLowerCase() === 'context window'
    ) {
      continue;
    }

    const name = cleanText(nameRaw);
    const contextWindow = parseContext(values[1] || '');

    // Creator & Logo
    const { creator, creatorLogo } = parseCreator(values[2] || '');

    // Intelligence Index
    const intelStr = values[3] || '';
    let intelligenceIndex: number | null = null;
    let estimated = false;
    if (intelStr && intelStr !== '--' && intelStr !== '—' && intelStr !== 'N/A') {
      if (intelStr.endsWith('*')) {
        estimated = true;
        intelligenceIndex = parseFloat(intelStr.slice(0, -1).trim()) || null;
      } else {
        intelligenceIndex = parseFloat(intelStr.trim()) || null;
      }
    }

    // Cost per task USD
    const cost = parseNumeric(values[4]);

    // Speed Tokens/s
    const medianTokensPerSec = parseNumeric(values[5]);

    // Latency first chunk (s)
    const latencyFirstChunkSec = parseNumeric(values[6]);

    // Total response (s)
    const totalResponseSec = parseNumeric(values[7]);

    // Further Analysis URLs
    const analysisRaw = values[8] || '';
    const modelUrlMatch = analysisRaw.match(/\[Model\]\((https?:\/\/[^\s)]+)\)/i);
    const providersUrlMatch = analysisRaw.match(/\[Providers\]\((https?:\/\/[^\s)]+)\)/i);
    const modelUrl = modelUrlMatch ? modelUrlMatch[1] : undefined;
    const providersUrl = providersUrlMatch ? providersUrlMatch[1] : undefined;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    rows.push({
      rank: rankCounter++,
      name,
      slug,
      creator,
      creatorLogo,
      intelligenceIndex,
      estimated,
      costPerTaskUsd: cost,
      medianTokensPerSec,
      latencyFirstChunkSec,
      totalResponseSec,
      contextWindow,
      modelUrl,
      providersUrl,
    });
  }

  return rows;
}

function cleanText(text: string): string {
  return text.replace(/\*\*/g, '').replace(/<[^>]+>/g, ' ').trim();
}

function parseCreator(raw: string): { creator: string; creatorLogo?: string } {
  if (!raw) return { creator: 'Unknown' };
  const imgMatch = raw.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\s*(.*)/);
  if (imgMatch) {
    const alt = imgMatch[1]?.trim();
    const url = imgMatch[2]?.trim();
    const rest = imgMatch[3]?.trim();
    const name = rest || alt || 'Unknown';
    return { creator: name, creatorLogo: url };
  }
  return { creator: cleanText(raw) || 'Unknown' };
}

function parseNumeric(raw?: string): number | null {
  if (!raw || raw === '--' || raw === '—' || raw === 'N/A') return null;
  const cleaned = raw.replace(/[$,s\s]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

export function parseContext(contextStr: string): number | null {
  if (!contextStr || contextStr === '—' || contextStr === '--' || contextStr === 'N/A') return null;
  const match = contextStr.match(/([\d.]+)\s*([MK]?)/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const unit = match[2]?.toUpperCase();
  if (unit === 'K') num *= 1000;
  if (unit === 'M') num *= 1000000;
  return Math.round(num);
}