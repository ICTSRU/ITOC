# Changelog — ITOC Index

## [1.3] — 2026-09-30
### Added
- SOP link (https://ictsru.github.io/SOP) in the "أدوات وتطبيقات ITOC" section, marked "جديد". Total links: 63.

## [1.2] — 2026-09-29
### Changed
- ITOC logo in the page header made smaller (desktop 92px → 68px, mobile 64px → 50px).

## [1.1] — 2026-09-29
### Changed
- Removed the "ITOC —" prefix from the page heading; heading now reads "فهرس الأنظمة والخدمات" (ITOC logo remains beside it).

## [1.0] — 2026-09-29
### Added
- First release of the ITOC Systems & Services Index, built from *SRU Systems & Services Links v1.2*.
- 62 links in 8 sections: ITOC Tools, General & Productivity, Staff Services, Student Services, AI Tools, Ministry of Education, Under Test, Forms.
- New titled section **أدوات وتطبيقات ITOC** grouping the ICTD-built apps (Inventory, Weekly Report, Incident Report, MoM, Certificate Builder, Reports, Interview, Operational Plan) plus Risk Register and Task Manager.
- Data-driven design: all links in `links.js`; page renders sections, navbar and counters automatically.
- Search with keyboard shortcuts, internal-network badges, host shown under each link, print stylesheet.
- Official header band (SRU logo right, ICTD logo left) and ITOC logo; SRU brand tokens (purple #501e8c / #3a1464, blue #0a6eaa, Cairo font).
- Lucide icons bundled locally (v1.48.0) — no dependency on external CDN for icons.

### Changed (vs. source v1.2)
- Risk Register and Task Manager moved from General Services to ITOC Tools.
- Removed ~1.4 MB of embedded base64 images; logos are now separate files in `assets/`.
