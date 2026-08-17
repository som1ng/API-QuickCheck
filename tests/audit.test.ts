import test from 'node:test';
import assert from 'node:assert/strict';
import { BALANCED_SUITE, hashFixture, selectSuite } from '../src/engine/audit/suite';
import { bootstrapDifference, determineConclusion } from '../src/engine/audit/statistics';
import { CapabilityMetric } from '../src/types/audit';
import { validateAnthropicMessage, validateChatCompletionEnvelope, validateResponsesEnvelope } from '../src/engine/audit/protocolValidators';
import { createCodeRepairFixture, createNeedleFixture, scoreCodeRepairResponse, scoreNeedleResponse, summarizeRepeatSamples } from '../src/engine/audit/localFixtures';
import { PROVIDER_ADAPTERS } from '../src/engine/audit/providerAdapters';
import { validateBaselineSnapshot } from '../src/engine/audit/baseline';
import { readSSEEvents } from '../src/engine/transport/sseReader';
import { validateStreamSequence } from '../src/engine/audit/runner';
import { getModelClaims, getProbeRoute } from '../src/engine/audit/capabilityRouting';

test('balanced audit suite contains the planned 24 logical cases', () => {
  assert.equal(BALANCED_SUITE.length, 24);
  assert.equal(selectSuite('quick').length, 4);
  assert.equal(selectSuite('balanced').length, 24);
  assert.deepEqual(selectSuite('quick', ['p2-code-repair-a', 'p0-native-route']).map((item) => item.id), ['p0-native-route', 'p2-code-repair-a']);
});

test('fixture hashes are deterministic', () => {
  assert.equal(hashFixture('model-discovery'), hashFixture('model-discovery'));
  assert.notEqual(hashFixture('model-discovery'), hashFixture('strict-json'));
});

test('bootstrap difference is reproducible from a seed', () => {
  const first = bootstrapDifference([0.8, 0.9, 0.85], [1, 1, 1], 'audit-test-seed', 500);
  const second = bootstrapDifference([0.8, 0.9, 0.85], [1, 1, 1], 'audit-test-seed', 500);
  assert.deepEqual(first, second);
  assert.ok(Math.abs(first.delta + 0.15) < 1e-12);
});

test('conclusion requires two independent degraded domains', () => {
  const metric = (domain: CapabilityMetric['domain'], interval: [number, number]): CapabilityMetric => ({
    domain,
    targetScores: [0.7],
    baselineScores: [1],
    confidenceInterval: interval,
    status: 'fail',
    detail: 'test',
  });

  assert.equal(determineConclusion([metric('reasoning', [-0.2, -0.16])]), 'consistent');
  assert.equal(determineConclusion([
    metric('reasoning', [-0.2, -0.16]),
    metric('tools', [-0.3, -0.2]),
  ]), 'suspect_downgraded');
  assert.equal(determineConclusion([{ ...metric('reasoning', [-0.2, -0.16]), baselineScores: [] }]), 'inconclusive');
});

test('protocol validators distinguish standard envelopes from relayed field drift', () => {
  const responses = validateResponsesEnvelope({
    id: 'resp_test',
    object: 'response',
    model: 'gpt-5.6-sol',
    output: [],
    status: 'completed',
  }, 'gpt-5.6-sol');
  assert.equal(responses.pass, true);

  const chat = validateChatCompletionEnvelope({
    id: 'chatcmpl_test',
    object: 'chat.completion',
    model: 'gemini-3.7-flash',
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: 'ok' } }],
    usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
  }, 'gemini-3.7-flash', false);
  assert.equal(chat.pass, true);

  const anthropic = validateAnthropicMessage({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    content: [{ type: 'thinking', thinking: '...', signature: 'x'.repeat(80) }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 2, output_tokens: 4 },
  }, 'claude-sonnet-5');
  assert.equal(anthropic.pass, true);

  const drifted = validateChatCompletionEnvelope({
    id: 'uuid',
    object: 'chat.completion',
    model: 'cheap-model',
    choices: [],
    usage: { prompt_tokens: '2' },
  }, 'gpt-5.6-sol');
  assert.equal(drifted.pass, false);
  assert.ok(drifted.issues.includes('id_prefix_invalid'));
  assert.ok(drifted.issues.includes('model_mismatch'));
});

test('local needle fixtures are deterministic and score only the expected marker', () => {
  const first = createNeedleFixture('seed-a', 'middle', 100);
  const second = createNeedleFixture('seed-a', 'middle', 100);
  assert.equal(first.document, second.document);
  assert.equal(scoreNeedleResponse(`answer: ${first.expectedAnswer}`, first.expectedAnswer).passed, true);
  assert.equal(scoreNeedleResponse('a plausible but different answer', first.expectedAnswer).passed, false);
});

test('code repair fixtures use deterministic hidden assertions', () => {
  const fixture = createCodeRepairFixture('arithmetic');
  assert.equal(scoreCodeRepairResponse(`${fixture.expectedTokens[0]}\n${fixture.expectedTokens[1]}`, fixture).passed, true);
  assert.equal(scoreCodeRepairResponse('return price + taxRate;', fixture).passed, false);
});

test('repeat quality summary reports success rate and percentiles', () => {
  const summary = summarizeRepeatSamples([
    { ok: true, latencyMs: 10 },
    { ok: false, latencyMs: 20 },
    { ok: true, latencyMs: 30 },
    { ok: true, latencyMs: 40 },
  ]);
  assert.equal(summary.attempts, 4);
  assert.equal(summary.successRate, 0.75);
  assert.equal(summary.p50LatencyMs, 20);
  assert.equal(summary.p95LatencyMs, 30);
});

test('provider adapters preserve tool call identity for continuation requests', () => {
  const response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    data: {
      id: 'resp_123',
      output: [{ type: 'function_call', call_id: 'call_123', name: 'audit_sum', arguments: '{"a":19,"b":23}' }],
    },
    rawText: '',
    latencyMs: 12,
    headers: new Headers(),
  };
  const first = PROVIDER_ADAPTERS.openai.parse(response);
  assert.equal(first.toolCalled, true);
  assert.deepEqual(first.toolCall, { id: 'call_123', name: 'audit_sum', arguments: { a: 19, b: 23 } });
  const continuation = PROVIDER_ADAPTERS.openai.toolContinuation?.('https://api.openai.com/v1', 'key', 'gpt-5.6', first, '42');
  assert.equal(continuation?.body.previous_response_id, 'resp_123');
  assert.deepEqual(continuation?.body.input, [{ type: 'function_call_output', call_id: 'call_123', output: '42' }]);
});

test('provider adapters expose state and cache probe requests with usage parsing', () => {
  const first = PROVIDER_ADAPTERS.openai.parse({
    ok: true,
    status: 200,
    statusText: 'OK',
    data: { id: 'resp_state', output_text: 'acknowledged', usage: { input_tokens_details: { cached_tokens: 12 } } },
    rawText: '',
    latencyMs: 5,
    headers: new Headers(),
  });
  assert.equal(first.usage?.input_tokens_details && (first.usage?.input_tokens_details as Record<string, unknown>).cached_tokens, 12);
  const state = PROVIDER_ADAPTERS.openai.state?.('https://api.openai.com/v1', 'key', 'gpt-5.6', 'STATE_MARKER');
  assert.equal(state?.body.store, true);
  const continuation = PROVIDER_ADAPTERS.openai.stateContinuation?.('https://api.openai.com/v1', 'key', 'gpt-5.6', first, 'STATE_MARKER');
  assert.equal(continuation?.body.previous_response_id, 'resp_state');
  const cache = PROVIDER_ADAPTERS.anthropic.cache?.('https://api.anthropic.com/v1', 'key', 'claude-sonnet-5', 'stable-prefix');
  const cacheContent = (cache?.body.messages as Array<{ content: unknown }>)[0]?.content as Array<Record<string, unknown>>;
  assert.deepEqual(cacheContent[0]?.cache_control, { type: 'ephemeral' });
  assert.equal(getProbeRoute('openai', 'gpt-5.6-sol', 'p1-state-continuity').disposition, 'standard_benchmark');
  assert.equal(getProbeRoute('openai', 'gpt-5.6-sol', 'p1-cache-semantics').disposition, 'standard_benchmark');
  assert.equal(getProbeRoute('openai', 'gpt-5.6-sol', 'p2-code-repair-a').disposition, 'standard_benchmark');
});

test('anthropic adapter builds the standard Messages endpoint from a root URL', () => {
  const basic = PROVIDER_ADAPTERS.anthropic.basic;
  assert.equal(basic('https://relay.example', 'key', 'claude-test').url, 'https://relay.example/v1/messages');
  assert.equal(basic('https://relay.example/v1', 'key', 'claude-test').url, 'https://relay.example/v1/messages');
  assert.equal(basic('https://relay.example/messages', 'key', 'claude-test').url, 'https://relay.example/messages');
});

test('baseline validation rejects malformed capability distributions', () => {
  const valid = {
    schemaVersion: '1.0',
    id: 'official-openai-test',
    provider: 'openai',
    model: 'gpt-5.6',
    surface: 'responses',
    region: 'us',
    serviceTier: 'standard',
    capturedAt: '2026-08-17T00:00:00.000Z',
    fixtureHashes: {},
    protocolEventTypes: [],
    capabilityDistributions: { reasoning: [1], tools: [0.9] },
    runtime: { successRate: 1 },
    estimatedCostUsd: 0,
    source: 'official',
    coverage: { executed: 2, total: 2, unavailable: 0 },
  };
  assert.equal(validateBaselineSnapshot(valid), true);
  assert.equal(validateBaselineSnapshot({ ...valid, capabilityDistributions: { tools: ['0.9'] } }), false);
});

test('SSE wire reader preserves event names and sequence validation rejects missing completion', async () => {
  const response = new Response([
    'event: response.created\n',
    'data: {"type":"response.created"}\n\n',
    'event: response.output_text.delta\n',
    'data: {"type":"response.output_text.delta"}\n\n',
    'event: response.completed\n',
    'data: {"type":"response.completed"}\n\n',
  ].join(''), { headers: { 'Content-Type': 'text/event-stream' } });
  const events = [];
  for await (const event of readSSEEvents(response)) events.push(event.event);
  assert.deepEqual(events, ['response.created', 'response.output_text.delta', 'response.completed']);
  assert.equal(validateStreamSequence('openai', events).pass, true);
  assert.equal(validateStreamSequence('openai', ['response.created', 'response.output_text.delta']).pass, false);
});

test('official claims route supported, unknown, and unsupported probes separately', () => {
  assert.equal(getModelClaims('gemini', 'gemini-3.7-flash')?.claims.contextWindowTokens, 1048576);
  assert.deepEqual(getProbeRoute('gemini', 'gemini-3.7-flash', 'p2-context-start'), {
    state: 'supported',
    disposition: 'standard_benchmark',
    countsTowardOfficialConclusion: true,
    reason: '官方能力声明满足探针要求。',
  });
  assert.equal(getProbeRoute('gemini', 'gemini-3.7-flash', 'p0-stream-events').disposition, 'exploratory_test');
  assert.equal(getProbeRoute('openai', 'gpt-5.6-sol', 'p1-signature-continuity').disposition, 'not_claimed');
  assert.equal(getProbeRoute('openai', 'unknown-model', 'p0-native-route').disposition, 'exploratory_test');
  assert.equal(getProbeRoute('openai', 'unknown-model', 'p2-context-start').disposition, 'not_claimed');
});
