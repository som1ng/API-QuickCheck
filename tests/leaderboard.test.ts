import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import { parseAaModels } from '../src/engine/leaderboard/parseAaModels';
import { parseArenaAgents } from '../src/engine/leaderboard/parseArenaAgents';

describe('Leaderboard Parsers', () => {
  test('parseAaModels correctly extracts real Artificial Analysis markdown data', () => {
    if (fs.existsSync('./.firecrawl/aa-models.md')) {
      const markdown = fs.readFileSync('./.firecrawl/aa-models.md', 'utf-8');
      const rows = parseAaModels(markdown);
      assert.ok(rows.length >= 200, `Expected at least 200 rows, got ${rows.length}`);
      
      const top = rows[0];
      assert.equal(top.rank, 1);
      assert.equal(top.name, 'Claude Opus 5 (max)');
      assert.equal(top.creator, 'Anthropic');
      assert.equal(top.intelligenceIndex, 63);
      assert.equal(top.costPerTaskUsd, 2.34);
      assert.equal(top.medianTokensPerSec, 59);
      assert.equal(top.latencyFirstChunkSec, 65.29);
      assert.equal(top.totalResponseSec, 73.75);
      assert.equal(top.contextWindow, 1000000);
      assert.ok(top.modelUrl?.includes('claude-opus-5'));
      assert.ok(top.providersUrl?.includes('claude-opus-5/providers'));
    }
  });

  test('parseArenaAgents correctly extracts real Arena Agent markdown data', () => {
    if (fs.existsSync('./.firecrawl/arena-agent.md')) {
      const markdown = fs.readFileSync('./.firecrawl/arena-agent.md', 'utf-8');
      const rows = parseArenaAgents(markdown);
      assert.ok(rows.length >= 50, `Expected at least 50 rows, got ${rows.length}`);
      
      const top = rows[0];
      assert.equal(top.rank, 1);
      assert.equal(top.name, 'Claude Opus 5 (High)');
      assert.equal(top.lab, 'Anthropic');
      assert.equal(top.netImprovementPct, 12.46);
      assert.equal(top.netImprovementCi, 1.54);
      assert.equal(top.confirmedSuccessPct, 15.39);
      assert.equal(top.confirmedSuccessCi, 3.16);
      assert.equal(top.praiseVsComplaintPct, 20.48);
      assert.equal(top.toolHallucinationPct, 1.04);
      assert.equal(top.sessions, 19785);
      assert.equal(top.costPerTaskP50Usd, 1.71);
      assert.equal(top.outputTokensP50, 23900);
      assert.equal(top.pricePerM, '$5 / $25');
    }
  });

  test('parseAaModels handles edge cases, empty values and unit suffixes', () => {
    const markdown = `
| Model | Context Window | Creator | Artificial Analysis Intelligence Index | Cost per TaskUSD | MedianTokens/s | LatencyFirst Chunk (s) | TotalResponse (s) | Further Analysis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Test Model 1 | 128k | ![OpenAI](https://img/openai.svg)OpenAI | 65* | $0.50 | 120 | 0.85s | 2.10s | [Model](https://m1) |
| Test Model 2 | 1.5M | Anthropic | -- | -- | -- | -- | -- | -- |
    `;
    const rows = parseAaModels(markdown);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'Test Model 1');
    assert.equal(rows[0].contextWindow, 128000);
    assert.equal(rows[0].creator, 'OpenAI');
    assert.equal(rows[0].creatorLogo, 'https://img/openai.svg');
    assert.equal(rows[0].intelligenceIndex, 65);
    assert.equal(rows[0].estimated, true);
    assert.equal(rows[0].costPerTaskUsd, 0.50);
    assert.equal(rows[0].medianTokensPerSec, 120);

    assert.equal(rows[1].name, 'Test Model 2');
    assert.equal(rows[1].contextWindow, 1500000);
    assert.equal(rows[1].intelligenceIndex, null);
    assert.equal(rows[1].costPerTaskUsd, null);
  });
});