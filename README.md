# ITOC — Systems & Services Index (فهرس الأنظمة والخدمات)

Single entry point to every SRU system, service, form and ICTD-built tool — maintained by the IT Operations Center (ITOC), Executive Directorate of Communications & Information Technology, Sulaiman Al Rajhi University.

**Current version:** 1.3 (shown in the page footer)

## Repository structure
```
index.html              Page layout, styling and logic (rarely needs editing)
links.js                ALL links live here — edit this file to update the index
assets/
  sru-logo.png          University logo (header band, right)
  ictd-logo.png         ICTD logo (header band, left)
  itoc-logo.png         ITOC logo (hero + favicon)
  vendor/lucide.min.js  Icon library (bundled so the page works on the internal network)
CHANGELOG.md            Change record
.nojekyll               Tells GitHub Pages to serve files as-is
```

## Publish on GitHub Pages (one-time)
1. Create a repository, e.g. `ictsru/ITOC` (Public).
2. Upload the **contents** of this folder to the repository root (Add file → Upload files) and commit.
3. Settings → Pages → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save.
4. After ~1 minute the page is live at `https://ictsru.github.io/ITOC/`.

## Add / edit / remove a link
1. Open `links.js` on GitHub → pencil icon (Edit).
2. Inside the section you want, add a line:
   ```js
   { name: "New System", url: "https://example.sr.edu.sa/", icon: "globe" },
   ```
   Optional: `ar: true` (Arabic label), `note: "وصف قصير"`, `isNew: true` (shows **جديد** badge).
3. Icons: any name from <https://lucide.dev/icons>.
4. Commit → the live page updates automatically.

To add a whole section, copy an existing `{ id: ..., title: ..., links: [...] }` block; the navbar, counters and search pick it up automatically.

## Built-in features
- Instant search by name, description or URL — press `/` to focus, `Enter` opens the first result, `Esc` clears.
- Links on private IP ranges (10.x, 172.16–31.x, 192.168.x) or single-word hosts are auto-badged **شبكة داخلية** (internal network only).
- Live counters (total links, sections, internal links); sticky section navbar with active-section highlight.
- Responsive (mobile → desktop), RTL, SRU visual identity, print-friendly (URLs printed under each card).

## Versioning
Semantic single-digit minor: 1.0 → 1.1 … 1.9 → 2.0. On each release update the footer version in `index.html`, the `<meta name="version">` tag, and add an entry to `CHANGELOG.md`.
