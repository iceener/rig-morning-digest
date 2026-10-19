import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, NightDigest, ReadNight, RunStatus } from './types.js';

type RunEvent = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/.exec(value);
  if (!parts || parts[0] !== value) return false;
  const [, yearText, monthText, dayText] = parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

function isRunEvent(value: unknown): value is RunEvent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return typeof event.job === 'string' && event.job.length > 0
    && isTimestamp(event.at)
    && (event.status === 'ok' || event.status === 'retry' || event.status === 'fail')
    && (event.owner === null || typeof event.owner === 'string')
    && (!('error' in event) || typeof event.error === 'string');
}

export const readNight: ReadNight = (runsDir, night) => {
  if (night.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;

  let content: string;
  try {
    content = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }

  const digest: NightDigest = { rows: [], malformedLines: 0, counts: { ok: 0, retry: 0, fail: 0 } };
  const jobs = new Map<string, DigestRow>();
  for (const line of content.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    let event: unknown;
    try {
      event = JSON.parse(line);
    } catch {
      digest.malformedLines += 1;
      continue;
    }
    if (!isRunEvent(event)) {
      digest.malformedLines += 1;
      continue;
    }

    digest.counts[event.status] += 1;
    const row = jobs.get(event.job);
    if (row) {
      row.owner = event.owner;
      row.runs += 1;
      row.retries += Number(event.status === 'retry');
      row.lastStatus = event.status;
      if (event.error !== undefined) row.lastError = event.error;
      row.lastAt = event.at;
      row.hadFailure ||= event.status === 'fail';
    } else {
      jobs.set(event.job, {
        job: event.job,
        owner: event.owner,
        runs: 1,
        retries: Number(event.status === 'retry'),
        lastStatus: event.status,
        lastError: event.error ?? null,
        firstAt: event.at,
        lastAt: event.at,
        hadFailure: event.status === 'fail',
      });
    }
  }
  digest.rows = [...jobs.values()].sort((a, b) => a.job < b.job ? -1 : a.job > b.job ? 1 : 0);
  return digest;
};
