/**
 * Batch Keys Export & File Parser Engine
 * 
 * Provides multiple format export capabilities (TXT, CSV with UTF-8 BOM, JSON)
 * and file import parser (.txt, .csv, .json) for API-QuickCheck.
 */

import { KeyCheckResult, BatchKeySummary, KeyHealthStatus } from '../../types/batchKeys';

/**
 * Status translation dictionary for readable exports
 */
export const KEY_STATUS_MAP: Record<KeyHealthStatus, string> = {
  active: '有效可用 (Active)',
  quota_exhausted: '额度耗尽 (Quota Exhausted)',
  invalid: '无效密钥 (Invalid/Unauthorized)',
  rate_limited: '请求限流 (Rate Limited)',
  duplicate: '重复密钥 (Duplicate)',
  network_error: '网络错误 (Network Error)',
  pending: '等待检测 (Pending)',
  testing: '检测中 (Testing)',
};

/**
 * Generates YYYYMMDD date string for export filenames
 */
export function getExportDateString(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Triggers a browser file download using Blob and temporary object URL
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * Export clean, newline-separated API keys as a .txt file
 * 
 * @param keys Array of API keys to export
 * @param filenamePrefix Optional filename prefix, defaults to 'api-keys-active'
 */
export function exportKeysToTxt(
  keys: string[],
  filenamePrefix = 'api-keys-active'
): void {
  const cleanKeys = keys
    .map((k) => k.trim())
    .filter(Boolean);

  const content = cleanKeys.join('\n');
  const dateStr = getExportDateString();
  const filename = `${filenamePrefix}-${dateStr}.txt`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, filename);
}

/**
 * Helper to escape CSV cell contents (wrap in quotes if needed and escape inner quotes)
 */
function escapeCsvCell(val: unknown): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export full test results to a CSV table with UTF-8 BOM to prevent Excel garbled text
 * 
 * @param results Array of KeyCheckResult
 * @param summary Optional BatchKeySummary for metadata header
 */
export function exportResultsToCsv(
  results: KeyCheckResult[],
  summary?: BatchKeySummary
): void {
  const rows: string[] = [];

  // CSV Headers
  const headers = [
    '序号',
    'API Key',
    '脱敏 Key',
    '检测状态',
    '状态代码',
    'HTTP 状态码',
    '延迟 (ms)',
    '余额 / 额度详情',
    '测试探针模型',
    '错误 / 详情说明',
  ];
  rows.push(headers.map(escapeCsvCell).join(','));

  // Data rows
  results.forEach((item, index) => {
    const statusText = KEY_STATUS_MAP[item.status] || item.status;
    const balanceText = item.balance || (item.balanceDetails ? JSON.stringify(item.balanceDetails) : '');
    const latencyText = item.latencyMs !== undefined ? `${item.latencyMs}` : '';
    const httpStatusText = item.httpStatus !== undefined ? `${item.httpStatus}` : '';

    const row = [
      index + 1,
      item.key,
      item.maskedKey || item.key,
      statusText,
      item.status,
      httpStatusText,
      latencyText,
      balanceText,
      item.checkModel || summary?.testModel || '',
      item.errorMessage || '',
    ];
    rows.push(row.map(escapeCsvCell).join(','));
  });

  // Append duplicates if present in summary and not in results
  if (summary?.duplicates && summary.duplicates.length > 0) {
    summary.duplicates.forEach((dupKey, dupIdx) => {
      const row = [
        results.length + dupIdx + 1,
        dupKey,
        dupKey.length > 10 ? `${dupKey.slice(0, 7)}****${dupKey.slice(-4)}` : dupKey,
        KEY_STATUS_MAP.duplicate,
        'duplicate',
        '',
        '',
        '',
        summary.testModel || '',
        '批次内重复 Key (已自动排重)',
      ];
      rows.push(row.map(escapeCsvCell).join(','));
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) to ensure Microsoft Excel parses UTF-8 correctly
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const dateStr = getExportDateString();
  const filename = `api-keys-results-${dateStr}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  triggerBlobDownload(blob, filename);
}

/**
 * Export complete structured batch summary as a formatted JSON file
 * 
 * @param summary BatchKeySummary object
 */
export function exportResultsToJson(summary: BatchKeySummary): void {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    exportApp: 'API-QuickCheck',
    ...summary,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const dateStr = getExportDateString();
  const filename = `api-keys-report-${dateStr}.json`;

  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  triggerBlobDownload(blob, filename);
}

/**
 * Parses uploaded .txt, .csv, or .json file and extracts text keys
 * 
 * @param file File object from file input / drag & drop
 * @returns Promise resolving to newline-separated string of API keys
 */
export async function parseUploadedFile(file: File): Promise<string> {
  const text = await readFileAsText(file);
  const fileName = file.name.toLowerCase();

  // 1. JSON file handler
  if (fileName.endsWith('.json') || file.type === 'application/json') {
    return extractKeysFromJson(text);
  }

  // 2. CSV file handler
  if (fileName.endsWith('.csv') || file.type === 'text/csv') {
    return extractKeysFromCsv(text);
  }

  // 3. Default TXT / other text file handler
  return extractKeysFromPlainText(text);
}

/**
 * Helper to read File as string (supports modern text() API with fallback)
 */
function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string || '');
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Extract keys from JSON text (handles summaries, arrays of strings/objects, results)
 */
function extractKeysFromJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);

    // Case 1: Array of strings ["sk-...", "sk-..."]
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed.map((k) => k.trim()).filter(Boolean).join('\n');
    }

    // Case 2: Array of objects [{ key: "sk-..." }, { apiKey: "sk-..." }]
    if (Array.isArray(parsed)) {
      const keys = parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          return item.key || item.apiKey || item.api_key || item.token || item.secretKey || '';
        })
        .map((k: string) => k.trim())
        .filter(Boolean);

      if (keys.length > 0) {
        return keys.join('\n');
      }
    }

    // Case 3: Object with results array (BatchKeySummary)
    if (parsed && typeof parsed === 'object') {
      const collectedKeys: string[] = [];

      if (Array.isArray(parsed.results)) {
        parsed.results.forEach((r: any) => {
          if (r && typeof r === 'object' && r.key) {
            collectedKeys.push(String(r.key).trim());
          }
        });
      }

      if (Array.isArray(parsed.duplicates)) {
        parsed.duplicates.forEach((d: any) => {
          if (typeof d === 'string' && d.trim()) {
            collectedKeys.push(d.trim());
          }
        });
      }

      if (Array.isArray(parsed.keys)) {
        parsed.keys.forEach((k: any) => {
          if (typeof k === 'string' && k.trim()) {
            collectedKeys.push(k.trim());
          }
        });
      }

      if (collectedKeys.length > 0) {
        return collectedKeys.join('\n');
      }
    }

    // Fallback for generic JSON: regex extraction for key-like tokens or plain string
    return extractKeysFromPlainText(jsonString);
  } catch {
    // If JSON parsing fails, treat as plain text
    return extractKeysFromPlainText(jsonString);
  }
}

/**
 * Extract keys from CSV string (inspects header and column data)
 */
function extractKeysFromCsv(csvText: string): string {
  // Remove UTF-8 BOM if present
  const cleanCsv = csvText.replace(/^\uFEFF/, '');
  const lines = cleanCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  // Determine delimiter (, or \t or ;)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  // Parse CSV line taking quotes into account
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parsedRows = lines.map(parseCsvLine);
  if (parsedRows.length === 0) return '';

  const headerRow = parsedRows[0].map((h) => h.toLowerCase());
  let targetColIndex = -1;

  // Check common key column names in header
  const candidateHeaderNames = ['api key', 'apikey', 'api_key', 'key', '密钥', 'token', 'access_token'];
  for (let i = 0; i < headerRow.length; i++) {
    const h = headerRow[i];
    if (candidateHeaderNames.some((c) => h.includes(c))) {
      targetColIndex = i;
      break;
    }
  }

  // If header found, extract that column starting from row 1
  if (targetColIndex !== -1) {
    const keys = parsedRows
      .slice(1)
      .map((row) => row[targetColIndex])
      .filter((k) => k && k.length > 5 && !k.startsWith('#'));

    if (keys.length > 0) {
      return keys.join('\n');
    }
  }

  // If no header matches, score columns based on key-like heuristics
  const maxCols = Math.max(...parsedRows.map((r) => r.length));
  const colScores = new Array(maxCols).fill(0);

  for (const row of parsedRows) {
    row.forEach((cell, colIdx) => {
      const cleanCell = cell.replace(/^['"]|['"]$/g, '').trim();
      if (cleanCell.length >= 15 && (cleanCell.startsWith('sk-') || cleanCell.startsWith('AIza') || /^[A-Za-z0-9_\-]{20,}$/.test(cleanCell))) {
        colScores[colIdx]++;
      }
    });
  }

  const bestColIdx = colScores.reduce((best, score, idx, arr) => (score > arr[best] ? idx : best), 0);

  if (colScores[bestColIdx] > 0) {
    const startRow = targetColIndex !== -1 ? 1 : 0;
    const extracted = parsedRows
      .slice(startRow)
      .map((r) => (r[bestColIdx] || '').replace(/^['"]|['"]$/g, '').trim())
      .filter((k) => k.length > 5 && !k.startsWith('#'));

    if (extracted.length > 0) {
      return extracted.join('\n');
    }
  }

  // Fallback to plain text processing
  return extractKeysFromPlainText(csvText);
}

/**
 * Extract keys from plain text string
 */
function extractKeysFromPlainText(text: string): string {
  return text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && !l.startsWith('#') && !l.startsWith('//'))
    .join('\n');
}
