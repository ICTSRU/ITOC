# Changelog — ITOC Index

## [2.1] — 2026-10-12
### Added
- ITOC sign-in landing page on GitHub (`ictsru.github.io/ITOC`): explains that access is with the university e-mail (@sr.edu.sa), then the "تسجيل الدخول بحساب الجامعة" button opens Google sign-in.
- Official header band (SRU / ICTD logos), 3-step guidance, bilingual note.
- Optional "تخطَّ هذه الشاشة في المرات القادمة" checkbox (per browser); open `ictsru.github.io/ITOC/#login` to show the screen again.
### Changed
- Landing page no longer redirects automatically to Google.
- `APP_VERSION` in Code.gs → 2.1 (footer of the index page).

## [2.0] — 2026-10-12
### Changed (major)
- Page moved from public GitHub Pages to a **Google Apps Script Web App** restricted to Google Workspace accounts on **sr.edu.sa** (Google sign-in with university e-mail and password).
- Server-side check: the page is rendered only for `@sr.edu.sa` accounts; others see an "access restricted" page.
- Links now live in a **Google Sheet** (`Sections`, `Links`) instead of `links.js` — add/edit/hide a link by editing a row; no GitHub commit or new version needed.
- Signed-in user e-mail shown in the top bar.
- Web app URL: https://script.google.com/a/macros/sr.edu.sa/s/AKfycbzZ1i1Lt1Y60Gnyr5QYFbJaxQ73IYf12mVnpBHxxQbfyKCc4cyg7RwxFAlcN9SYAYQV/exec
- GitHub repository now holds only a redirect page (`github-redirect/`, URL configured) — `links.js` and internal URLs removed from the public repo.
### Added
- `ITOC` menu in the sheet: one-click setup that creates and fills both sheets with all 66 links (v1.8 content), cache refresh, show web-app URL.
- `hidden` checkbox to hide a link temporarily without deleting it; section dropdown on each link row.
- 10-minute data cache for speed, cleared automatically on any sheet edit.
### Unchanged
- Design, sections, search, keyboard shortcuts, internal-network badges, "جديد" badge.

## [1.8] — 2026-10-12
- Added "منصة الفعاليات" (https://ictsru.github.io/Event/index.html). Total links: 66.
## [1.7] — 2026-10-07
- Added ICTD Policies (https://ictsru.github.io/Policy/).
## [1.6] — 2026-10-06
- Task Manager link → https://ictsru.github.io/ittask/.
## [1.5] — 2026-10-05
- ITOC Tools subtitle updated.
## [1.4] — 2026-10-05
- Added Daily Check (https://ictsru.github.io/daily/).
## [1.3] — 2026-09-30
- Added SOP (https://ictsru.github.io/SOP).
## [1.2] — 2026-09-29
- Smaller ITOC logo.
## [1.1] — 2026-09-29
- Removed "ITOC —" prefix from the heading.
## [1.0] — 2026-09-29
- First release: 62 links in 8 sections from SRU Systems & Services Links v1.2.
