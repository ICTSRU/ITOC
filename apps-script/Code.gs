/**
 * =====================================================================
 *  ITOC — Systems & Services Index (فهرس الأنظمة والخدمات)
 *  Version 2.0 — Google Apps Script Web App, restricted to @sr.edu.sa
 *  ICTD — Sulaiman Al Rajhi University
 * ---------------------------------------------------------------------
 *  Files in this project:  Code.gs · Index.html · Logos.html · Denied.html
 *  Data source:            this spreadsheet → sheets "Sections" and "Links"
 *  First run:              menu  ITOC ▸ إعداد الجداول وتعبئة الروابط
 * =====================================================================
 */

const APP_VERSION    = '2.0';
const ALLOWED_DOMAIN = 'sr.edu.sa';
const SHEET_SECTIONS = 'Sections';
const SHEET_LINKS    = 'Links';
const CACHE_KEY      = 'itoc_data_v2';
const CACHE_SECONDS  = 600;   // page data cached 10 minutes; any sheet edit clears it
const FAVICON_URL    = 'https://ictsru.github.io/ITOC/assets/itoc-logo.png'; // set '' to disable

const SECTION_HEADERS = ['id', 'title', 'subtitle', 'icon', 'hidden'];
const LINK_HEADERS    = ['section_id', 'name', 'url', 'icon', 'note', 'new', 'hidden'];

/* ----------------------------- Web app ------------------------------ */

function doGet() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  // Defence in depth: the deployment itself is limited to the sr.edu.sa domain,
  // and the page is only rendered for an @sr.edu.sa account.
  if (!email || !email.endsWith('@' + ALLOWED_DOMAIN)) {
    return HtmlService.createTemplateFromFile('Denied').evaluate()
      .setTitle('ITOC | غير مصرح')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

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
    .addItem('عرض رابط الصفحة', 'showWebAppUrl')
    .addToUi();
}

/** Simple trigger: any edit in the sheet refreshes the page data. */
function onEdit() {
  CacheService.getScriptCache().remove(CACHE_KEY);
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
