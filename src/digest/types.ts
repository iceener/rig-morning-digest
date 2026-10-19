export type RunStatus = 'ok' | 'retry' | 'fail';

/** One job, aggregated in log line order (the log is append-only). */
export type DigestRow = {
  job: string;
  /** Owner on the job's last valid event; null is displayed as an em dash. */
  owner: string | null;
  /** All valid events for this job, including retries and failures. */
  runs: number;
  /** Events whose status is retry. */
  retries: number;
  lastStatus: RunStatus;
  /** Most recent supplied error, retained after success; null if none occurred. */
  lastError: string | null;
  /** Original at strings from the first/last valid events; preserve their offsets. */
  firstAt: string;
  lastAt: string;
  /** True if any event failed, even if the job later succeeded. */
  hadFailure: boolean;
};

/** Counts of valid log events, not counts of jobs' final statuses. */
export type StatusCounts = Record<RunStatus, number>;

export type NightDigest = {
  /** One row per job, sorted by ascending JavaScript string/code-unit order. */
  rows: DigestRow[];
  /** Nonblank lines with invalid JSON or an invalid event shape. */
  malformedLines: number;
  counts: StatusCounts;
};

/**
 * Implemented as readNight in src/digest/reader.ts; this file is types only.
 *
 * Read runsDir/<night>.jsonl synchronously. night must match YYYY-MM-DD;
 * invalid names and missing files return null (routes map null to HTTP 404).
 * Other filesystem errors propagate rather than masquerading as missing files.
 *
 * An existing empty/blank-only file returns { rows: [], malformedLines: 0,
 * counts: { ok: 0, retry: 0, fail: 0 } }, so views can render "nothing ran".
 * Invalid lines are skipped and counted; a file containing only invalid lines
 * still returns a digest with no rows and its nonzero malformedLines count.
 * Blank lines, including a trailing newline, are ignored.
 *
 * A valid event is an object with nonempty string job, an ISO 8601 at string
 * including an explicit offset (or Z), status ok/retry/fail, owner string/null,
 * and optional string error. Extra fields are ignored. Each accepted event
 * increments exactly one status count, and sum(counts) equals sum(row.runs).
 * Aggregation uses file order, never timezone-normalizes display timestamps,
 * and retains jobs with null owners. All consumers use these same rows.
 */
export type ReadNight = (runsDir: string, night: string) => NightDigest | null;
