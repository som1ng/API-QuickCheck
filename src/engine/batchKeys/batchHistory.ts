/**
 * Batch Keys History & LocalStorage Persistence Manager
 * 
 * Manages local persistence for batch testing results and history records.
 * Retains up to 20 batches sorted in reverse chronological order.
 */

import { BatchKeySummary } from '../../types/batchKeys';

export const BATCH_HISTORY_STORAGE_KEY = 'api_quickcheck_batch_history';
export const MAX_BATCH_HISTORY_ITEMS = 20;

/**
 * Generate a unique ID for a batch record
 */
export function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Retrieves all saved batch test history items from localStorage
 * 
 * @returns Array of BatchKeySummary sorted descending by timestamp
 */
export function getBatchHistory(): BatchKeySummary[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(BATCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sort descending by timestamp (newest first)
    return parsed.sort((a: BatchKeySummary, b: BatchKeySummary) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error('[BatchHistory] Failed to read batch history from localStorage:', err);
    return [];
  }
}

/**
 * Saves or updates a batch test summary in localStorage
 * Automatically ensures an ID and timestamp, maintains reverse chronological order,
 * and caps history at MAX_BATCH_HISTORY_ITEMS (20).
 * 
 * @param summary BatchKeySummary to persist
 */
export function saveBatchHistory(summary: BatchKeySummary): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const currentList = getBatchHistory();

    const itemToSave: BatchKeySummary = {
      ...summary,
      id: summary.id || generateBatchId(),
      timestamp: summary.timestamp || Date.now(),
    };

    // Filter out existing record if it has the same ID
    const remainingList = currentList.filter(
      (item) => String(item.id) !== String(itemToSave.id)
    );

    // Insert at the front (newest first)
    const updatedList = [itemToSave, ...remainingList].slice(0, MAX_BATCH_HISTORY_ITEMS);

    localStorage.setItem(BATCH_HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('[BatchHistory] Failed to save batch history item:', err);
    // If quota exceeded, try trimming to 10 items
    try {
      const currentList = getBatchHistory().slice(0, 10);
      const itemToSave: BatchKeySummary = {
        ...summary,
        id: summary.id || generateBatchId(),
        timestamp: summary.timestamp || Date.now(),
      };
      const trimmed = [itemToSave, ...currentList.filter((i) => String(i.id) !== String(itemToSave.id))].slice(0, 10);
      localStorage.setItem(BATCH_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      /* ignore storage failure */
    }
  }
}

/**
 * Deletes a single batch history record by ID
 * 
 * @param id Identifier of the batch record to delete
 */
export function deleteBatchHistoryItem(id: string | number): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const currentList = getBatchHistory();
    const updatedList = currentList.filter((item) => String(item.id) !== String(id));
    localStorage.setItem(BATCH_HISTORY_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('[BatchHistory] Failed to delete batch history item:', err);
  }
}

/**
 * Clears all batch history records from localStorage
 */
export function clearBatchHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(BATCH_HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('[BatchHistory] Failed to clear batch history:', err);
  }
}

/**
 * Retrieves a single batch history item by ID
 */
export function getBatchHistoryItemById(id: string | number): BatchKeySummary | undefined {
  const list = getBatchHistory();
  return list.find((item) => String(item.id) === String(id));
}
