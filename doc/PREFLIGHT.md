# Preflight v0 (2026-11-05)

Checks run by the orchestrator before any work, by actually executing each item (not by reading configuration).

| Item | Status | Evidence |
|---|---|---|
| Model | OK | Running as Claude Fable 5.1 (`claude-fable-5-1`). |
| Git worktree | OK | `git worktree add` of a throwaway branch then `git worktree remove` + `git branch -D` succeeded. |
| Git push | OK | `git push --dry-run` on `origin` (`https://github.com/IGNF/sols.cartes.gouv.fr.git`): "Everything up-to-date", exit 0. |
| GitHub CLI | OK | `gh auth status`: logged in as `ibrahim-sall`, scopes `repo`, `read:org`. |
| GitHub permission | OK | `gh repo view --json viewerPermission` → `ADMIN` on `IGNF/sols.cartes.gouv.fr`, default branch `main`. |
| Bun | OK | `bun --version` → 1.4.3. |
| Node | OK | `node --version` → v26.5.0. |
| Ports | OK | 8080 (preview), 8081 (accueil), 4200 (catalogue), 5173 (carto), 3000: all free (`ss -ltn`). |
| Network: GPF WFS | OK | `curl https://data.geopf.fr/wfs/ows?SERVICE=WFS&REQUEST=GetCapabilities` → HTTP 200 in 0.5 s. Bare `/wfs` answers 400 (normal OGC error without parameters). |
| Network: gissol CSW | OK | GetRecords → HTTP 200, 157 kB, `numberOfRecordsMatched="7"`, header `access-control-allow-origin: *`. |
| Playwright | OK | `playwright@1.64.1` + Chromium headless shell 156.0.8078.4 installed; launched headless, loaded `http://localhost:8089/` (static Bun server), status 200, read the H1. |
| Figma | OK | `create_session` + `get_metadata` on file `8G2DLGMfv3MoFmf8lRy7rG` returned the pages `1:10969 Couverture` and `0:1 Prototype`. |
| Chrome extension | WARN | No Chrome/browser-extension MCP tools are exposed in this session, so no tab listing was possible. Playwright is used instead for all browser checks. |
| Custom agents | WARN | `.claude/agents/*.md` can be created, but an agent file created mid-session is not loadable (`Agent type 'preflight-ping' not found`). Per `init.md` §4 the orchestrator spawns `general-purpose` agents with the same role prompts; the definition files are still written (X2) for future sessions. |

Hard requirements: all OK. Work proceeds.

Notes
- `rtk` 0.42.4 is installed and wraps shell commands (see `~/.claude/RTK.md`).
- The repository `.gitignore` ignored `/docs`; the folder was renamed to `doc/` (the name used by `CLAUDE.md` and `init.md`) and un-ignored in X1.
- Update (end of session): the `.claude/agents/*.md` files became loadable once merged into `main` (X2); every review after PR #16 used the `reviewer` agent type.
