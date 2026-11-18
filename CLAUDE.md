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

Changes to `apps-script/Code.gs` take effect only after updating the script in Google: the clasp login on this Mac sees no scripts (Nov 2026), so the user pastes Code.gs into the sheet's Extensions → Apps Script editor, then Deploy → Manage deployments → edit → New version (keeps the same /exec URL that is in `site/index.html`).

## Notes
- Admin page: `site/admin.html` → https://noa-cosmetics.vercel.app/admin. Login = one-time link emailed to the sheet owner (or `notify_email`). Blocks live in the sheet tab `Blocks` (day `2026-12-25` or hour `2026-12-25_14:00`), cancelled bookings move to `Cancelled`.
- The Apps Script project has 4 ACTIVE web-app deployments (main AKfycbw3n…, plus old AKfycbwesLO0…, AKfycbxXEyeh…, AKfycbyzYrOF…). When deploying a new version, move ALL of them to it (or have the user archive the old three), otherwise old code without protections stays reachable.
- Site JS lives in `site/app.js` and `site/admin.js` (CSP is `script-src 'self'`, no inline scripts). Bump `?v=` in the HTML when changing them.
- Updating Code.gs in the browser: open the project editor, set the Monaco model from the pinned raw GitHub file of the pushed commit, save, then Deploy → Manage deployments → edit → New version.
- Repo is public: never commit secrets, tokens or private data.
- Commit identity is set locally to Dvirda1 / GitHub noreply email.
- `assets/old/Code-old-2026-10-25.gs` has a WhatsApp thank-you message with a navigation link ({map}) and "נעה" signature that the current Code.gs dropped — the user may want it back.
