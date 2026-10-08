# حزمة الهوية الموحّدة · SRU Brand Kit — v1.0

ترويسة وتذييل موحّدان لجميع نماذج وتطبيقات الإدارة التنفيذية للاتصالات وتقنية المعلومات، يُضافان بسطر واحد.
*One shared header and footer for every ICTD / ITOC form, added with a single line.*

| العنصر | الموضع | المصدر |
|---|---|---|
| شعار جامعة سليمان الراجحي | أعلى الصفحة — يمين | `ITOC/assets/sru-logo.png` |
| شعار الإدارة التنفيذية للاتصالات وتقنية المعلومات | أعلى الصفحة — يسار | `ITOC/assets/ictd-logo.png` |
| اسم النموذج ورقم إصداره | أسفل الصفحة — يمين | من سمات وسم `<script>` |
| شعار ITOC مرتبط بمركز النماذج | أسفل الصفحة — يسار | `ITOC/assets/itoc-logo.png` → https://ictsru.github.io/ITOC/#forms |

## الاستخدام · Usage

أضف السطر التالي قبل `</body>` في أي نموذج:

```html
<script src="https://ictsru.github.io/ITOC/brand/sru-brand.js"
        data-form-title="اسم النموذج" data-form-version="v1.0" defer></script>
```

ثم احذف من النموذج أي ترويسة شعارات أو تذييل ITOC خاص به.

### خيارات اختيارية · Options

| السمة | الوظيفة |
|---|---|
| `data-form-title` | اسم النموذج في التذييل (افتراضيًا: عنوان الصفحة) |
| `data-form-version` | رقم إصدار النموذج في التذييل |
| `data-header="off"` | عدم إظهار ترويسة الشعارات |
| `data-footer="off"` | عدم إظهار التذييل |
| `data-print="show"` | إظهار الترويسة والتذييل عند الطباعة (افتراضيًا: مخفيان) |
| `data-assets="URL"` | مجلد شعارات بديل |

### تحديد الموضع · Placement
افتراضيًا تُضاف الترويسة في أول الصفحة والتذييل في آخرها. لتحديد موضع آخر ضع:
```html
<div data-sru-header></div>  ...  <div data-sru-footer></div>
```

## التحديث المركزي · Central updates
- **تغيير شعار:** استبدل الملف في `ITOC/assets/` بالاسم نفسه ← يتحدث في كل النماذج.
- **تغيير شكل الترويسة أو التذييل:** عدّل `brand/sru-brand.js` ← يتحدث في كل النماذج.
- قد يحتفظ المتصفح بالنسخة القديمة مؤقتًا (حتى 10 دقائق على GitHub Pages).

## الحماية من الأعطال · Fallback
إذا تعذّر تحميل أي شعار يظهر اسمه نصًا بدلًا منه، فلا تظهر صورة مكسورة.

## واجهة برمجية · API
`window.SRUBrand` = `{ version, logos: {sru, ictd, itoc}, hub, render() }`، ويُطلق الحدث `sru-brand:ready` بعد الإضافة.

## النماذج التي تستخدم الحزمة
| النموذج | المستودع |
|---|---|
| نموذج إعداد السياسات (v1.8) | `ictsru/Policy` |

انظر `example.html` لمثال عملي.
