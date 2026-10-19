# 0005 · Morning digest uses the file tracker

- Status: accepted · 2026-10-19 · approved by the human
- Amends: 0004, for `morning-digest` only

## Context

The morning-digest plan was split into eight public GitHub issues on 19 October 2026.
The issues have the required source references and `plan:morning-digest` label. Their
structure and visibility are valid, but the course repeatedly rejected section coverage.

The human checked the cause: the course counts only GitHub issues created on or after
the Challenge opens, 29 October 2026. Our issues were created before that date, so they
are not eligible. Changing their wording, labels, or state cannot change their creation
date. The course does not apply this date filter to issue files.

GitHub is reachable from this lane. This is an explicit, human-approved exception to
0004's restriction on moving a plan that already has GitHub issues to files.

## Decision

1. `docs/issues/` is now the only authoritative tracker for `morning-digest`. Use one
   numbered file per approved issue, with the frontmatter and closing-comment format
   from 0004. The default branch holds the current state.
2. Keep issue IDs 1–8, their source sections, dependencies, original timestamps, and
   worker completion records. Issues 1–6 are complete. Issues 7 and 8 remain open until
   their submission and cleanup conditions hold.
3. Preserve all GitHub issues as historical records. Do not delete them. Close the open
   GitHub issues as superseded, with a comment linking to their corresponding files.
   Add the file link to the completed GitHub issues too. GitHub closure during this
   migration means the tracker moved; it does not complete open work in the file tracker.
4. Later state changes for this plan are committed and pushed only in `docs/issues/`.
   The GitHub issues are no longer maintained as a second tracker.

## Consequences

The course can read the complete plan split from the repository without the GitHub
issue-date filter. History remains available in both GitHub and git, while only the
files determine current work state. Other plans still follow 0004's GitHub-first rule.
