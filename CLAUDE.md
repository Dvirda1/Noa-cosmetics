# Noa Cosmetics site — how we work

The user speaks Hebrew and is not a developer: answer in Hebrew, keep explanations simple, avoid jargon.

## Layout
- `site/` — the live website (`index.html` + `images/`). Vercel serves ONLY this folder (`vercel.json` → `outputDirectory: site`).
- `apps-script/` — Google Apps Script backend (bookings, notifications, reminders, content from the sheet). Deployed separately with clasp, NOT by Vercel.
- `assets/` — not published: `originals/` (original WhatsApp photos), `design-mockup.jpg`, `old/` (older versions kept for reference).
- The only copy of the project on this Mac is `~/Projects/noa-project`. Do not create copies in Downloads.

## Publishing flow (user's standing instruction)
GitHub: https://github.com/Dvirda1/Noa-cosmetics (branch `main`) → Vercel auto-deploys to https://noa-cosmetics.vercel.app

After making a change the user asked for:
1. Show it in the local preview (`.claude/launch.json`, server "site", http://localhost:5500).
2. Commit with a clear message and `git push origin main` directly — no VS Code needed. Git auth is via GitHub CLI at `~/.local/bin/gh` (credential helper set by `gh auth setup-git`).
3. Wait ~1–2 minutes and check the live site loads (curl https://noa-cosmetics.vercel.app/).

Changes to `apps-script/Code.gs` also need `clasp push` + `clasp deploy -i <deployment id from README>` to take effect — tell the user, since clasp may need its own login.

## Notes
- Repo is public: never commit secrets, tokens or private data.
- Commit identity is set locally to Dvirda1 / GitHub noreply email.
- `assets/old/Code-old-2026-10-25.gs` has a WhatsApp thank-you message with a navigation link ({map}) and "נעה" signature that the current Code.gs dropped — the user may want it back.
