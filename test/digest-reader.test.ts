import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readNight } from '../src/digest/reader.js';

const night = '2026-10-28';
const event = { at: '2026-10-28T23:00:00+01:00', job: 'job', status: 'ok', owner: 'rook' };
const empty = { rows: [], malformedLines: 0, counts: { ok: 0, retry: 0, fail: 0 } };
let runsDir: string;

beforeEach(() => { runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-')); });
afterEach(() => { rmSync(runsDir, { recursive: true, force: true }); });

function writeEvents(events: unknown[]) {
  writeFileSync(join(runsDir, `${night}.jsonl`), events.map((value) => JSON.stringify(value)).join('\n'));
}

describe('readNight', () => {
  it('reads the real night without modifying it', () => {
    const digest = readNight('runs', night);
    expect(digest?.malformedLines).toBe(1);
    expect(digest?.counts).toEqual({ ok: 10, retry: 4, fail: 1 });
    expect(digest?.rows.map((row) => row.job)).toEqual([
      'digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs',
    ]);
    expect(digest?.rows[0].owner).toBeNull();
    expect(digest?.rows[1]).toEqual({
      job: 'fixtures/refresh', owner: 'rook', runs: 4, retries: 3, lastStatus: 'ok',
      lastError: 'upstream 503', firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00', hadFailure: false,
    });
    expect(digest?.rows[3].hadFailure).toBe(true);
  });

  it('distinguishes missing files from empty and whitespace-only files', () => {
    expect(readNight(runsDir, night)).toBeNull();
    writeFileSync(join(runsDir, `${night}.jsonl`), '');
    expect(readNight(runsDir, night)).toEqual(empty);
    writeFileSync(join(runsDir, `${night}.jsonl`), ' \r\n\t\n\n');
    expect(readNight(runsDir, night)).toEqual(empty);
  });

  it('rejects invalid night names before resolving a path', () => {
    writeEvents([event]);
    for (const name of ['../2026-10-28', '2026-10-28.jsonl', '/2026-10-28', '2026-10-28\n', '2026-1-1']) {
      expect(readNight(runsDir, name)).toBeNull();
    }
  });

  it('propagates filesystem errors other than a missing file', () => {
    mkdirSync(join(runsDir, `${night}.jsonl`));
    expect(() => readNight(runsDir, night)).toThrow();
  });

  it('skips malformed JSON while retaining valid records around it and ignoring blank lines', () => {
    writeFileSync(join(runsDir, `${night}.jsonl`),
      `${JSON.stringify(event)}\r\n{bad json\r\n \r\n${JSON.stringify({ ...event, status: 'retry' })}\n`);
    const digest = readNight(runsDir, night);
    expect(digest?.malformedLines).toBe(1);
    expect(digest?.counts).toEqual({ ok: 1, retry: 1, fail: 0 });
    expect(digest?.rows[0].runs).toBe(2);
  });

  it('counts invalid record shapes without turning them into jobs', () => {
    const invalid = [null, [], true, 42, 'event', {},
      { ...event, job: '' }, { ...event, job: 1 }, { ...event, status: 'unknown' },
      { ...event, owner: undefined }, { ...event, owner: false }, { ...event, error: null },
      { ...event, at: 'yesterday' }, { ...event, at: '2026-10-28T23:00:00' },
      { ...event, at: '2026-02-29T23:00:00Z' }, { ...event, at: '2026-04-31T23:00:00Z' },
      { ...event, at: '2026-13-01T00:00:00Z' }, { ...event, at: '2026-10-28T25:00:00Z' },
      { ...event, at: '2026-10-28T23:00:00+24:00' },
    ];
    writeEvents(invalid);
    expect(readNight(runsDir, night)).toEqual({ ...empty, malformedLines: invalid.length });
  });

  it('retains failures and the last supplied error after success, with latest nullable owner', () => {
    writeEvents([
      { ...event, status: 'fail', error: 'first error' },
      { ...event, status: 'retry', error: 'latest error' },
      { ...event, owner: null },
    ]);
    const digest = readNight(runsDir, night);
    expect(digest?.rows[0]).toMatchObject({
      runs: 3, retries: 1, lastStatus: 'ok', lastError: 'latest error', owner: null, hadFailure: true,
    });
    expect(digest?.counts).toEqual({ ok: 1, retry: 1, fail: 1 });
  });

  it('preserves original offsets and file order even when timestamps are out of chronological order', () => {
    const firstAt = '2028-02-29T23:00:00.123-05:30';
    const lastAt = '2028-02-29T01:00:00Z';
    writeEvents([{ ...event, at: firstAt }, { ...event, at: lastAt, error: '' }]);
    expect(readNight(runsDir, night)?.rows[0]).toMatchObject({ firstAt, lastAt, lastError: '' });
  });

  it('sorts jobs by code units and accepts extra fields and prototype-like job names', () => {
    writeEvents(['a', '__proto__', 'Z'].map((job) => ({ ...event, job, extra: { ignored: true } })));
    const digest = readNight(runsDir, night);
    expect(digest?.rows.map((row) => row.job)).toEqual(['Z', '__proto__', 'a']);
    expect(digest?.rows.every((row) => row.lastError === null && !row.hadFailure)).toBe(true);
    expect(digest?.counts).toEqual({ ok: 3, retry: 0, fail: 0 });
  });
});
