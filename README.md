# rig

Keeps a lane's lights on while nobody is in it: a heartbeat every minute, a status board, and
(next) a morning digest of what ran overnight.

```sh
cp .env.example .env   # set LANE_MARKER
pnpm install
pnpm dev               # http://localhost:8787
```

Working on it with an agent: start at [AGENTS.md](AGENTS.md).

## Temporary digest review copy

With rig running and `LANE_MARKER` set in `.env`, export the digest as one self-contained HTML
file outside this repository:

```sh
pnpm export-preview /tmp/rig-digest-2026-10-28.html
```

The command fetches the local `/digest/2026-10-28`, checks the lane marker and that the page has no
scripts or external assets, then writes the file. Remove the exported file after review; do not
commit it or attach it to an issue or chat.
