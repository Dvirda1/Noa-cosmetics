# Noa Cosmetics site — how we work

The user speaks Hebrew and is not a developer: answer in Hebrew, keep explanations simple, avoid jargon.

## Layout
- `site/` — the live website (`index.html` + `images/`). Vercel serves this folder as static files (`vercel.json` → `outputDirectory: site`) plus the functions in `api/`.
- Backend (since 2026-11-19): Vercel functions `api/index.js` (site + admin API at `/api`, same protocol as the old Apps Script) and `api/cron.js` (daily 16:00 UTC: reminders, Noa's summary, cleanup), shared code in `lib/core.js`. Data in Supabase (project `fdxypadepjhosdxszjyl`, Frankfurt, schema in `supabase/schema.sql`, RLS on, only service_role). Mail via Gmail SMTP app password; bookings go to Google Calendar via service account `noa-calendar@noa-cosmetics-515211.iam.gserviceaccount.com` (calendar shared with it, "make changes").
- Vercel env vars (Production): SUPABASE_URL, SUPABASE_SERVICE_KEY, SITE_URL, ADMIN_EMAIL, GMAIL_USER, GMAIL_APP_PASSWORD, GOOGLE_SA_JSON, CALENDAR_ID. Currently Dvir's own Gmail/calendar; to move to Noa: share Noa's calendar with the service account and change CALENDAR_ID (and ADMIN_EMAIL/notify_email if wanted), then redeploy. Env changes need a redeploy (empty commit works).
- Site text/settings now live in the Supabase `content` table, edited from the admin "הגדרות" tab (the Google Sheet is no longer read).
- The built-in browser can't download files or reliably copy from Supabase's copy button: secrets are copied in the user's Chrome.
- `apps-script/` — OLD Google Apps Script backend, no longer used by the site (kept for reference; its deployments can be archived).
- `assets/` — not published: `originals/` (original WhatsApp photos), `design-mockup.jpg`, `old/` (older versions kept for reference).
- The only copy of the project on this Mac is `~/Projects/noa-project`. Do not create copies in Downloads.

## Publishing flow (user's standing instruction)
GitHub: https://github.com/Dvirda1/Noa-cosmetics (branch `main`) → Vercel auto-deploys to https://noa-cosmetics.vercel.app

After making a change the user asked for:
1. Show it in the local preview (`.claude/launch.json`, server "site", http://localhost:5500).
2. Commit with a clear message and `git push origin main` directly — no VS Code needed. Git auth is via GitHub CLI at `~/.local/bin/gh` (credential helper set by `gh auth setup-git`).
3. Wait ~1–2 minutes and check the live site loads (curl https://noa-cosmetics.vercel.app/).

(Legacy) Changes to `apps-script/Code.gs` took effect only after updating the script in Google: the clasp login on this Mac sees no scripts (Nov 2026), so the user pastes Code.gs into the sheet's Extensions → Apps Script editor, then Deploy → Manage deployments → edit → New version (keeps the same /exec URL that is in `site/index.html`).

## Notes
- Admin page: `site/admin.html` → https://noa-cosmetics.vercel.app/admin. Login = one-time link emailed to the sheet owner (or `notify_email`). Blocks live in the sheet tab `Blocks` (day `2026-12-25` or hour `2026-12-25_14:00`), cancelled bookings move to `Cancelled`.
- The Apps Script project has 4 ACTIVE web-app deployments (main AKfycbw3n…, plus old AKfycbwesLO0…, AKfycbxXEyeh…, AKfycbyzYrOF…). When deploying a new version, move ALL of them to it (or have the user archive the old three), otherwise old code without protections stays reachable.
- Site JS lives in `site/app.js` and `site/admin.js` (CSP is `script-src 'self'`, no inline scripts). Bump `?v=` in the HTML when changing them.
- Updating Code.gs in the browser: open the project editor, set the Monaco model from the pinned raw GitHub file of the pushed commit, save, then Deploy → Manage deployments → edit → New version.
- Repo is public: never commit secrets, tokens or private data.
- Commit identity is set locally to Dvirda1 / GitHub noreply email.
- Fridays and Saturdays are always closed in code (`OFF_DAYS` in `lib/core.js`, `w===5||w===6` in app.js, `getDay()>=5` in admin.js); the `closed_weekdays` setting is `5,6`. Reopening Fridays needs all three changed.
- Admin "💗 תודה" button opens WhatsApp with the sheet's `thanks_text` (sent in the admin `list` response as `thanks`); the "sent" mark is stored per phone in localStorage only.
- Apps Script: main deployment is on v17 (Fridays + thanks); the 3 old deployments are still on v16.
- Admin login lasts 180 days per device and renews itself on use (`authed()` in `api/index.js`); deploys never log anyone out. An iPhone home-screen app keeps its own login, separate from Safari. With a password set, log in with email + password — "שכחתי סיסמה" is only for a forgotten password.
- Local previews: open them in a NEW browser tab, never in the tab where the user is logged in to the live admin.
