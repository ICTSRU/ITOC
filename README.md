# ITOC — Systems & Services Index · v2.6
**Access:** Google sign-in, Sulaiman Al Rajhi University accounts (@sr.edu.sa) only.
**Data:** Google Sheet · **Hosting:** Google Apps Script Web App · **Old GitHub link:** redirects to the new page.

## Package contents
```
apps-script/
  Code.gs        Server logic: domain check, reads the sheet, cache, ITOC menu, setup + seed data (66 links)
  Index.html     The page (same design as v1.8)
  Logos.html     SRU, ICTD and ITOC logos (embedded)
  Denied.html    Shown to non-@sr.edu.sa accounts
github-redirect/
  index.html     Replaces the GitHub page; forwards to the web app
  assets/itoc-logo.png  (favicon)
  .nojekyll
```

## Setup (one time, ~10 minutes) — use your @sr.edu.sa account
1. **Create the sheet:** Google Drive → New → Google Sheets → name it `ITOC Index Links`.
2. **Open Apps Script:** Extensions → Apps Script. Rename the project `ITOC Index`.
3. **Add the files:**
   - Replace the content of `Code.gs` with `apps-script/Code.gs`.
   - Click **+ → HTML** three times and create `Index`, `Logos`, `Denied` (no extension), pasting each file's content.
   - Save (Ctrl+S).
4. **Fill the sheet:** go back to the sheet and reload it. A new menu **ITOC** appears → **إعداد الجداول وتعبئة الروابط (أول مرة)** → approve the permission prompt (first run only) → the `Sections` and `Links` sheets are created with all 66 links.
5. **Publish:** in Apps Script → **Deploy → New deployment** → type **Web app**:
   - Description: `ITOC v2.0`
   - Execute as: **Me**
   - Who has access: **Anyone within Sulaiman Al Rajhi University**
   - Deploy → copy the **Web app URL**.
6. **Redirect the old link:** in the GitHub repo `ictsru/ITOC`, delete `links.js` and `assets/vendor/`, upload the contents of `github-redirect/`, and paste the Web app URL into `WEB_APP_URL` in `index.html`.

> The sheet stays private to you. Staff only see the page, never the sheet. To let colleagues edit links, share the sheet with them as **Editor**.

## Everyday use — editing links (no code, no GitHub)
| Task | In the `Links` sheet |
|---|---|
| Add a link | New row: choose `section_id`, type `name`, `url`, optional `icon` (lucide.dev/icons) and `note` |
| Mark as new | Tick `new` |
| Hide temporarily | Tick `hidden` |
| Reorder | Move the row (the page follows the sheet order) |
| Add a section | New row in `Sections` (id, title, subtitle, icon) |

Changes show up on the next page refresh (edits clear the cache automatically; otherwise use **ITOC → تحديث الصفحة الآن**).

## Access list (v2.3)
Tab `AllowedUsers`: `email | name | role | active | notes`. Add a row = grant · untick active = suspend · delete = remove.
Owner (`OWNER_EMAILS`) always allowed. `ACCESS_MODE = 'DOMAIN'` opens the index to every @sr.edu.sa account.

## Access log (v2.2)
Sheet `AccessLog` — one row per sign-in: `timestamp | date | time | day | email | result | version`.
Same user within 30 min = one row. Menu ITOC → ملخص سجل الدخول / حذف سجلات الدخول القديمة.
Keep the spreadsheet private (it contains staff e-mails).

## Updating the code later
Edit the file in Apps Script, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.

## Security notes
- Google enforces sign-in, and the deployment is limited to the sr.edu.sa domain. `Code.gs` also checks the e-mail domain before rendering anything.
- Passwords are entered on Google's own sign-in page only; the app never sees them.
- **Old commits** of the public GitHub repo still contain `links.js` (v1.0–v1.8). To remove internal URLs from public history, delete and recreate the `ITOC` repo with only the redirect files.
