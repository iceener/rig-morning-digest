---
id: 4
title: "Serve digest JSON"
state: closed
labels: ["plan:morning-digest"]
created: "2026-10-19T17:51:56Z"
closed: "2026-10-19T18:06:37Z"
---

Source: plan.md § 2

Part: 2b. JSON

Scope: Implement GET /api/digest/:night from the same reader and job ordering used by the page. Preserve nulls in JSON. Handle missing and empty nights consistently with the page.

Done when: The JSON for 2026-10-28 has the same jobs in the same order as HTML. Missing file returns 404; empty file returns an empty row list.

Blocked by: #1; integration needs #2

## Closing comment

done: served the same digest data through the JSON route
worker: Codex · gpt-6-luna · medium
commit: a78517a
