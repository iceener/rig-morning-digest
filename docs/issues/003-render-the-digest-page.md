---
id: 3
title: "Render the digest page"
state: closed
labels: ["plan:morning-digest"]
created: "2026-10-19T17:51:54Z"
closed: "2026-10-19T18:06:32Z"
---

Source: plan.md § 2

Part: 2a. Page

Scope: Implement GET /digest/:night using the shared reader and existing layout. Render one table sorted by job. Show all row fields, null owner as —, and mark retries >= 3 and any failure. Missing file returns 404. Empty file says nothing ran. No client JavaScript.

Done when: /digest/2026-10-28 renders locally with the lane banner and all five jobs. Missing and empty nights behave as specified.

Blocked by: #1; integration needs #2

## Closing comment

done: rendered the digest page with shared rows and lane banner
worker: Codex · gpt-6-luna · medium
commit: 4489a4f
