/**
 * =====================================================================
 *  ITOC — Systems & Services Index (فهرس الأنظمة والخدمات)
 *  Version 2.5 — Google Apps Script Web App, @sr.edu.sa + access list (AllowedUsers)
 *  ICTD — Sulaiman Al Rajhi University
 * ---------------------------------------------------------------------
 *  Files in this project:  Code.gs · Index.html · Logos.html · Denied.html
 *  Data source:            this spreadsheet → sheets "Sections" and "Links"
 *  First run:              menu  ITOC ▸ إعداد الجداول وتعبئة الروابط
 * =====================================================================
 */

const APP_VERSION    = '2.5';
const ALLOWED_DOMAIN = 'sr.edu.sa';
const SHEET_SECTIONS = 'Sections';
const SHEET_LINKS    = 'Links';
const CACHE_KEY      = 'itoc_data_v2';
const CACHE_SECONDS  = 600;   // page data cached 10 minutes; any sheet edit clears it
const FAVICON_URL    = 'https://ictsru.github.io/ITOC/assets/itoc-logo.png'; // set '' to disable
const APP_NAME       = 'فهرس الأنظمة والخدمات';
const APP_NAME_EN    = 'ITOC Index';

/* Access list (who may open the page) */
const ACCESS_MODE           = 'LIST';     // 'LIST' = only active emails in AllowedUsers · 'DOMAIN' = any @sr.edu.sa account
const ACCESS_SPREADSHEET_ID = '';         // '' = this spreadsheet
const SHEET_ACCESS          = 'AllowedUsers';
const OWNER_EMAILS          = ['m.elmahdy@sr.edu.sa']; // always allowed — owner can never be locked out

/* Default access list — added to AllowedUsers by setupAccessList() (existing rows are kept) */
const DEFAULT_ALLOWED = [
  // [email, name, role, notes]
  ['nabounar@sr.edu.sa',    'Nasser Abounar', 'admin', 'CIO'],
  ['m.elmahdy@sr.edu.sa',   'Mohamed ElMahdy', 'admin', 'Owner — IT Operations Manager'],
  ['n.nawaz@sr.edu.sa',     '', 'user', ''],
  ['m.omar@sr.edu.sa',      '', 'user', ''],
  ['m.saleh@sr.edu.sa',     '', 'user', ''],
  ['a.alrowedan@sr.edu.sa', '', 'user', ''],
  ['n.alrashidi@sr.edu.sa', '', 'user', ''],
  ['a.alawaji@sr.edu.sa',   '', 'user', ''],
  ['a.alaqeel@sr.edu.sa',   '', 'user', ''],
  ['a.alolayan@sr.edu.sa',  '', 'user', ''],
  ['s.albusayli@sr.edu.sa', '', 'user', ''],
  ['i.almutairi@sr.edu.sa', '', 'user', ''],
  ['a.elnadi@sr.edu.sa',    '', 'user', '']
];
const ACCESS_CACHE_SECONDS  = 120;        // edits in the sheet apply at once; other changes within 2 minutes

/* Access log */
const SHEET_LOG          = 'AccessLog';
const LOG_TIMEZONE       = 'Asia/Riyadh';
const LOG_DEDUP_MINUTES  = 30;   // same user within 30 min = one entry (0 = log every page open)
const LOG_RETENTION_DAYS = 180;  // used by the menu item that deletes old entries
const LOG_HEADERS        = ['timestamp', 'date', 'time', 'day', 'email', 'result', 'version'];

const SECTION_HEADERS = ['id', 'title', 'subtitle', 'icon', 'hidden'];
const LINK_HEADERS    = ['section_id', 'name', 'url', 'icon', 'note', 'new', 'hidden'];

/* ----------------------------- Web app ------------------------------ */

function doGet() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  // Defence in depth: the deployment is limited to the sr.edu.sa domain, the page is only
  // rendered for an @sr.edu.sa account, and (ACCESS_MODE 'LIST') only for active AllowedUsers.
  const status = accessStatus_(email);
  if (status !== 'ok') {
    logAccess_(email || '(unknown)', status === 'list' ? 'not-listed' : 'denied');
    const d = HtmlService.createTemplateFromFile('Denied');
    d.appName = APP_NAME; d.appNameEn = APP_NAME_EN; d.userEmail = email || ''; d.reason = status;
    return d.evaluate()
      .setTitle('ITOC | غير مصرح')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  logAccess_(email, 'granted');

  const t = HtmlService.createTemplateFromFile('Index');
  t.dataJson  = safeJson_(getData_());
  t.userEmail = email;
  t.version   = APP_VERSION;

  const out = t.evaluate()
    .setTitle('ITOC | فهرس الأنظمة والخدمات')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  if (FAVICON_URL) out.setFaviconUrl(FAVICON_URL);
  return out;
}

/** Used by templates: <?!= include('Logos') ?> */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function isAllowed_(email) { return !!email && email.endsWith('@' + ALLOWED_DOMAIN); }

/* ---------------------------- Access list --------------------------- */

const ACCESS_HEADERS = ['email', 'name', 'role', 'active', 'notes'];

/** 'ok' | 'domain' (not @sr.edu.sa) | 'list' (not on the active list) */
function accessStatus_(email) {
  if (!isAllowed_(email)) return 'domain';
  if (ACCESS_MODE !== 'LIST') return 'ok';
  if (OWNER_EMAILS.map(e => e.toLowerCase()).indexOf(email) !== -1) return 'ok';
  return allowedEmails_().indexOf(email) !== -1 ? 'ok' : 'list';
}

/** Active emails from the AllowedUsers tab (cached briefly). */
function allowedEmails_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('acl_v1');
  if (hit) return JSON.parse(hit);
  let list = [];
  try {
    const sh = accessSheet_(false);
    if (sh && sh.getLastRow() > 1) {
      list = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
        .filter(r => r[0] && r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE')
        .map(r => String(r[0]).trim().toLowerCase());
    }
  } catch (e) { console.error('allowedEmails_ failed: ' + e); }
  cache.put('acl_v1', JSON.stringify(list), ACCESS_CACHE_SECONDS);
  return list;
}

function accessSheet_(create) {
  const ss = ACCESS_SPREADSHEET_ID ? SpreadsheetApp.openById(ACCESS_SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_ACCESS);
  if (!sh && create) {
    sh = ss.insertSheet(SHEET_ACCESS);
    sh.getRange(1, 1, 1, ACCESS_HEADERS.length).setValues([ACCESS_HEADERS])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#501e8c');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    [260, 200, 100, 70, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange(2, 4, 300, 1).insertCheckboxes();
    sh.getRange('A1').setNote('البريد الجامعي كاملًا — name@sr.edu.sa');
    sh.getRange('C1').setNote('admin / user (للتوثيق — يمكن استخدامه لاحقًا لصلاحيات أدق)');
    sh.getRange('D1').setNote('ألغِ العلامة لإيقاف الوصول دون حذف الصف');
  }
  return sh;
}

/** Run once from the editor: creates the AllowedUsers tab and adds the owner(s). */
function setupAccessList() {
  const sh = accessSheet_(true);
  const n = Math.max(sh.getLastRow() - 1, 0);            // includes empty rows that only hold checkboxes
  const data = n ? sh.getRange(2, 1, n, 5).getValues() : [];

  // Keep every existing entry (and its active state), compacted to the top — fixes rows that
  // earlier versions appended below the pre-made checkbox rows.
  const kept = data.filter(r => String(r[0]).trim())
    .map(r => [String(r[0]).trim(), r[1], r[2], r[3] === true || String(r[3]).toUpperCase() === 'TRUE', r[4]]);
  const have = kept.map(r => r[0].toLowerCase());

  const seed = OWNER_EMAILS.map(e => [e, 'Owner', 'admin', 'owner'])
    .concat(typeof DEFAULT_ALLOWED !== 'undefined' ? DEFAULT_ALLOWED : []);
  let added = 0;
  seed.forEach(r => {
    const e = String(r[0]).trim().toLowerCase();
    if (e && have.indexOf(e) === -1) {
      kept.push([e, r[1] || '', r[2] || 'user', true, r[3] || 'added by setupAccessList']);
      have.push(e); added++;
    }
  });

  if (n) sh.getRange(2, 1, n, 5).clearContent();
  const rows = Math.max(n, kept.length, 50);
  sh.getRange(2, 4, rows, 1).insertCheckboxes();          // checkboxes first (this sets them to unchecked)
  if (kept.length) sh.getRange(2, 1, kept.length, 5).setValues(kept);  // then the real values

  CacheService.getScriptCache().remove('acl_v1');
  console.log('AllowedUsers ready: ' + kept.length + ' entries (' + added + ' added).');
  try { SpreadsheetApp.getActive().toast('قائمة المصرّح لهم جاهزة: ' + kept.length + ' بريدًا (أُضيف ' + added + ').', SHEET_ACCESS, 8); } catch (e) {}
}

/* ---------------------------- Access log ---------------------------- */

/** Appends one row to AccessLog. Never blocks the page if logging fails. */
function logAccess_(email, result) {
  try {
    if (LOG_DEDUP_MINUTES > 0 && result === 'granted') {
      const cache = CacheService.getScriptCache();
      const key = 'log_' + email;
      if (cache.get(key)) return;
      cache.put(key, '1', LOG_DEDUP_MINUTES * 60);
    }
    const sh = getLogSheet_();
    const now = new Date();
    const f = p => Utilities.formatDate(now, LOG_TIMEZONE, p);
    sh.appendRow([now, f('yyyy-MM-dd'), f('HH:mm:ss'), DAYS_AR_[Number(f('u')) % 7], email, result === 'granted' ? 'دخول' : (result === 'not-listed' ? 'غير مدرج' : 'مرفوض'), APP_VERSION]);
  } catch (e) {
    console.error('logAccess_ failed: ' + e);
  }
}

const DAYS_AR_ = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']; // index = ISO day % 7

function getLogSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_LOG);
    sh.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#3a1464');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    [170, 100, 80, 80, 260, 80, 70].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  }
  return sh;
}

/** Menu: delete entries older than LOG_RETENTION_DAYS. */
function purgeOldLogs() {
  const sh = getLogSheet_();
  const last = sh.getLastRow();
  let removed = 0;
  if (last > 1) {
    const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 864e5);
    const stamps = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = stamps.length - 1; i >= 0; i--) {
      if (stamps[i][0] instanceof Date && stamps[i][0] < cutoff) { sh.deleteRow(i + 2); removed++; }
    }
  }
  SpreadsheetApp.getActive().toast('حُذف ' + removed + ' سجل أقدم من ' + LOG_RETENTION_DAYS + ' يومًا.', 'ITOC', 6);
}

/** Menu: quick summary of the last 30 days. */
function showLogSummary() {
  const sh = getLogSheet_();
  const last = sh.getLastRow();
  const ui = SpreadsheetApp.getUi();
  if (last < 2) { ui.alert('سجل الدخول', 'لا توجد سجلات بعد.', ui.ButtonSet.OK); return; }
  const since = new Date(Date.now() - 30 * 864e5);
  const rows = sh.getRange(2, 1, last - 1, LOG_HEADERS.length).getValues()
    .filter(r => r[0] instanceof Date && r[0] >= since && r[5] === 'دخول');
  const users = {};
  rows.forEach(r => { users[r[4]] = (users[r[4]] || 0) + 1; });
  const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 10)
    .map((u, i) => (i + 1) + '. ' + u + ' — ' + users[u]).join('\n');
  ui.alert('سجل الدخول — آخر 30 يومًا',
    'عدد الزيارات: ' + rows.length + '\nعدد المستخدمين: ' + Object.keys(users).length + '\n\nالأكثر دخولًا:\n' + (top || '—'),
    ui.ButtonSet.OK);
}

/* ------------------------------- Data ------------------------------- */

function getData_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) return JSON.parse(hit);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sections = readTable_(ss.getSheetByName(SHEET_SECTIONS));
  const links    = readTable_(ss.getSheetByName(SHEET_LINKS));

  const data = sections
    .filter(s => s.id && !isOn_(s.hidden))
    .map(s => {
      const id = String(s.id).trim();
      return {
        id: id,
        title: String(s.title || id),
        subtitle: String(s.subtitle || ''),
        icon: String(s.icon || 'folder'),
        links: links
          .filter(l => String(l.section_id).trim() === id && l.name && l.url && !isOn_(l.hidden))
          .map(l => ({
            name:  String(l.name).trim(),
            url:   String(l.url).trim(),
            icon:  String(l.icon || 'link').trim(),
            note:  String(l.note || '').trim(),
            isNew: isOn_(l['new'])
          }))
      };
    });

  try { cache.put(CACHE_KEY, JSON.stringify(data), CACHE_SECONDS); } catch (e) { /* too large → skip cache */ }
  return data;
}

/** Reads a sheet into objects keyed by the (lower-cased) header row. */
function readTable_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  return values.slice(1)
    .filter(r => r.some(c => c !== '' && c !== null))
    .map(r => headers.reduce((o, h, i) => { if (h) o[h] = r[i]; return o; }, {}));
}

function isOn_(v)     { return v === true || /^(true|yes|y|1|نعم)$/i.test(String(v).trim()); }

function safeJson_(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/* ---------------------------- Sheet tools --------------------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ITOC')
    .addItem('إعداد الجداول وتعبئة الروابط (أول مرة)', 'setupSheets')
    .addItem('تحديث الصفحة الآن (مسح الذاكرة المؤقتة)', 'clearCache')
    .addSeparator()
    .addItem('إعداد قائمة المصرّح لهم (AllowedUsers)', 'setupAccessList')
    .addSeparator()
    .addItem('ملخص سجل الدخول (30 يومًا)', 'showLogSummary')
    .addItem('حذف سجلات الدخول القديمة', 'purgeOldLogs')
    .addSeparator()
    .addItem('عرض رابط الصفحة', 'showWebAppUrl')
    .addToUi();
}

/** Simple trigger: any edit in the sheet refreshes the page data. */
function onEdit() {
  CacheService.getScriptCache().removeAll([CACHE_KEY, 'acl_v1']);
}

function clearCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
  SpreadsheetApp.getActive().toast('تم — ستظهر آخر التعديلات عند تحديث الصفحة.', 'ITOC', 5);
}

function showWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  const ui = SpreadsheetApp.getUi();
  ui.alert('رابط صفحة ITOC', url ? url : 'لم يُنشر التطبيق بعد: Deploy ▸ New deployment ▸ Web app', ui.ButtonSet.OK);
}

/** Creates "Sections" and "Links", fills them with the current 66 links, and formats them. */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const existing = ss.getSheetByName(SHEET_LINKS);
  if (existing && existing.getLastRow() > 1) {
    const r = ui.alert('تنبيه', 'ورقة Links تحتوي بيانات. هل تريد استبدالها بالروابط الافتراضية؟', ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
  }

  const sec = buildSheet_(ss, SHEET_SECTIONS, SECTION_HEADERS, SEED_SECTIONS, [140, 220, 420, 140, 70]);
  const lnk = buildSheet_(ss, SHEET_LINKS, LINK_HEADERS, SEED_LINKS, [120, 200, 420, 140, 260, 60, 70]);

  // Checkboxes
  sec.getRange(2, 5, Math.max(SEED_SECTIONS.length, 1) + 50, 1).insertCheckboxes();
  lnk.getRange(2, 6, SEED_LINKS.length + 200, 2).insertCheckboxes();
  // section_id dropdown linked to Sections!A
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(sec.getRange('A2:A'), true).setAllowInvalid(false).build();
  lnk.getRange(2, 1, SEED_LINKS.length + 200, 1).setDataValidation(rule);

  // Notes on header cells (help for editors)
  lnk.getRange('D1').setNote('اسم أيقونة من lucide.dev/icons — مثل: mail, database, globe');
  lnk.getRange('F1').setNote('علّم لإظهار شارة «جديد»');
  lnk.getRange('G1').setNote('علّم لإخفاء الرابط مؤقتًا دون حذفه');
  lnk.getRange('A1').setNote('اختر القسم من القائمة (من ورقة Sections)');

  ss.setActiveSheet(lnk);
  clearCache();
  ui.alert('تم الإعداد', 'تمت تعبئة ' + SEED_SECTIONS.length + ' أقسام و ' + SEED_LINKS.length + ' رابطًا.\nالخطوة التالية: Deploy ▸ New deployment ▸ Web app.', ui.ButtonSet.OK);
}

function buildSheet_(ss, name, headers, rows, widths) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#501e8c');
  if (rows.length) sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.setRightToLeft(true);
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  return sh;
}

/* ------------------------- Seed data (v1.8) ------------------------- */
/* Used only by setupSheets(). After setup, edit the sheets — not this. */

const SEED_SECTIONS = [
  ["ictd", "أدوات وتطبيقات ITOC", "النماذج والتطبيقات التي طورتها الإدارة التنفيذية للاتصالات وتقنية المعلومات - التشغيل", "wrench", false],
  ["general", "الخدمات العامة والإنتاجية", "الأنظمة الجامعية ومنصات الإنتاجية الأكثر استخدامًا", "layout-grid", false],
  ["staff", "خدمات الموظفين", "الأنظمة المؤسسية وخدمات منسوبي الجامعة", "users", false],
  ["students", "خدمات الطلاب", "الأنظمة والخدمات الرقمية المخصصة للطلاب", "graduation-cap", false],
  ["ai", "أدوات الذكاء الاصطناعي", "منصات الذكاء الاصطناعي التوليدي المعتمدة أو شائعة الاستخدام", "sparkles", false],
  ["moe", "وزارة التعليم", "موارد وأنظمة وزارة التعليم", "building-2", false],
  ["test", "أنظمة تحت التجربة", "بيئات الاختبار والمشروعات التجريبية والتطويرية", "test-tube-diagonal", false],
  ["forms", "النماذج", "نماذج الطلبات والخدمات الجامعية", "clipboard-list", false]
];

const SEED_LINKS = [
  ["ictd", "Inventory", "https://ictsru.github.io/ICTD/sru_infrastructure_inventory.html", "boxes", "جرد أصول البنية التحتية", false, false],
  ["ictd", "Weekly Report", "https://ictsru.github.io/ictd-weekly-report/", "clipboard-list", "التقرير الأسبوعي للإدارة", false, false],
  ["ictd", "Daily Check", "https://ictsru.github.io/daily/", "activity", "تقرير الفحص اليومي", true, false],
  ["ictd", "تسجيل حادث عرضي", "https://ictsru.github.io/IR/incident-report-ar.html", "siren", "نموذج تقرير حادثة", false, false],
  ["ictd", "محضر الاجتماع", "https://ictsru.github.io/mom/", "file-text", "", false, false],
  ["ictd", "منشئ الشهادات", "https://ictsru.github.io/template/", "award", "", false, false],
  ["ictd", "التقارير", "https://ictsru.github.io/Report/SRU-ICTD-Report-Template.html", "file-chart-column", "", false, false],
  ["ictd", "نموذج مقابلة", "https://ictsru.github.io/INTV/intv.html", "user-check", "", false, false],
  ["ictd", "الخطة التشغيلية", "https://ictsru.github.io/operation/operational-plan-form.html", "calendar-range", "", false, false],
  ["ictd", "SOP", "https://ictsru.github.io/SOP", "file-cog", "نموذج الإجراء التشغيلي القياسي", true, false],
  ["ictd", "ICTD Policies", "https://ictsru.github.io/Policy/", "scroll-text", "سياسات الإدارة المعتمدة", true, false],
  ["ictd", "منصة الفعاليات", "https://ictsru.github.io/Event/index.html", "calendar-check", "تسجيل حضور وإدارة الفعاليات", true, false],
  ["ictd", "Risk Register", "https://melmahdy-2030.github.io/AI2030/risk_register_dynamic_response_plan.html", "shield-alert", "سجل المخاطر", false, false],
  ["ictd", "Task Manager", "https://ictsru.github.io/ittask/", "kanban-square", "إدارة المهام", false, false],
  ["general", "SRU Website", "https://sr.edu.sa", "globe", "", false, false],
  ["general", "Gmail", "https://gmail.com", "mail", "", false, false],
  ["general", "Google Contacts", "https://contacts.google.com", "contact", "", false, false],
  ["general", "Google Drive", "https://drive.google.com", "hard-drive", "", false, false],
  ["general", "Microsoft 365", "https://www.office.com", "app-window", "", false, false],
  ["general", "OneDrive", "https://sredusa-my.sharepoint.com/my", "cloud", "", false, false],
  ["general", "Google Tasks", "https://tasks.google.com/tasks/", "list-checks", "", false, false],
  ["staff", "SRU Portal", "https://mysru.sr.edu.sa/login.aspx", "landmark", "", false, false],
  ["staff", "ServiceDesk", "https://sd.sr.edu.sa", "headphones", "", false, false],
  ["staff", "IBM Maximo", "https://eam-sru.com/maximo/webclient/login/login.jsp?welcome=true", "factory", "", false, false],
  ["staff", "المراسلات الإلكترونية", "https://cs.sr.edu.sa/start", "send", "", false, false],
  ["staff", "Oracle Fusion Test", "https://login-iadfkf-test.fa.ocs.oraclecloud.com/", "flask-conical", "", false, false],
  ["staff", "Oracle Fusion Production", "https://iadfkf.fa.ocs.oraclecloud.com/fscmUI/faces/FuseOverview", "database", "", false, false],
  ["staff", "Strategy", "https://sm.sr.edu.sa/auth", "target", "", false, false],
  ["staff", "SAP", "https://fiori2.wisys.com.sa/", "boxes", "", false, false],
  ["staff", "Staff Reset Password", "https://rpsf.sr.edu.sa/", "key-round", "", false, false],
  ["students", "Moodle", "https://elu.sr.edu.sa/", "book-open", "", false, false],
  ["students", "SIS", "https://sis.sr.edu.sa/", "school", "", false, false],
  ["students", "E-Library", "https://lib.sr.edu.sa/opac890/", "library", "", false, false],
  ["students", "Skills in Medicine", "https://sim.sr.edu.sa/sim-src/", "stethoscope", "", false, false],
  ["students", "Exam Seat Locator", "https://esl.sr.edu.sa/", "map-pin", "", false, false],
  ["students", "Student Reset Password", "https://rpst.sr.edu.sa/", "key-round", "", false, false],
  ["ai", "ChatGPT", "https://chatgpt.com/", "message-square-code", "", false, false],
  ["ai", "Gemini", "https://gemini.google.com/", "gem", "", false, false],
  ["ai", "Claude", "https://claude.ai/", "bot", "", false, false],
  ["ai", "Grok", "https://grok.com/", "orbit", "", false, false],
  ["ai", "Copilot", "https://copilot.microsoft.com/", "panels-top-left", "", false, false],
  ["ai", "NotebookLM", "https://notebooklm.google.com/", "notebook-tabs", "", false, false],
  ["moe", "MOE", "http://10.1.107.152:8080/", "building", "", false, false],
  ["moe", "MOE Portal", "http://10.1.107.152:8080/", "log-in", "", false, false],
  ["moe", "MOE General", "http://10.1.107.152/admin/login", "network", "", false, false],
  ["moe", "MOE Employee", "http://10.1.107.152/employees/admin/login", "badge-check", "", false, false],
  ["moe", "MOE Staff", "http://10.1.107.152/teachingstaff/admin/login", "users-round", "", false, false],
  ["moe", "MOE Institute", "http://10.1.107.152/institute/admin/login", "university", "", false, false],
  ["test", "DMO", "https://drive.google.com/drive/folders/1cdDQ_KihIw5CVE4lTw0QGX5OxeGSnATw?usp=drive_link", "database-zap", "", false, false],
  ["test", "Moodle Test", "http://10.2.2.111/moodle/login/index.php", "book-copy", "", false, false],
  ["test", "خدمة المجتمع", "https://community.sr.edu.sa/", "heart-handshake", "", false, false],
  ["test", "السكاكر", "https://mush-sakaker-front.vercel.app/", "building-2", "", false, false],
  ["test", "Digital Signature", "http://10.1.103.50:81/login?next=/slide/10", "signature", "", false, false],
  ["test", "دليل الطالب", "https://galaxy-click-56468078.figma.site", "book-marked", "", false, false],
  ["test", "ZIWA", "https://app.ziwo.io/home", "phone-call", "", false, false],
  ["test", "Wati", "https://auth.wati.io/login?authContextID=8f96055103b44931a062cda2b1ed833d&tenantID=476158", "message-circle-more", "", false, false],
  ["test", "Convene", "https://sr-edu-sa.azeusconvene.com/", "presentation", "", false, false],
  ["test", "Power BI Server", "http://powerbiserver/Reports/browse", "chart-column", "", false, false],
  ["test", "ESM", "https://sd.sr.edu.sa/ESM.do?type=portal", "waypoints", "", false, false],
  ["test", "n8n", "https://elmahdy2020.app.n8n.cloud/", "workflow", "", false, false],
  ["test", "ICTD Task Netlify", "https://ictdtask.netlify.app", "list-todo", "", false, false],
  ["test", "Master", "https://sru-master-programs.netlify.app/", "graduation-cap", "", false, false],
  ["test", "DT", "https://sru-digital-enablement.netlify.app/", "refresh-cw", "", false, false],
  ["forms", "CS Form", "https://elmahdy2020.app.n8n.cloud/form/452792e2-b8a6-49ed-9c2e-1b81ced8d6fd", "file-input", "", false, false],
  ["forms", "طلب نقل أجهزة", "https://elmahdy2020.app.n8n.cloud/form/0863c96c-78fc-489c-908d-ba8fc04725db", "monitor-up", "", false, false],
  ["forms", "Telegram Bot", "https://t.me/sru_dsc_bot", "send-horizontal", "", false, false]
];
