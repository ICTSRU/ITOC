/**
 * =====================================================================
 *  ITOC v3.1 — Features.gs  (add this file next to Code.gs)
 * ---------------------------------------------------------------------
 *  1  Personal favourites (⭐)            → sheet Favorites
 *  2  «جديد» expires after NEW_DAYS        → column added_on in Links
 *  3  Report a broken link                → sheet LinkReports + email
 *  4  Announcements bar                   → sheet Announcements
 *  5  Dark mode · 6 Arabic / English      → Index.html (title_en / subtitle_en / note_en columns)
 *  7  Admin statistics page               → ?page=stats  (Stats.html)
 *  8  Weekly email report (Sunday)        → sendWeeklyReport()
 * 10  Service status every 15 minutes     → checkServices() → sheet ServiceStatus
 * 11  Weekly broken-link check            → weeklyLinkCheck()
 *  Menu: ITOC ▸ ترقية الجداول إلى v3.1  ·  ITOC ▸ تفعيل المهام الآلية
 * =====================================================================
 */

/* ------------------------------ Settings ----------------------------- */
const NEW_DAYS            = 14;                       // «جديد» shows for 14 days after added_on
const SHEET_FAVS          = 'Favorites';
const FAV_HEADERS         = ['email', 'url', 'name', 'added'];
const FAV_MAX             = 24;

const SHEET_REPORTS       = 'LinkReports';
const REPORT_HEADERS      = ['timestamp', 'date', 'time', 'email', 'name', 'url', 'note', 'status'];
const REPORT_TO           = OWNER_EMAILS;              // who receives «رابط لا يعمل» emails
const REPORT_THROTTLE_MIN = 360;                       // same user + same link: one report per 6 hours

const SHEET_ANN           = 'Announcements';
const ANN_HEADERS         = ['message', 'message_en', 'type', 'start', 'end', 'active'];
const ANN_CACHE_KEY       = 'itoc_ann_v1';

const SHEET_STATUS        = 'ServiceStatus';
const STATUS_HEADERS      = ['url', 'name', 'status', 'code', 'ms', 'checked', 'since', 'error'];
const STATUS_CACHE_KEY    = 'itoc_status_v1';
const STATUS_TIMEOUT_NOTE = 'Google cannot reach the internal network — internal links are not checked';

const WEEKLY_REPORT_TO    = ['m.elmahdy@sr.edu.sa'];   // add 'nabounar@sr.edu.sa' to copy the CIO
const WEEKLY_HOUR         = 8;                         // Sunday 08:00 (project time zone)
const LINKCHECK_HOUR      = 7;                         // Sunday 07:00

/* English titles used when title_en / subtitle_en are empty in Sections */
const SECTION_EN_DEFAULTS = {
  ictd:     ['ITOC Tools & Apps', 'Forms and applications built by ICTD — Operations'],
  general:  ['General & Productivity', 'University systems and the most used productivity platforms'],
  staff:    ['Staff Services', 'Enterprise systems and services for university staff'],
  students: ['Student Services', 'Digital systems and services for students'],
  ai:       ['AI Tools', 'Approved or widely used generative-AI platforms'],
  moe:      ['Ministry of Education', 'Ministry of Education resources and systems'],
  test:     ['Systems Under Trial', 'Test environments and pilot projects'],
  forms:    ['Forms', 'University request and service forms'],
  useful:   ['Useful Links', 'Handy external platforms and tools for the department']
};

/* ------------------------------ Helpers ------------------------------ */

/** Signed-in user's email when allowed to use ITOC, otherwise ''. */
function currentUser_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  return accessStatus_(email) === 'ok' ? email : '';
}

/** Admin = an OWNER_EMAILS address, or role "admin" (active) in AllowedUsers. */
function isAdmin_(email) {
  if (!email) return false;
  if (OWNER_EMAILS.map(e => e.toLowerCase()).indexOf(email) !== -1) return true;
  const cache = CacheService.getScriptCache();
  let admins = cache.get('acl_admins_v1');
  if (admins) admins = JSON.parse(admins);
  else {
    admins = [];
    try {
      const sh = accessSheet_(false);
      if (sh && sh.getLastRow() > 1) {
        admins = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
          .filter(r => r[0] && String(r[2]).trim().toLowerCase() === 'admin' && r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE')
          .map(r => String(r[0]).trim().toLowerCase());
      }
    } catch (e) { console.error('isAdmin_ failed: ' + e); }
    cache.put('acl_admins_v1', JSON.stringify(admins), ACCESS_CACHE_SECONDS);
  }
  return admins.indexOf(email) !== -1;
}

function sheet_(name, headers, widths, color) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground(color || '#3a1464');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    (widths || []).forEach((w, i) => sh.setColumnWidth(i + 1, w));
  }
  return sh;
}

/** Adds a column to a sheet when its header is missing. Returns the column number. */
function ensureColumn_(sheetName, header, note, checkbox, width) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return 0;
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim().toLowerCase());
  const at = headers.indexOf(header);
  if (at !== -1) return at + 1;
  const col = lastCol + 1;
  sh.getRange(1, col).setValue(header).setFontWeight('bold').setFontColor('#ffffff').setBackground('#501e8c').setNote(note || '');
  if (checkbox) sh.getRange(2, col, Math.max(sh.getLastRow() - 1, 1) + 50, 1).insertCheckboxes();
  if (width) sh.setColumnWidth(col, width);
  return col;
}

/** All columns added since v2.6 — safe to run any number of times (runs from onOpen). */
function ensureColumns_() {
  ensureColumn_(SHEET_LINKS, 'featured', 'علّم لتثبيت الرابط في قسم «الأكثر استخدامًا» أعلى الصفحة', true, 80);
  const c = ensureColumn_(SHEET_LINKS, 'added_on', 'تاريخ الإضافة — يُكتب تلقائيًا عند إضافة رابط جديد، وتظهر شارة «جديد» ' + NEW_DAYS + ' يومًا ثم تختفي', false, 110);
  if (c) SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LINKS).getRange(2, c, 1000, 1).setNumberFormat('yyyy-mm-dd');
  ensureColumn_(SHEET_LINKS, 'note_en', 'الوصف بالإنجليزية (اختياري — يظهر في واجهة English)', false, 240);
  ensureColumn_(SHEET_SECTIONS, 'title_en', 'اسم القسم بالإنجليزية (اختياري)', false, 200);
  ensureColumn_(SHEET_SECTIONS, 'subtitle_en', 'وصف القسم بالإنجليزية (اختياري)', false, 320);
}

/** Days since a date cell (null when empty / not a date). */
function ageDays_(v) {
  if (v === '' || v === null || v === undefined) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 864e5);
}

/** v3.1 rule for the «جديد» badge. */
function isNewLink_(l) {
  const age = ageDays_(l.added_on);
  if (age !== null) return age <= NEW_DAYS;     // dated → automatic, expires after NEW_DAYS
  return isOn_(l['new']);                        // no date → the manual checkbox (as before)
}

/** onEdit helper: writes today's date in added_on when a link URL is entered. */
function stampAddedOn_(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_LINKS || e.range.getLastRow() < 2) return;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
  const cUrl = headers.indexOf('url') + 1, cAdd = headers.indexOf('added_on') + 1;
  if (!cUrl || !cAdd) return;
  if (cUrl < e.range.getColumn() || cUrl > e.range.getLastColumn()) return;
  const r0 = Math.max(e.range.getRow(), 2), n = Math.min(e.range.getLastRow() - r0 + 1, 500);
  const urls = sh.getRange(r0, cUrl, n, 1).getValues();
  const dates = sh.getRange(r0, cAdd, n, 1).getValues();
  let changed = false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    if (String(urls[i][0]).trim() && (dates[i][0] === '' || dates[i][0] === null)) { dates[i][0] = today; changed = true; }
  }
  if (changed) sh.getRange(r0, cAdd, n, 1).setValues(dates);
}

/* -------------------------- 1 · Favourites --------------------------- */

function getFavorites_(email) {
  if (!email) return [];
  const cache = CacheService.getScriptCache();
  const key = 'fav_' + email;
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  let list = [];
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FAVS);
    if (sh && sh.getLastRow() > 1) {
      list = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues()
        .filter(r => String(r[0]).toLowerCase() === email && r[1]).map(r => String(r[1]));
    }
  } catch (e) { console.error('getFavorites_ failed: ' + e); }
  cache.put(key, JSON.stringify(list), 21600);
  return list;
}

/** Page → server: add or remove a favourite. Returns the user's new list of URLs. */
function toggleFavorite(url, name) {
  const email = currentUser_();
  if (!email || !url) throw new Error('غير مصرح');
  url = String(url).slice(0, 500);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(SHEET_FAVS, FAV_HEADERS, [240, 380, 220, 160]);
    const n = sh.getLastRow() - 1;
    const rows = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [];
    let found = -1, mine = 0;
    rows.forEach((r, i) => {
      if (String(r[0]).toLowerCase() !== email) return;
      mine++;
      if (String(r[1]) === url) found = i;
    });
    if (found !== -1) sh.deleteRow(found + 2);
    else if (mine < FAV_MAX) sh.appendRow([email, url, String(name || '').slice(0, 120), new Date()]);
    else throw new Error('الحد الأقصى ' + FAV_MAX + ' رابطًا في المفضلة');
    CacheService.getScriptCache().remove('fav_' + email);
  } finally { lock.releaseLock(); }
  return getFavorites_(email);
}

/* ------------------------ 3 · Report a link -------------------------- */

/** Page → server: report a link that does not work. */
function reportLink(url, name, note) {
  const email = currentUser_();
  if (!email || !url) throw new Error('غير مصرح');
  url = String(url).slice(0, 500); name = String(name || '').slice(0, 120); note = String(note || '').slice(0, 500);
  const cache = CacheService.getScriptCache();
  const key = 'rep_' + Utilities.base64EncodeWebSafe(email + '|' + url).slice(0, 200);
  if (cache.get(key)) return { ok: true, duplicate: true };
  cache.put(key, '1', REPORT_THROTTLE_MIN * 60);

  const now = new Date();
  const f = p => Utilities.formatDate(now, LOG_TIMEZONE, p);
  sheet_(SHEET_REPORTS, REPORT_HEADERS, [170, 100, 80, 240, 200, 360, 300, 90], '#c0392b')
    .appendRow([now, f('yyyy-MM-dd'), f('HH:mm:ss'), email, name, url, note, 'open']);

  try {
    const st = getStatus_()[url];
    MailApp.sendEmail({
      to: REPORT_TO.join(','),
      subject: 'ITOC | بلاغ رابط لا يعمل: ' + name,
      htmlBody: mailShell_('بلاغ عن رابط لا يعمل',
        '<table cellpadding="6" style="border-collapse:collapse;font-size:14px">' +
        row_('الرابط', esc_(name) + '<br><a href="' + esc_(url) + '">' + esc_(url) + '</a>') +
        row_('المُبلِّغ', esc_(email)) +
        row_('الوقت', f('yyyy-MM-dd HH:mm')) +
        row_('الملاحظة', esc_(note || '—')) +
        row_('آخر فحص آلي', st ? statusLabel_(st.s) + (st.c ? ' (HTTP ' + st.c + ')' : '') : 'غير مفحوص') +
        '</table><p style="color:#6b5a80;font-size:13px">لإغلاق البلاغ: صفحة الإحصاءات ▸ البلاغات المفتوحة، أو غيّر status إلى closed في ورقة ' + SHEET_REPORTS + '.</p>')
    });
  } catch (e) { console.error('reportLink mail failed: ' + e); }
  return { ok: true };
}

/** Stats page → server: close a report (admins only). */
function closeReport(rowNo) {
  const email = currentUser_();
  if (!isAdmin_(email)) throw new Error('للمشرفين فقط');
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REPORTS);
  rowNo = Number(rowNo);
  if (!sh || rowNo < 2 || rowNo > sh.getLastRow()) return false;
  sh.getRange(rowNo, 8).setValue('closed by ' + email);
  return true;
}

/* ------------------------- 4 · Announcements ------------------------- */

function getAnnouncements_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(ANN_CACHE_KEY);
  if (hit) return JSON.parse(hit);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rows = readTable_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ANN));
  const list = rows.filter(r => {
    if (!String(r.message || '').trim() || !isOn_(r.active)) return false;
    const s = r.start instanceof Date ? r.start : (r.start ? new Date(r.start) : null);
    const e = r.end instanceof Date ? r.end : (r.end ? new Date(r.end) : null);
    if (s && !isNaN(s) && s > new Date()) return false;
    if (e && !isNaN(e)) { const end = new Date(e); end.setHours(23, 59, 59, 999); if (end < new Date()) return false; }
    return true;
  }).map(r => {
    const msg = String(r.message).trim(), type = String(r.type || 'info').trim().toLowerCase();
    return { id: hash_(msg + '|' + r.start), message: msg, message_en: String(r.message_en || '').trim(),
             type: ['info', 'warning', 'danger', 'success'].indexOf(type) !== -1 ? type : 'info' };
  });
  cache.put(ANN_CACHE_KEY, JSON.stringify(list), CACHE_SECONDS);
  return list;
}

function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(s), Utilities.Charset.UTF_8)
    .slice(0, 6).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}

/* ------------------------- 10 · Service status ----------------------- */

/** Map url → {s: up|down|broken|warn, c: http code, t: checked ISO, ms} (cached). */
function getStatus_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(STATUS_CACHE_KEY);
  if (hit) return JSON.parse(hit);
  const map = {};
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_STATUS);
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, 1, sh.getLastRow() - 1, STATUS_HEADERS.length).getValues().forEach(r => {
        if (r[0]) map[r[0]] = { s: String(r[2]), c: r[3] || 0, ms: r[4] || 0, t: r[5] instanceof Date ? r[5].toISOString() : String(r[5] || '') };
      });
    }
  } catch (e) { console.error('getStatus_ failed: ' + e); }
  try { cache.put(STATUS_CACHE_KEY, JSON.stringify(map), 1200); } catch (e) {}
  return map;
}

/** Page → server: refreshed status map (polled every 5 minutes by the page). */
function getStatus() {
  if (!currentUser_()) throw new Error('غير مصرح');
  return getStatus_();
}

function isInternalUrl_(url) {
  const m = String(url).match(/^https?:\/\/([^\/:?#]+)/i);
  if (!m) return true;
  const h = m[1].toLowerCase();
  return /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.indexOf('.') === -1;
}

function classify_(code) {
  if (!code) return 'down';
  if (code === 404 || code === 410) return 'broken';
  if (code >= 500) return 'down';
  return 'up';                       // 2xx/3xx, and 401/403/405/429 = the service answers (sign-in or bot protection)
}

/** Fetches every external link once. Returns [{url,name,status,code,ms,error}]. */
function probeAll_() {
  const seen = {}, targets = [];
  getData_().forEach(s => s.links.forEach(l => {
    if (seen[l.url] || isInternalUrl_(l.url)) return;
    seen[l.url] = 1; targets.push({ url: l.url, name: l.name });
  }));
  const opts = u => ({ url: u, method: 'get', muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: true,
                       headers: { 'User-Agent': 'Mozilla/5.0 (ITOC status check)' } });
  const out = [];
  for (let i = 0; i < targets.length; i += 15) {
    const batch = targets.slice(i, i + 15);
    const t0 = Date.now();
    let res = null;
    try { res = UrlFetchApp.fetchAll(batch.map(b => opts(b.url))); } catch (e) { res = null; }
    const msAll = Date.now() - t0;
    batch.forEach((b, j) => {
      let code = 0, err = '', ms = msAll;
      if (res) code = res[j].getResponseCode();
      else {                                   // one bad host fails the whole batch → retry one by one
        const t1 = Date.now();
        try { code = UrlFetchApp.fetch(b.url, opts(b.url)).getResponseCode(); }
        catch (e) { err = String(e.message || e).slice(0, 150); }
        ms = Date.now() - t1;
      }
      out.push({ url: b.url, name: b.name, status: classify_(code), code: code, ms: ms, error: err });
    });
  }
  return out;
}

/** Trigger (every 15 minutes): updates ServiceStatus and the page dots. */
function checkServices() {
  const results = probeAll_();
  const prev = getStatusRows_();
  const now = new Date();
  const rows = results.map(r => {
    const p = prev[r.url];
    const since = p && p.status === r.status && p.since ? p.since : now;
    return [r.url, r.name, r.status, r.code, r.ms, now, since, r.error];
  });
  const sh = sheet_(SHEET_STATUS, STATUS_HEADERS, [360, 200, 80, 60, 70, 160, 160, 260]);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, STATUS_HEADERS.length).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, STATUS_HEADERS.length).setValues(rows);
  sh.getRange('F:G').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.getRange('A1').setNote(STATUS_TIMEOUT_NOTE);
  CacheService.getScriptCache().remove(STATUS_CACHE_KEY);
  return results;
}

function getStatusRows_() {
  const map = {};
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_STATUS);
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, STATUS_HEADERS.length).getValues()
      .forEach(r => { if (r[0]) map[r[0]] = { status: String(r[2]), since: r[6] instanceof Date ? r[6] : null }; });
  }
  return map;
}

function statusLabel_(s) {
  return { up: 'متاح', down: 'متوقف', broken: 'الرابط غير موجود (404)', warn: 'تحذير' }[s] || 'غير مفحوص';
}

/* ---------------------- 11 · Weekly broken-link check ---------------- */

/** Trigger (Sunday 07:00): fresh check of all links; emails only when something is wrong. */
function weeklyLinkCheck() {
  const results = checkServices();
  const bad = results.filter(r => r.status !== 'up');
  if (!bad.length) { console.log('weeklyLinkCheck: all ' + results.length + ' links OK'); return 0; }
  MailApp.sendEmail({
    to: WEEKLY_REPORT_TO.join(','),
    subject: 'ITOC | فحص الروابط الأسبوعي: ' + bad.length + ' رابط يحتاج مراجعة',
    htmlBody: mailShell_('فحص الروابط الأسبوعي',
      '<p>فُحص <b>' + results.length + '</b> رابطًا خارجيًا، ويحتاج <b style="color:#c62828">' + bad.length + '</b> منها إلى مراجعة:</p>' +
      badTable_(bad) +
      '<p style="color:#6b5a80;font-size:13px">' + STATUS_TIMEOUT_NOTE + '. عدّل الرابط في ورقة Links أو علّم hidden لإخفائه.</p>')
  });
  return bad.length;
}

function badTable_(bad) {
  return '<table cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">' +
    '<tr style="background:#f0ebf8"><th align="right">الرابط</th><th align="right">الحالة</th><th align="right">HTTP</th></tr>' +
    bad.map(b => '<tr style="border-top:1px solid #eee"><td>' + esc_(b.name) + '<br><a style="font-size:12px" href="' + esc_(b.url) + '">' + esc_(b.url) + '</a></td>' +
      '<td>' + statusLabel_(b.status) + (b.error ? '<br><small>' + esc_(b.error) + '</small>' : '') + '</td><td>' + (b.code || '—') + '</td></tr>').join('') +
    '</table>';
}

/* ---------------------------- 7 · Statistics ------------------------- */

/** Stats page → server (admins only). days = 7 | 30 | 90 */
function getStats(days) {
  const email = currentUser_();
  if (!isAdmin_(email)) throw new Error('للمشرفين فقط');
  return computeStats_(days);
}

function computeStats_(days) {
  days = [7, 30, 90].indexOf(Number(days)) !== -1 ? Number(days) : 30;
  const now = Date.now(), since = new Date(now - days * 864e5), prevSince = new Date(now - 2 * days * 864e5);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = LOG_TIMEZONE;
  const vals = (name, cols) => {
    const sh = ss.getSheetByName(name);
    return sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, cols).getValues().filter(r => r[0] instanceof Date) : [];
  };
  const access = vals(SHEET_LOG, LOG_HEADERS.length);
  const clicks = vals(SHEET_CLICKS, CLICK_HEADERS.length);

  const visits = access.filter(r => r[0] >= since && r[5] === 'دخول');
  const prevVisits = access.filter(r => r[0] >= prevSince && r[0] < since && r[5] === 'دخول').length;
  const denied = access.filter(r => r[0] >= since && r[5] !== 'دخول');
  const cl = clicks.filter(r => r[0] >= since);
  const prevClicks = clicks.filter(r => r[0] >= prevSince && r[0] < since).length;

  // per day (visits), weekday & hour (link opens)
  const daily = [];
  for (let i = days - 1; i >= 0; i--) daily.push({ d: Utilities.formatDate(new Date(now - i * 864e5), tz, 'yyyy-MM-dd'), n: 0 });
  const dIdx = {}; daily.forEach((x, i) => dIdx[x.d] = i);
  visits.forEach(r => { const k = Utilities.formatDate(r[0], tz, 'yyyy-MM-dd'); if (dIdx[k] !== undefined) daily[dIdx[k]].n++; });
  const weekday = [0, 0, 0, 0, 0, 0, 0], hours = new Array(24).fill(0);
  cl.forEach(r => {
    weekday[Number(Utilities.formatDate(r[0], tz, 'u')) % 7]++;
    hours[Number(Utilities.formatDate(r[0], tz, 'H'))]++;
  });

  // top links / users
  const names = {}; getData_().forEach(s => s.links.forEach(l => { names[l.url] = l.name; }));
  const lc = {}; cl.forEach(r => { const u = String(r[5]); lc[u] = (lc[u] || 0) + 1; if (!names[u]) names[u] = String(r[4] || u); });
  const topLinks = Object.keys(lc).sort((a, b) => lc[b] - lc[a]).slice(0, 10).map(u => ({ name: names[u], url: u, n: lc[u] }));
  const users = {};
  const U = e => users[e] = users[e] || { email: e, visits: 0, clicks: 0, last: 0 };
  visits.forEach(r => { const u = U(String(r[4])); u.visits++; u.last = Math.max(u.last, r[0].getTime()); });
  cl.forEach(r => { const u = U(String(r[3])); u.clicks++; u.last = Math.max(u.last, r[0].getTime()); });
  const topUsers = Object.keys(users).map(k => users[k]).sort((a, b) => (b.visits + b.clicks) - (a.visits + a.clicks)).slice(0, 15)
    .map(u => Object.assign(u, { last: Utilities.formatDate(new Date(u.last), tz, 'yyyy-MM-dd HH:mm') }));
  const deniedList = denied.slice(-25).reverse().map(r => ({ when: Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm'), email: String(r[4]), result: String(r[5]) }));

  // reports & status
  const reports = [];
  const rs = ss.getSheetByName(SHEET_REPORTS);
  if (rs && rs.getLastRow() > 1) {
    rs.getRange(2, 1, rs.getLastRow() - 1, REPORT_HEADERS.length).getValues().forEach((r, i) => {
      if (String(r[7]).toLowerCase() === 'open') reports.push({ row: i + 2, when: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : '', email: String(r[3]), name: String(r[4]), url: String(r[5]), note: String(r[6]) });
    });
  }
  const st = getStatus_();
  const status = Object.keys(st).map(u => ({ url: u, name: names[u] || u, s: st[u].s, c: st[u].c, ms: st[u].ms, t: st[u].t }))
    .sort((a, b) => (a.s === 'up') - (b.s === 'up') || String(a.name).localeCompare(String(b.name)));

  return {
    days: days,
    generated: Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm'),
    kpi: {
      visits: visits.length, prevVisits: prevVisits,
      users: Object.keys(visits.reduce((o, r) => (o[r[4]] = 1, o), {})).length,
      clicks: cl.length, prevClicks: prevClicks,
      denied: denied.length,
      reports: reports.length,
      up: status.filter(x => x.s === 'up').length,
      down: status.filter(x => x.s !== 'up').length,
      checked: status.length
    },
    daily: daily, weekday: weekday, hours: hours,
    topLinks: topLinks, topUsers: topUsers, denied: deniedList,
    reports: reports.reverse(), status: status
  };
}

/* ------------------------- 8 · Weekly e-mail ------------------------- */

/** Trigger (Sunday 08:00) — also runnable from the menu to send a test copy now. */
function sendWeeklyReport() {
  const s = computeStats_(7);
  const k = s.kpi;
  const delta = (a, b) => b ? ' <span style="color:' + (a >= b ? '#2e7d32' : '#c62828') + ';font-size:12px">(' + (a >= b ? '▲ ' : '▼ ') + Math.round(Math.abs(a - b) / b * 100) + '%)</span>' : '';
  const tile = (label, val, extra) => '<td style="background:#f0ebf8;border-radius:8px;padding:10px 14px;text-align:center"><div style="font-size:22px;font-weight:800;color:#3a1464">' + val + '</div><div style="font-size:12px;color:#6b5a80">' + label + (extra || '') + '</div></td>';
  const bad = s.status.filter(x => x.s !== 'up');
  const url = ScriptApp.getService().getUrl();

  const html =
    '<table cellspacing="8" style="width:100%"><tr>' +
      tile('زيارة', k.visits, delta(k.visits, k.prevVisits)) + tile('مستخدم', k.users) +
      tile('فتح رابط', k.clicks, delta(k.clicks, k.prevClicks)) + tile('محاولة مرفوضة', k.denied) +
    '</tr></table>' +
    '<h3 style="color:#3a1464;font-size:15px;margin:18px 0 6px">الأكثر استخدامًا هذا الأسبوع</h3>' +
    (s.topLinks.length ? '<table cellpadding="5" style="border-collapse:collapse;font-size:13px;width:100%">' +
      s.topLinks.map((l, i) => '<tr style="border-top:1px solid #eee"><td width="24">' + (i + 1) + '</td><td>' + esc_(l.name) + '</td><td align="left"><b>' + l.n + '</b></td></tr>').join('') + '</table>'
      : '<p style="color:#6b5a80">لا توجد نقرات مسجلة.</p>') +
    '<h3 style="color:#3a1464;font-size:15px;margin:18px 0 6px">محاولات الدخول المرفوضة</h3>' +
    (s.denied.length ? '<table cellpadding="5" style="border-collapse:collapse;font-size:13px;width:100%">' +
      s.denied.slice(0, 15).map(d => '<tr style="border-top:1px solid #eee"><td>' + d.when + '</td><td dir="ltr" align="right">' + esc_(d.email) + '</td><td>' + esc_(d.result) + '</td></tr>').join('') + '</table>'
      : '<p style="color:#2e7d32">لا توجد محاولات مرفوضة ✓</p>') +
    '<h3 style="color:#3a1464;font-size:15px;margin:18px 0 6px">حالة الخدمات والروابط</h3>' +
    (bad.length ? badTable_(bad.map(b => ({ name: b.name, url: b.url, status: b.s, code: b.c, error: '' })))
      : '<p style="color:#2e7d32">جميع الروابط الخارجية المفحوصة (' + k.checked + ') تعمل ✓</p>') +
    (k.reports ? '<p>بلاغات مفتوحة من المستخدمين: <b>' + k.reports + '</b></p>' : '') +
    (url ? '<p style="margin-top:18px"><a href="' + url + '?page=stats" style="background:#501e8c;color:#fff;padding:9px 16px;border-radius:6px;text-decoration:none">فتح صفحة الإحصاءات</a></p>' : '');

  MailApp.sendEmail({
    to: WEEKLY_REPORT_TO.join(','),
    subject: 'ITOC | التقرير الأسبوعي — ' + s.generated.slice(0, 10),
    htmlBody: mailShell_('التقرير الأسبوعي — آخر 7 أيام', html)
  });
  try { SpreadsheetApp.getActive().toast('أُرسل التقرير الأسبوعي إلى ' + WEEKLY_REPORT_TO.join(', '), 'ITOC', 6); } catch (e) {}
}

function mailShell_(title, body) {
  return '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:640px;margin:auto;color:#241436">' +
    '<div style="background:#3a1464;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0"><b style="font-family:Arial;letter-spacing:.06em">ITOC</b> — ' + esc_(title) + '</div>' +
    '<div style="border:1px solid #e3dcef;border-top:0;padding:16px 18px;border-radius:0 0 8px 8px">' + body + '</div>' +
    '<p style="color:#8a7c9c;font-size:11px;text-align:center">مركز العمليات التقنية — الإدارة التنفيذية للاتصالات وتقنية المعلومات — v' + APP_VERSION + '</p></div>';
}
function row_(k, v) { return '<tr style="border-top:1px solid #eee"><td style="color:#6b5a80;white-space:nowrap">' + k + '</td><td>' + v + '</td></tr>'; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* --------------------- Menu: upgrade & automation -------------------- */

/** Menu: adds the v3.1 columns and sheets (keeps all existing data). */
function upgradeTo31() {
  ensureColumns_();
  sheet_(SHEET_FAVS, FAV_HEADERS, [240, 380, 220, 160]);
  sheet_(SHEET_REPORTS, REPORT_HEADERS, [170, 100, 80, 240, 200, 360, 300, 90], '#c0392b');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(SHEET_ANN)) {
    const sh = sheet_(SHEET_ANN, ANN_HEADERS, [460, 360, 90, 110, 110, 70], '#501e8c');
    sh.getRange(2, 1, 1, ANN_HEADERS.length).setValues([[
      'مثال: صيانة مجدولة لنظام Oracle Fusion يوم الخميس من 10 مساءً حتى 2 صباحًا.',
      'Example: scheduled Oracle Fusion maintenance on Thursday, 10 PM – 2 AM.', 'warning', new Date(), '', false]]);
    sh.getRange(2, 6, 100, 1).insertCheckboxes();
    sh.getRange(2, 4, 100, 2).setNumberFormat('yyyy-mm-dd');
    sh.getRange(2, 3, 100, 1).setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['info', 'warning', 'danger', 'success'], true).build());
    sh.getRange('C1').setNote('info = معلومة · warning = تنبيه · danger = عطل · success = تم الحل');
    sh.getRange('D1').setNote('تاريخ البداية (اختياري)');
    sh.getRange('E1').setNote('تاريخ النهاية (اختياري) — يختفي الإعلان بعده تلقائيًا');
    sh.getRange('F1').setNote('علّم لإظهار الإعلان');
  }
  CacheService.getScriptCache().removeAll([CACHE_KEY, ANN_CACHE_KEY, TOP_CACHE_KEY]);
  SpreadsheetApp.getUi().alert('ITOC v' + APP_VERSION,
    'تمت الترقية:\n• أعمدة جديدة: added_on · note_en (Links) و title_en · subtitle_en (Sections)\n• أوراق جديدة: Favorites · LinkReports · Announcements\n\nالخطوة التالية: ITOC ▸ تفعيل المهام الآلية',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

const AUTO_HANDLERS_ = ['checkServices', 'sendWeeklyReport', 'weeklyLinkCheck'];

/** Menu: creates the time triggers (15-minute status check, Sunday link check + report). */
function setupAutomation() {
  removeTriggers_();
  ScriptApp.newTrigger('checkServices').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('weeklyLinkCheck').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(LINKCHECK_HOUR).create();
  ScriptApp.newTrigger('sendWeeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(WEEKLY_HOUR).create();
  const r = checkServices();
  const bad = r.filter(x => x.status !== 'up').length;
  SpreadsheetApp.getUi().alert('تم تفعيل المهام الآلية',
    '• فحص حالة الخدمات كل 15 دقيقة (أول فحص الآن: ' + r.length + ' رابطًا، ' + bad + ' يحتاج مراجعة)\n' +
    '• فحص الروابط المعطلة: الأحد ' + LINKCHECK_HOUR + ':00\n' +
    '• التقرير الأسبوعي بالبريد: الأحد ' + WEEKLY_HOUR + ':00 إلى ' + WEEKLY_REPORT_TO.join(', ') + '\n\n' +
    'المنطقة الزمنية للمشروع: ' + Session.getScriptTimeZone(),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Menu: stops all automatic tasks. */
function removeAutomation() {
  const n = removeTriggers_();
  SpreadsheetApp.getActive().toast('أُوقفت ' + n + ' مهمة آلية.', 'ITOC', 6);
}

function removeTriggers_() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (AUTO_HANDLERS_.indexOf(t.getHandlerFunction()) !== -1) { ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}
