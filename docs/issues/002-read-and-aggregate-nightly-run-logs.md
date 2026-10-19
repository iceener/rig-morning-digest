---
id: 2
title: "Read and aggregate nightly run logs"
state: closed
labels: ["plan:morning-digest"]
created: "2026-10-19T17:51:51Z"
closed: "2026-10-19T18:06:29Z"
---

Source: plan.md § 1

Scope: Implement readNight in src/digest/. Group valid records by job; count runs and retries; retain last status, last error, first and last timestamps. Count malformed lines without throwing. Keep null owners. Preserve original timestamp offsets. Test the real fixture read-only and use temporary files for edge cases.

Done when: The 2026-10-28 fixture yields five jobs and one bad line. Tests cover missing and empty files, malformed records, nullable owners, counts, errors, and timestamp offsets.

Blocked by: #1

## Closing comment

done: implemented and tested the shared nightly run-log reader
worker: Codex · gpt-6-astra · high
commit: 1c849c7
