---
id: 1
title: "Digest type contract"
state: closed
labels: ["plan:morning-digest"]
created: "2026-10-19T17:51:48Z"
closed: "2026-10-19T18:06:25Z"
---

Source: plan.md § 1

Scope: Define DigestRow and the readNight(runsDir, night) contract in src/digest/types.ts. Specify the result shape, bad-line count, missing-file behavior, job ordering, nullable owner, status, errors, and unchanged timestamp offsets. Commit this contract before implementation.

Done when: The type contract is committed, and reader, view, JSON, board, and test workers can use it without waiting for the reader implementation.

Blocked by: None

## Closing comment

done: committed the shared digest reader and row type contract
worker: Codex · gpt-6-astra · high
commit: 49ae58a
