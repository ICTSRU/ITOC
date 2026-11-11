/**
 * =====================================================================
 *  ITOC v3.2 — Names.gs  (add this file next to Code.gs and Features.gs)
 *  Two name columns in Links:  name (Arabic) · name_en (English)
 *  Each button shows two lines: Arabic on top, English below.
 *  Menu: ITOC ▸ ترقية الجداول إلى v3.2 (الاسم العربي / الإنجليزي)
 * =====================================================================
 */

/* Arabic / English names for the current links. Key = the name as it may appear today (Arabic or English). */
const NAME_PAIRS = [
  ['هيئة الحكومة الرقمية', 'Digital Government Authority', []],
  ['الهيئة الوطنية للأمن السيبراني', 'National Cybersecurity Authority', []],
  ['المركز الوطني للتعليم الإلكتروني', 'National eLearning Center', []],
  ['الهيئة السعودية للبيانات والذكاء الاصطناعي', 'Saudi Data & AI Authority', ['SDAIA', 'سدايا']],
  ['هيئة الاتصالات والفضاء والتقنية', 'Communications, Space & Technology Commission', ['CST', 'CITC']],
  ['وزارة الاتصالات وتقنية المعلومات', 'Ministry of Communications & IT', ['MCIT']],
  ['هيئة تقويم التعليم والتدريب', 'Education & Training Evaluation Commission', ['ETEC']],
  ['منصة اعتماد', 'Etimad', ['Etimad', 'اعتماد']],
  ['جرد البنية التحتية', 'Infrastructure Inventory', ['Inventory']],
  ['التقرير الأسبوعي', 'Weekly Report', ['Weekly Report']],
  ['الفحص اليومي', 'Daily Check', ['Daily Check']],
  ['تسجيل حادث عرضي', 'Incident Report', []],
  ['محضر الاجتماع', 'Meeting Minutes', []],
  ['منشئ الشهادات', 'Certificate Builder', []],
  ['التقارير', 'Reports', []],
  ['نموذج مقابلة', 'Interview Evaluation', []],
  ['الخطة التشغيلية', 'Operational Plan', []],
  ['الإجراءات التشغيلية القياسية', 'SOP', ['SOP']],
  ['سياسات الإدارة', 'ICTD Policies', ['ICTD Policies']],
  ['منصة الفعاليات', 'Events Platform', []],
  ['سجل المخاطر', 'Risk Register', ['Risk Register']],
  ['إدارة المهام', 'Task Manager', ['Task Manager']],
  ['منصة نبض الشبكة', 'NetPulse', ['نبض الشبكة', 'NetPulse', 'نبض الشبكة - NetPulse']],
  ['منصة صوت الطالب', 'SRU Voice', ['صوت الطالب', 'SruVoice', 'SRU Voice']],
  ['دليل الاتصال', 'Contact Directory', ['دليل الأتصال']],
  ['موقع الجامعة', 'SRU Website', ['SRU Website']],
  ['البريد الإلكتروني', 'Gmail', ['Gmail']],
  ['جهات الاتصال', 'Google Contacts', ['Google Contacts']],
  ['جوجل درايف', 'Google Drive', ['Google Drive']],
  ['مايكروسوفت 365', 'Microsoft 365', ['Microsoft 365']],
  ['ون درايف', 'OneDrive', ['OneDrive']],
  ['مهام جوجل', 'Google Tasks', ['Google Tasks']],
  ['بوابة الجامعة', 'SRU Portal', ['SRU Portal']],
  ['مكتب الخدمة', 'ServiceDesk', ['ServiceDesk']],
  ['نظام إدارة الأصول', 'IBM Maximo', ['IBM Maximo']],
  ['المراسلات الإلكترونية', 'E-Correspondence', []],
  ['أوراكل فيوجن - التجريبي', 'Oracle Fusion Test', ['Oracle Fusion Test']],
  ['أوراكل فيوجن - الإنتاج', 'Oracle Fusion Production', ['Oracle Fusion Production']],
  ['إدارة الاستراتيجية', 'Strategy', ['Strategy']],
  ['نظام ساب', 'SAP', ['SAP']],
  ['إعادة تعيين كلمة مرور الموظفين', 'Staff Reset Password', ['Staff Reset Password']],
  ['نظام إدارة التعلم', 'Moodle', ['Moodle']],
  ['نظام معلومات الطلاب', 'SIS', ['SIS']],
  ['المكتبة الإلكترونية', 'E-Library', ['E-Library']],
  ['المهارات الطبية', 'Skills in Medicine', ['Skills in Medicine']],
  ['مقاعد الاختبارات', 'Exam Seat Locator', ['Exam Seat Locator']],
  ['إعادة تعيين كلمة مرور الطلاب', 'Student Reset Password', ['Student Reset Password']],
  ['شات جي بي تي', 'ChatGPT', ['ChatGPT']],
  ['جيميناي', 'Gemini', ['Gemini']],
  ['كلود', 'Claude', ['Claude']],
  ['جروك', 'Grok', ['Grok']],
  ['كوبايلوت', 'Copilot', ['Copilot']],
  ['نوت بوك إل إم', 'NotebookLM', ['NotebookLM']],
  ['وزارة التعليم', 'MOE', ['MOE']],
  ['بوابة وزارة التعليم', 'MOE Portal', ['MOE Portal']],
  ['وزارة التعليم - عام', 'MOE General', ['MOE General']],
  ['وزارة التعليم - الموظفون', 'MOE Employee', ['MOE Employee']],
  ['وزارة التعليم - أعضاء هيئة التدريس', 'MOE Staff', ['MOE Staff']],
  ['وزارة التعليم - المعاهد', 'MOE Institute', ['MOE Institute']],
  ['مكتب إدارة البيانات', 'DMO', ['DMO']],
  ['نظام إدارة التعلم - التجريبي', 'Moodle Test', ['Moodle Test']],
  ['خدمة المجتمع', 'Community Service', []],
  ['السكاكر', 'Sakaker', []],
  ['التوقيع الرقمي', 'Digital Signature', ['Digital Signature']],
  ['دليل الطالب', 'Student Guide', []],
  ['مركز الاتصال', 'ZIWO', ['ZIWA', 'ZIWO']],
  ['واتساب الأعمال', 'Wati', ['Wati']],
  ['إدارة المجالس', 'Convene', ['Convene']],
  ['خادم تقارير Power BI', 'Power BI Server', ['Power BI Server']],
  ['بوابة الخدمات المؤسسية', 'ESM', ['ESM']],
  ['منصة الأتمتة', 'n8n', ['n8n']],
  ['مهام الإدارة - نسخة تجريبية', 'ICTD Task Netlify', ['ICTD Task Netlify']],
  ['برامج الماجستير', 'Master Programs', ['Master']],
  ['التحول الرقمي', 'Digital Transformation', ['DT']],
  ['نموذج خدمة العملاء', 'CS Form', ['CS Form']],
  ['طلب نقل أجهزة', 'Device Transfer Request', []],
  ['بوت تيليجرام', 'Telegram Bot', ['Telegram Bot']]
];

const AR_RE_ = /[؀-ۿ]/;

function namePairIndex_() {
  const idx = {};
  const norm = s => String(s).trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ');
  NAME_PAIRS.forEach(p => [p[0], p[1]].concat(p[2] || []).forEach(k => { idx[norm(k)] = p; }));
  return { get: s => idx[norm(s)] || null };
}

/** Splits one existing name into [arabic, english] (either may be ''). */
function splitName_(name, pairs) {
  name = String(name || '').trim();
  if (!name) return ['', ''];
  const hit = (pairs || namePairIndex_()).get(name);
  if (hit) return [hit[0], hit[1]];
  if (!AR_RE_.test(name)) return ['', name];                         // English only
  if (!/[A-Za-z]/.test(name)) return [name, ''];                      // Arabic only
  // Mixed, e.g. "منصة نبض الشبكة NetPulse" or "نبض الشبكة - NetPulse"
  const words = name.split(/\s+/);
  const ar = words.filter(w => AR_RE_.test(w)).join(' ');
  const en = words.filter(w => !AR_RE_.test(w) && /[A-Za-z0-9]/.test(w)).join(' ');
  return [ar.replace(/[-–—|:]+$/, '').trim(), en.replace(/^[-–—|:]+/, '').trim()];
}

/** Arabic + English names for a seed row name (used by setupSheets). */
function seedNames_(name) { return splitName_(name); }

/**
 * Menu: adds the name_en column right after name and fills both columns from the current names.
 * Rows that still miss a name are highlighted in yellow for manual completion. Existing name_en values are kept.
 */
function upgradeTo32() {
  ensureColumns_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_LINKS);
  const ui = SpreadsheetApp.getUi();
  if (!sh) { ui.alert('ITOC', 'لا توجد ورقة Links — شغّل «إعداد الجداول» أولًا.', ui.ButtonSet.OK); return; }

  let headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
  const cName = headers.indexOf('name') + 1;
  let cEn = headers.indexOf('name_en') + 1;
  if (!cEn) {
    sh.insertColumnAfter(cName);
    cEn = cName + 1;
    sh.getRange(1, cEn).setValue('name_en').setFontWeight('bold').setFontColor('#ffffff').setBackground('#501e8c')
      .setNote('الاسم بالإنجليزية — يظهر في السطر الثاني من الزر');
    sh.getRange(1, cName).setNote('الاسم بالعربية — يظهر في السطر الأول من الزر');
    sh.setColumnWidth(cEn, 200);
  }

  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const pairs = namePairIndex_();
  const names = sh.getRange(2, cName, n, 1).getValues();
  const ens = sh.getRange(2, cEn, n, 1).getValues();
  const bg = [];
  let filled = 0, missing = 0;
  for (let i = 0; i < n; i++) {
    const cur = String(names[i][0] || '').trim(), curEn = String(ens[i][0] || '').trim();
    if (!cur && !curEn) { bg.push([null, null]); continue; }
    if (!curEn || !AR_RE_.test(cur)) {
      const sp = splitName_(cur || curEn, pairs);
      const ar = AR_RE_.test(cur) && !/[A-Za-z]/.test(cur) ? cur : sp[0];   // keep a pure-Arabic name as typed
      const en = curEn || sp[1];
      if (ar !== cur || en !== curEn) filled++;
      names[i][0] = ar; ens[i][0] = en;
    }
    const miss = [names[i][0] ? null : '#fff3c4', ens[i][0] ? null : '#fff3c4'];
    if (miss[0] || miss[1]) missing++;
    bg.push(miss);
  }
  sh.getRange(2, cName, n, 1).setValues(names);
  sh.getRange(2, cEn, n, 1).setValues(ens);
  sh.getRange(2, cName, n, 2).setBackgrounds(bg);

  CacheService.getScriptCache().removeAll([CACHE_KEY, TOP_CACHE_KEY]);
  ui.alert('ITOC v' + APP_VERSION + ' — الاسم العربي / الإنجليزي',
    '• العمود name = الاسم بالعربية (السطر الأول)\n• العمود name_en = الاسم بالإنجليزية (السطر الثاني)\n\n' +
    'عُبّئ ' + filled + ' صفًّا تلقائيًا.' + (missing ? '\nيحتاج ' + missing + ' صفًّا إلى إكمال يدوي (مظلل بالأصفر).' : '\nجميع الصفوف مكتملة ✓') +
    '\n\nراجع الترجمات وعدّل ما تريد — تظهر التعديلات عند تحديث الصفحة.', ui.ButtonSet.OK);
}
