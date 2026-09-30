/* =====================================================================
   ITOC Index — links data  (edit THIS file to add / change / remove links)
   ---------------------------------------------------------------------
   HOW TO UPDATE (GitHub web editor is enough — no build step):
     1. Open links.js on GitHub → click the pencil (Edit) icon.
     2. Add a line inside the right section's "links" list, e.g.
          { name: "New System", url: "https://example.sr.edu.sa/", icon: "globe" },
     3. Optional fields:
          ar:    true      → Arabic label (right-to-left text)
          note:  "..."     → short description shown under the name
          isNew: true      → shows a "جديد" badge
     4. Commit. GitHub Pages refreshes within ~1 minute.
   Icons: any name from https://lucide.dev/icons (e.g. "mail", "database").
   Links on 10.x.x.x / 172.16–31.x / 192.168.x or single-word hosts
   are auto-flagged as "شبكة داخلية" (internal network only).
   ===================================================================== */

window.ITOC_SECTIONS = [
  {
    id: "ictd", title: "أدوات وتطبيقات ITOC", subtitle: "النماذج والتطبيقات التي طورتها إدارة العمليات التقنية",
    icon: "wrench",
    links: [
      { name: "Inventory", url: "https://ictsru.github.io/ICTD/sru_infrastructure_inventory.html", icon: "boxes", note: "جرد أصول البنية التحتية" },
      { name: "Weekly Report", url: "https://ictsru.github.io/ictd-weekly-report/", icon: "clipboard-list", note: "التقرير الأسبوعي للإدارة" },
      { name: "تسجيل حادث عرضي", url: "https://ictsru.github.io/IR/incident-report-ar.html", icon: "siren", ar: true, note: "نموذج تقرير حادثة" },
      { name: "محضر الاجتماع", url: "https://ictsru.github.io/mom/", icon: "file-text", ar: true },
      { name: "منشئ الشهادات", url: "https://ictsru.github.io/template/", icon: "award", ar: true },
      { name: "التقارير", url: "https://ictsru.github.io/Report/SRU-ICTD-Report-Template.html", icon: "file-chart-column", ar: true },
      { name: "نموذج مقابلة", url: "https://ictsru.github.io/INTV/intv.html", icon: "user-check", ar: true },
      { name: "الخطة التشغيلية", url: "https://ictsru.github.io/operation/operational-plan-form.html", icon: "calendar-range", ar: true },
      { name: "SOP", url: "https://ictsru.github.io/SOP", icon: "file-cog", note: "نموذج الإجراء التشغيلي القياسي", isNew: true },
      { name: "Risk Register", url: "https://melmahdy-2030.github.io/AI2030/risk_register_dynamic_response_plan.html", icon: "shield-alert", note: "سجل المخاطر" },
      { name: "Task Manager", url: "https://melmahdy-2030.github.io/AI2030/task_list_web_page.html", icon: "kanban-square", note: "إدارة المهام" }
    ]
  },
  {
    id: "general", title: "الخدمات العامة والإنتاجية", subtitle: "الأنظمة الجامعية ومنصات الإنتاجية الأكثر استخدامًا",
    icon: "layout-grid",
    links: [
      { name: "SRU Website", url: "https://sr.edu.sa", icon: "globe" },
      { name: "Gmail", url: "https://gmail.com", icon: "mail" },
      { name: "Google Contacts", url: "https://contacts.google.com", icon: "contact" },
      { name: "Google Drive", url: "https://drive.google.com", icon: "hard-drive" },
      { name: "Microsoft 365", url: "https://www.office.com", icon: "app-window" },
      { name: "OneDrive", url: "https://sredusa-my.sharepoint.com/my", icon: "cloud" },
      { name: "Google Tasks", url: "https://tasks.google.com/tasks/", icon: "list-checks" }
    ]
  },
  {
    id: "staff", title: "خدمات الموظفين", subtitle: "الأنظمة المؤسسية وخدمات منسوبي الجامعة",
    icon: "users",
    links: [
      { name: "SRU Portal", url: "https://mysru.sr.edu.sa/login.aspx", icon: "landmark" },
      { name: "ServiceDesk", url: "https://sd.sr.edu.sa", icon: "headphones" },
      { name: "IBM Maximo", url: "https://eam-sru.com/maximo/webclient/login/login.jsp?welcome=true", icon: "factory" },
      { name: "المراسلات الإلكترونية", url: "https://cs.sr.edu.sa/start", icon: "send", ar: true },
      { name: "Oracle Fusion Test", url: "https://login-iadfkf-test.fa.ocs.oraclecloud.com/", icon: "flask-conical" },
      { name: "Oracle Fusion Production", url: "https://iadfkf.fa.ocs.oraclecloud.com/fscmUI/faces/FuseOverview", icon: "database" },
      { name: "Strategy", url: "https://sm.sr.edu.sa/auth", icon: "target" },
      { name: "SAP", url: "https://fiori2.wisys.com.sa/", icon: "boxes" },
      { name: "Staff Reset Password", url: "https://rpsf.sr.edu.sa/", icon: "key-round" }
    ]
  },
  {
    id: "students", title: "خدمات الطلاب", subtitle: "الأنظمة والخدمات الرقمية المخصصة للطلاب",
    icon: "graduation-cap",
    links: [
      { name: "Moodle", url: "https://elu.sr.edu.sa/", icon: "book-open" },
      { name: "SIS", url: "https://sis.sr.edu.sa/", icon: "school" },
      { name: "E-Library", url: "https://lib.sr.edu.sa/opac890/", icon: "library" },
      { name: "Skills in Medicine", url: "https://sim.sr.edu.sa/sim-src/", icon: "stethoscope" },
      { name: "Exam Seat Locator", url: "https://esl.sr.edu.sa/", icon: "map-pin" },
      { name: "Student Reset Password", url: "https://rpst.sr.edu.sa/", icon: "key-round" }
    ]
  },
  {
    id: "ai", title: "أدوات الذكاء الاصطناعي", subtitle: "منصات الذكاء الاصطناعي التوليدي المعتمدة أو شائعة الاستخدام",
    icon: "sparkles",
    links: [
      { name: "ChatGPT", url: "https://chatgpt.com/", icon: "message-square-code" },
      { name: "Gemini", url: "https://gemini.google.com/", icon: "gem" },
      { name: "Claude", url: "https://claude.ai/", icon: "bot" },
      { name: "Grok", url: "https://grok.com/", icon: "orbit" },
      { name: "Copilot", url: "https://copilot.microsoft.com/", icon: "panels-top-left" },
      { name: "NotebookLM", url: "https://notebooklm.google.com/", icon: "notebook-tabs" }
    ]
  },
  {
    id: "moe", title: "وزارة التعليم", subtitle: "موارد وأنظمة وزارة التعليم",
    icon: "building-2",
    links: [
      { name: "MOE", url: "http://10.1.107.152:8080/", icon: "building" },
      { name: "MOE Portal", url: "http://10.1.107.152:8080/", icon: "log-in" },
      { name: "MOE General", url: "http://10.1.107.152/admin/login", icon: "network" },
      { name: "MOE Employee", url: "http://10.1.107.152/employees/admin/login", icon: "badge-check" },
      { name: "MOE Staff", url: "http://10.1.107.152/teachingstaff/admin/login", icon: "users-round" },
      { name: "MOE Institute", url: "http://10.1.107.152/institute/admin/login", icon: "university" }
    ]
  },
  {
    id: "test", title: "أنظمة تحت التجربة", subtitle: "بيئات الاختبار والمشروعات التجريبية والتطويرية",
    icon: "test-tube-diagonal",
    links: [
      { name: "DMO", url: "https://drive.google.com/drive/folders/1cdDQ_KihIw5CVE4lTw0QGX5OxeGSnATw?usp=drive_link", icon: "database-zap" },
      { name: "Moodle Test", url: "http://10.2.2.111/moodle/login/index.php", icon: "book-copy" },
      { name: "خدمة المجتمع", url: "https://community.sr.edu.sa/", icon: "heart-handshake", ar: true },
      { name: "السكاكر", url: "https://mush-sakaker-front.vercel.app/", icon: "building-2", ar: true },
      { name: "Digital Signature", url: "http://10.1.103.50:81/login?next=/slide/10", icon: "signature" },
      { name: "دليل الطالب", url: "https://galaxy-click-56468078.figma.site", icon: "book-marked", ar: true },
      { name: "ZIWA", url: "https://app.ziwo.io/home", icon: "phone-call" },
      { name: "Wati", url: "https://auth.wati.io/login?authContextID=8f96055103b44931a062cda2b1ed833d&tenantID=476158", icon: "message-circle-more" },
      { name: "Convene", url: "https://sr-edu-sa.azeusconvene.com/", icon: "presentation" },
      { name: "Power BI Server", url: "http://powerbiserver/Reports/browse", icon: "chart-column" },
      { name: "ESM", url: "https://sd.sr.edu.sa/ESM.do?type=portal", icon: "waypoints" },
      { name: "n8n", url: "https://elmahdy2020.app.n8n.cloud/", icon: "workflow" },
      { name: "ICTD Task Netlify", url: "https://ictdtask.netlify.app", icon: "list-todo" },
      { name: "Master", url: "https://sru-master-programs.netlify.app/", icon: "graduation-cap" },
      { name: "DT", url: "https://sru-digital-enablement.netlify.app/", icon: "refresh-cw" }
    ]
  },
  {
    id: "forms", title: "النماذج", subtitle: "نماذج الطلبات والخدمات الجامعية",
    icon: "clipboard-list",
    links: [
      { name: "CS Form", url: "https://elmahdy2020.app.n8n.cloud/form/452792e2-b8a6-49ed-9c2e-1b81ced8d6fd", icon: "file-input" },
      { name: "طلب نقل أجهزة", url: "https://elmahdy2020.app.n8n.cloud/form/0863c96c-78fc-489c-908d-ba8fc04725db", icon: "monitor-up", ar: true },
      { name: "Telegram Bot", url: "https://t.me/sru_dsc_bot", icon: "send-horizontal" }
    ]
  }
];
