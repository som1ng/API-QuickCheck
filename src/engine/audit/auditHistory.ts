/**
 * Relay Protocol Audit History & LocalStorage Persistence Manager
 * 
 * Retains up to 20 historical audit reports sorted in reverse chronological order.
 * Strictly free of emoji; uses structured telemetry & metadata.
 */

import { AuditReportV4 } from '../../types/audit';

export const AUDIT_HISTORY_STORAGE_KEY = 'api_quickcheck_audit_history';
export const MAX_AUDIT_HISTORY_ITEMS = 20;

export interface AuditHistoryItem {
  id: string;
  timestamp: number;
  model: string;
  provider: string;
  baseUrl: string;
  score: number;
  passCount: number;
  totalCount: number;
  conclusion: string;
  p50LatencyMs?: number;
  report: AuditReportV4;
}

/**
 * Calculates overall protocol score (0 - 100) from an AuditReportV4
 */
export function calculateReportScore(report: AuditReportV4): number {
  if (!report.protocol || report.protocol.length === 0) return 0;
  const passes = report.protocol.filter((p) => p.status === 'pass').length;
  return Math.round((passes / report.protocol.length) * 100);
}

/**
 * Retrieves all saved audit reports from localStorage
 */
export function getAuditHistory(): AuditHistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.sort((a: AuditHistoryItem, b: AuditHistoryItem) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error('[AuditHistory] Failed to read history from localStorage:', err);
    return [];
  }
}

/**
 * Saves an AuditReportV4 into history
 */
export function saveAuditHistory(report: AuditReportV4): AuditHistoryItem | null {
  if (typeof window === 'undefined' || !window.localStorage || !report) {
    return null;
  }

  try {
    const history = getAuditHistory();
    const passes = report.protocol ? report.protocol.filter((p) => p.status === 'pass').length : 0;
    const total = report.protocol ? report.protocol.length : 0;
    const score = total > 0 ? Math.round((passes / total) * 100) : 0;

    const latencies = (report.protocol || [])
      .map((p) => p.latencyMs || 0)
      .filter((l) => l > 0)
      .sort((a, b) => a - b);
    const p50 = report.runtime?.p50LatencyMs || (latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)] : undefined);

    const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const newItem: AuditHistoryItem = {
      id,
      timestamp: report.testedAt ? new Date(report.testedAt).getTime() : Date.now(),
      model: report.target?.model || 'unknown',
      provider: report.target?.provider || 'auto',
      baseUrl: report.target?.baseUrl || '',
      score,
      passCount: passes,
      totalCount: total,
      conclusion: report.conclusion || 'consistent',
      p50LatencyMs: p50,
      report,
    };

    // Filter out potential duplicate at exact same timestamp and model
    const filtered = history.filter((item) => !(item.timestamp === newItem.timestamp && item.model === newItem.model));

    const updated = [newItem, ...filtered].slice(0, MAX_AUDIT_HISTORY_ITEMS);
    localStorage.setItem(AUDIT_HISTORY_STORAGE_KEY, JSON.stringify(updated));

    return newItem;
  } catch (err) {
    console.error('[AuditHistory] Failed to save history to localStorage:', err);
    return null;
  }
}

/**
 * Deletes a single history item by ID
 */
export function deleteAuditHistoryItem(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const history = getAuditHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(AUDIT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[AuditHistory] Failed to delete item:', err);
  }
}

/**
 * Clears all audit history
 */
export function clearAuditHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    localStorage.removeItem(AUDIT_HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('[AuditHistory] Failed to clear history:', err);
  }
}

/**
 * Exports an AuditReportV4 to a structured JSON file and triggers browser download
 */
export function exportAuditReportToJson(report: AuditReportV4): void {
  if (typeof window === 'undefined') return;

  try {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const safeModelName = (report.target?.model || 'model').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestampStr = new Date(report.testedAt || Date.now()).toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = 'apiqc_audit_' + safeModelName + '_' + timestampStr + '.json';

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[AuditHistory] Failed to export JSON:', err);
  }
}
