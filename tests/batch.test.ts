import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maskApiKey,
  parseBatchInput,
  mapConcurrent,
  exportValidEnv,
  exportCsvReport,
} from '../src/engine/audit/batchRunner';
import { BatchAuditReport } from '../src/types/batch';

test('maskApiKey handles various key lengths safely', () => {
  assert.equal(maskApiKey(''), '');
  assert.equal(maskApiKey('sk-1234'), '***');
  assert.equal(maskApiKey('sk-1234567890'), 'sk-...890');
  assert.equal(maskApiKey('sk-ant-api03-1234567890abcdef1234567890'), 'sk-ant...7890');
});

test('parseBatchInput parses JSON array input correctly', () => {
  const jsonInput = JSON.stringify([
    {
      name: 'Primary Relay',
      baseUrl: 'https://relay.ai/v1',
      apiKey: 'sk-relay-12345678',
      models: ['claude-3-7-sonnet', 'gpt-4o'],
    },
    {
      name: 'DeepSeek Direct',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: 'sk-deepseek-87654321',
      models: ['deepseek-r1'],
    },
  ]);

  const items = parseBatchInput(jsonInput);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Primary Relay');
  assert.equal(items[0].baseUrl, 'https://relay.ai/v1');
  assert.equal(items[0].apiKey, 'sk-relay-12345678');
  assert.deepEqual(items[0].models, ['claude-3-7-sonnet', 'gpt-4o']);

  assert.equal(items[1].name, 'DeepSeek Direct');
  assert.equal(items[1].baseUrl, 'https://api.deepseek.com/v1');
  assert.deepEqual(items[1].models, ['deepseek-r1']);
});

test('parseBatchInput parses CSV format with headers or lines', () => {
  const csvInput = `
# Name,BaseUrl,ApiKey,Models
RelayA,https://api.relaya.com/v1,sk-relaya-123456,claude-3-7-sonnet
RelayB,https://api.relayb.com/v1,sk-relayb-654321,gpt-4o
`;

  const items = parseBatchInput(csvInput);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'RelayA');
  assert.equal(items[0].baseUrl, 'https://api.relaya.com/v1');
  assert.equal(items[0].apiKey, 'sk-relaya-123456');
  assert.deepEqual(items[0].models, ['claude-3-7-sonnet']);

  assert.equal(items[1].name, 'RelayB');
  assert.equal(items[1].baseUrl, 'https://api.relayb.com/v1');
  assert.equal(items[1].apiKey, 'sk-relayb-654321');
  assert.deepEqual(items[1].models, ['gpt-4o']);
});

test('parseBatchInput parses .env format correctly with provider heuristics', () => {
  const envInput = `
# Environment keys
OPENAI_API_KEY=sk-openai-1234567890abcdef
ANTHROPIC_API_KEY=sk-ant-1234567890abcdef
DEEPSEEK_API_KEY=sk-deepseek-1234567890abcdef
`;

  const items = parseBatchInput(envInput);
  assert.equal(items.length, 3);
  assert.equal(items[0].name, 'OPENAI_API_KEY');
  assert.equal(items[0].apiKey, 'sk-openai-1234567890abcdef');
  assert.equal(items[0].baseUrl, 'https://api.openai.com/v1');

  assert.equal(items[1].name, 'ANTHROPIC_API_KEY');
  assert.equal(items[1].baseUrl, 'https://api.anthropic.com/v1');

  assert.equal(items[2].name, 'DEEPSEEK_API_KEY');
  assert.equal(items[2].baseUrl, 'https://api.deepseek.com/v1');
});

test('parseBatchInput parses plain line-by-line keys', () => {
  const plainInput = `
sk-11111111111111111111
sk-22222222222222222222
`;

  const items = parseBatchInput(plainInput, 'https://custom-proxy.com/v1', ['gpt-4o']);
  assert.equal(items.length, 2);
  assert.equal(items[0].apiKey, 'sk-11111111111111111111');
  assert.equal(items[0].baseUrl, 'https://custom-proxy.com/v1');
  assert.deepEqual(items[0].models, ['gpt-4o']);
});

test('mapConcurrent respects concurrency bounds', async () => {
  let activeConcurrency = 0;
  let maxObservedConcurrency = 0;

  const testItems = Array.from({ length: 15 }, (_, i) => i);

  const results = await mapConcurrent(testItems, 3, async (num) => {
    activeConcurrency++;
    if (activeConcurrency > maxObservedConcurrency) {
      maxObservedConcurrency = activeConcurrency;
    }
    await new Promise((r) => setTimeout(r, 10));
    activeConcurrency--;
    return num * 2;
  });

  assert.equal(results.length, 15);
  assert.equal(results[0], 0);
  assert.equal(results[14], 28);
  assert.ok(maxObservedConcurrency <= 3, `Max observed concurrency was ${maxObservedConcurrency}`);
});

test('exportValidEnv and exportCsvReport generate structured outputs', () => {
  const mockReport: BatchAuditReport = {
    summary: {
      totalKeys: 2,
      healthyKeys: 1,
      degradedKeys: 0,
      deadKeys: 1,
      totalModelProbes: 2,
      passedModelProbes: 1,
      failedModelProbes: 1,
      durationMs: 150,
      asOf: '2026-08-30T00:00:00.000Z',
    },
    results: [
      {
        id: 'key-1',
        name: 'Relay Alpha',
        baseUrl: 'https://api.relay.com/v1',
        maskedKey: 'sk-1234...cdef',
        rawKey: 'sk-12345678cdef',
        overallStatus: 'healthy',
        testedModels: [
          {
            model: 'claude-3-7-sonnet',
            status: 'alive',
            httpStatus: 200,
            verdict: 'genuine',
            genuineScore: 95,
            latencyMs: 250,
            tps: 60,
          },
        ],
        successCount: 1,
        failedCount: 0,
        avgLatencyMs: 250,
        maxGenuineScore: 95,
        testedAt: '2026-08-30T00:00:00.000Z',
      },
      {
        id: 'key-2',
        name: 'Dead Relay',
        baseUrl: 'https://api.dead.com/v1',
        maskedKey: 'sk-9999...0000',
        rawKey: 'sk-999999990000',
        overallStatus: 'dead',
        testedModels: [
          {
            model: 'gpt-4o',
            status: 'invalid_key',
            httpStatus: 401,
            verdict: 'error',
            error: 'HTTP 401 Unauthorized',
          },
        ],
        successCount: 0,
        failedCount: 1,
        errorSummary: 'HTTP 401 Unauthorized',
        testedAt: '2026-08-30T00:00:00.000Z',
      },
    ],
    validKeys: [
      {
        name: 'Relay Alpha',
        baseUrl: 'https://api.relay.com/v1',
        apiKey: 'sk-12345678cdef',
        supportedModels: ['claude-3-7-sonnet'],
        avgLatencyMs: 250,
      },
    ],
  };

  const envStr = exportValidEnv(mockReport);
  assert.ok(envStr.includes('RELAY_ALPHA_BASE_URL="https://api.relay.com/v1"'));
  assert.ok(envStr.includes('RELAY_ALPHA_API_KEY="sk-12345678cdef"'));
  assert.ok(!envStr.includes('sk-999999990000')); // Dead key excluded

  const csvStr = exportCsvReport(mockReport);
  assert.ok(csvStr.includes('"Relay Alpha"'));
  assert.ok(csvStr.includes('"claude-3-7-sonnet"'));
  assert.ok(csvStr.includes('"Dead Relay"'));
  assert.ok(csvStr.includes('"invalid_key"'));
});

