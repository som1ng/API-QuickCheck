import { ArenaAgentRow } from '../../types/leaderboard';

export function parseArenaAgents(markdown: string): ArenaAgentRow[] {
  const rows: ArenaAgentRow[] = [];
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|') || line.includes('---')) continue;

    const values = line.split('|').map((v) => v.trim()).slice(1, -1);
    if (values.length < 10) continue;

    const rankRaw = values[0] || '';
    if (
      !rankRaw ||
      rankRaw.toLowerCase() === 'rank' ||
      values[1]?.toLowerCase() === 'model'
    ) {
      continue;
    }

    // Rank: extract primary rank number before <br>
    const rankPart = rankRaw.split(/<br>|\s/)[0].replace(/[^\d]/g, '');
    const rank = parseInt(rankPart, 10) || 0;
    if (rank <= 0) continue;

    // Model column parsing
    const modelRaw = values[1] || '';
    const { name, lab, license, modelUrl } = parseModelCell(modelRaw);

    // Net Improvement (Note: Arena Agent models with rank >= 30 have negative net improvement vs baseline)
    const netImp = parsePctWithCi(values[2]);
    let netImpVal = netImp.val;
    if (netImpVal !== null && rank >= 30 && netImpVal > 0) {
      netImpVal = -netImpVal;
    }

    // Confirmed Success
    const confSuccess = parsePctWithCi(values[3]);

    // Praise vs Complaint
    const praiseVsComplaint = parsePctWithCi(values[4]);

    // Steerability
    const steerability = parsePctWithCi(values[5]);

    // Bash Recovery
    const bashRecovery = parsePctWithCi(values[6]);

    // Tool Hallucination
    const toolHall = parsePctWithCi(values[7]);

    // Sessions
    const sessionsRaw = values[8] || '';
    const sessions = parseInteger(sessionsRaw);

    // Cost/Task (P50)
    const cost = parseDollar(values[9]);

    // Output Tokens/Task (P50)
    const outTokensRaw = values[10] || '';
    const outputTokensP50 = parseTokensK(outTokensRaw);

    // Price $/M
    const pricePerM = (values[11] || '').trim();

    rows.push({
      rank,
      name,
      lab,
      license,
      netImprovementPct: netImpVal,
      netImprovementCi: netImp.ci,
      confirmedSuccessPct: confSuccess.val,
      confirmedSuccessCi: confSuccess.ci,
      praiseVsComplaintPct: praiseVsComplaint.val,
      praiseVsComplaintCi: praiseVsComplaint.ci,
      steerabilityPct: steerability.val,
      bashRecoveryPct: bashRecovery.val,
      toolHallucinationPct: toolHall.val,
      sessions,
      costPerTaskP50Usd: cost,
      outputTokensP50,
      outputTokensP50Raw: outTokensRaw || undefined,
      pricePerM: pricePerM || undefined,
      modelUrl,
    });
  }

  return rows;
}

function parseModelCell(raw: string): { name: string; lab: string; license?: string; modelUrl?: string } {
  let name = '';
  let modelUrl: string | undefined;
  let lab = '';
  let license: string | undefined;

  // Extract Markdown Link [Name](Url)
  const linkMatch = raw.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
  if (linkMatch) {
    name = linkMatch[1].trim();
    modelUrl = linkMatch[2].trim();
  }

  // Break by <br> or newlines
  const parts = raw.split(/<br>|\n/).map((p) => p.trim()).filter(Boolean);

  if (!name && parts.length > 0) {
    // If no markdown link found
    name = parts[0].replace(/<[^>]+>/g, '').trim();
  }

  // Find line with "Lab · License" or similar
  const metadataLine = parts.find((p) => p.includes('·') || p.toLowerCase().includes('proprietary') || p.toLowerCase().includes('mit') || p.toLowerCase().includes('license'));
  if (metadataLine) {
    const metaParts = metadataLine.split('·').map((m) => m.trim());
    if (metaParts.length >= 2) {
      lab = metaParts[0];
      license = metaParts.slice(1).join(' · ');
    } else if (metaParts.length === 1) {
      license = metaParts[0];
    }
  }

  // If lab is still empty, look for a top provider prefix
  if (!lab && parts.length > 1) {
    const firstPart = parts[0].replace(/<[^>]+>/g, '').trim();
    if (firstPart !== name && firstPart.length < 30) {
      lab = firstPart;
    }
  }

  // Final fallbacks
  if (!lab) {
    if (name.includes('Claude')) lab = 'Anthropic';
    else if (name.includes('GPT')) lab = 'OpenAI';
    else if (name.includes('Gemini')) lab = 'Google';
    else if (name.includes('DeepSeek')) lab = 'DeepSeek';
    else if (name.includes('Grok')) lab = 'xAI';
    else if (name.includes('Kimi')) lab = 'Moonshot';
    else if (name.includes('GLM')) lab = 'Z.ai';
    else if (name.includes('Qwen')) lab = 'Alibaba';
    else lab = 'Unknown';
  }

  return { name: name || cleanText(raw), lab, license, modelUrl };
}

function cleanText(text: string): string {
  return text.replace(/\*\*/g, '').replace(/<[^>]+>/g, ' ').trim();
}

function parsePctWithCi(raw?: string): { val: number | null; ci?: number | null } {
  if (!raw || raw === '--' || raw === '—' || raw === 'N/A') return { val: null };
  // format like "12.46%±1.54%" or "12.46%" or "12.46"
  const clean = raw.replace(/%/g, '').trim();
  if (clean.includes('±')) {
    const [valStr, ciStr] = clean.split('±');
    const val = parseFloat(valStr?.trim() || '');
    const ci = parseFloat(ciStr?.trim() || '');
    return {
      val: isNaN(val) ? null : val,
      ci: isNaN(ci) ? null : ci,
    };
  }
  const val = parseFloat(clean);
  return { val: isNaN(val) ? null : val };
}

function parseInteger(raw?: string): number | null {
  if (!raw || raw === '--' || raw === '—' || raw === 'N/A') return null;
  const cleaned = raw.replace(/[,\s]/g, '').trim();
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? null : val;
}

function parseDollar(raw?: string): number | null {
  if (!raw || raw === '--' || raw === '—' || raw === 'N/A') return null;
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function parseTokensK(raw?: string): number | null {
  if (!raw || raw === '--' || raw === '—' || raw === 'N/A') return null;
  const match = raw.match(/([\d.]+)\s*([KM]?)/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const unit = match[2]?.toUpperCase();
  if (unit === 'K') num *= 1000;
  if (unit === 'M') num *= 1000000;
  return Math.round(num);
}