---
id: 6
title: "Test digest routes"
state: closed
labels: ["plan:morning-digest"]
created: "2026-10-19T17:52:01Z"
closed: "2026-10-19T18:06:46Z"
---

Source: plan.md § 2

Part: 2d. Route tests

Scope: Add app.request() tests for both routes using temporary runs directories. Cover 200, 404, an empty night, a bad line, ordering parity, nullable owners, retries >= 3, failures, and the lane banner. Do not modify runs/.

Done when: pnpm test and pnpm typecheck pass. Route tests prove HTML and JSON agree and malformed lines do not break rendering.

Blocked by: #1; integration needs #2, #3, #4

## Closing comment

done: verified production routes and board behavior with passing tests
worker: Codex · gpt-6-luna · medium
commit: 0f5792c
