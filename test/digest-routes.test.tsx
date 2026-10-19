import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RigConfig } from '../src/config.js';
import type { NightDigest } from '../src/digest/types.js';
import { createApp } from '../src/app.js';

const originalLaneMarker = process.env.LANE_MARKER;
let runsDir = '';

function makeApp() {
  const config: RigConfig = {
    adapter: 'shim',
    installed: '2026-10-29T14:06:00+01:00',
    beatEverySeconds: 60,
    runsDir,
  };
  return createApp(config);
}

function event(
  at: string,
  job: string,
  status: 'ok' | 'retry' | 'fail',
  owner: string | null,
  error?: string,
): string {
  return JSON.stringify({ at, job, status, owner, ...(error === undefined ? {} : { error }) });
}

describe('digest routes', () => {
  beforeEach(() => {
    mkdirSync(tmpdir(), { recursive: true });
    runsDir = mkdtempSync(join(tmpdir(), 'digest-routes-'));
    process.env.LANE_MARKER = 'DIGEST-TEST-LANE';

    writeFileSync(
      join(runsDir, '2026-10-28.jsonl'),
      [
        event('2026-10-28T08:00:00+05:30', 'zeta', 'fail', null, 'first failure'),
        event('2026-10-28T08:01:00+05:30', 'zeta', 'retry', null),
        event('2026-10-28T08:02:00+05:30', 'alpha', 'ok', 'Ada'),
        event('2026-10-28T08:03:00+05:30', 'zeta', 'retry', null),
        '{bad json',
        event('2026-10-28T08:04:00+05:30', 'zeta', 'retry', null),
        JSON.stringify({ at: 'not a timestamp', job: 'invalid', status: 'ok', owner: null }),
        event('2026-10-28T08:05:00+05:30', 'zeta', 'ok', null),
      ].join('\n') + '\n',
    );
    writeFileSync(join(runsDir, '2026-10-27.jsonl'), '\n  \n');
  });

  afterEach(() => {
    rmSync(runsDir, { recursive: true, force: true });
    if (originalLaneMarker === undefined) delete process.env.LANE_MARKER;
    else process.env.LANE_MARKER = originalLaneMarker;
  });

  it('returns matching sorted rows in JSON and HTML, preserving nulls and offsets', async () => {
    const app = makeApp();
    const jsonResponse = await app.request('/api/digest/2026-10-28');
    const digest = (await jsonResponse.json()) as NightDigest;
    const htmlResponse = await app.request('/digest/2026-10-28');
    const html = await htmlResponse.text();

    expect(jsonResponse.status).toBe(200);
    expect(htmlResponse.status).toBe(200);
    expect(digest.rows.map((row) => row.job)).toEqual(['alpha', 'zeta']);
    expect(digest.malformedLines).toBe(2);
    expect(digest.counts).toEqual({ ok: 2, retry: 3, fail: 1 });

    const alpha = digest.rows[0]!;
    const zeta = digest.rows[1]!;
    expect(alpha.owner).toBe('Ada');
    expect(alpha.firstAt).toBe('2026-10-28T08:02:00+05:30');
    expect(zeta.owner).toBeNull();
    expect(zeta.runs).toBe(5);
    expect(zeta.retries).toBe(3);
    expect(zeta.lastStatus).toBe('ok');
    expect(zeta.lastError).toBe('first failure');
    expect(zeta.firstAt).toBe('2026-10-28T08:00:00+05:30');
    expect(zeta.lastAt).toBe('2026-10-28T08:05:00+05:30');
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('zeta'));
    expect(html).toContain('DIGEST-TEST-LANE');
    expect(html).toContain('—');
    expect(html).toContain('3 or more retries');
    expect(html).toContain('failure observed');
    expect(html).toContain('2026-10-28T08:00:00+05:30');
    expect(html).toContain('2 malformed lines skipped');
    expect(html).not.toMatch(/<script\b/i);
  });

  it('returns 404 for a night with no file', async () => {
    const app = makeApp();

    expect((await app.request('/digest/2026-10-26')).status).toBe(404);
    const jsonResponse = await app.request('/api/digest/2026-10-26');
    expect(jsonResponse.status).toBe(404);
    expect(await jsonResponse.json()).toEqual({ error: 'Night not found' });
  });

  it('returns an empty digest and renders nothing ran for an existing empty file', async () => {
    const app = makeApp();
    const jsonResponse = await app.request('/api/digest/2026-10-27');
    const htmlResponse = await app.request('/digest/2026-10-27');

    expect(jsonResponse.status).toBe(200);
    expect(await jsonResponse.json()).toEqual({
      rows: [],
      malformedLines: 0,
      counts: { ok: 0, retry: 0, fail: 0 },
    });
    expect(htmlResponse.status).toBe(200);
    expect(await htmlResponse.text()).toContain('nothing ran');
  });

  it('shows temporary nights as digest links with their event counts on the board', async () => {
    const response = await makeApp().request('/');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<a href="/digest/2026-10-28">2026-10-28</a>');
    expect(html).toContain('ok 2');
    expect(html).toContain('retry 3');
    expect(html).toContain('fail 1');
    expect(html).toContain('<a href="/digest/2026-10-27">2026-10-27</a>');
    expect(html).toContain('2026-10-27</a> · ok 0 · retry 0 · fail 0');
  });

  it('returns 404 for an invalid night name', async () => {
    const app = makeApp();

    expect((await app.request('/digest/not-a-date')).status).toBe(404);
    expect((await app.request('/api/digest/not-a-date')).status).toBe(404);
  });
});
