# تحديث المستودع الحالي إلى v2.1.0

المستودع: https://github.com/RagabLabs/NuclearDecay-Lab

الموقع الحالي: https://ragablabs.github.io/NuclearDecay-Lab/

هذه النسخة جاهزة لتحديث **نفس المستودع**. لم تُرفع التعديلات أو تُدمج أو تُنشر أثناء إعداد التسليم. لا تحتاج إلى إنشاء مستودع جديد. يحتفظ التطبيق بمسارات `#/` وبنية المدخلات المشتركة إصدار 2 لتظل الروابط السابقة متوافقة.

## جرّب النسخة أولًا

فك ZIP وافتح `nuclear-decay-lab/dist/nuclear-decay-lab.html`. اقرأ `docs/SCIENTIFIC_VALIDATION.md` و`docs/SCIENTIFIC_AUDIT_REPORT.md` و`docs/verification.md`. الفحوص الآلية نجحت؛ الفحص البصري بمتصفح حقيقي وPNG والطباعة يحتاج مراجعتك قبل النشر.

## تحديث باستخدام Git وPull Request

من الطرفية:

```bash
git clone https://github.com/RagabLabs/NuclearDecay-Lab.git
cd NuclearDecay-Lab
git switch -c scientific-validation-v2.1.0
```

انسخ **محتويات** مجلد `nuclear-decay-lab` الموجود داخل ZIP إلى جذر النسخة المحلية من المستودع. استبدل الملفات المعدلة، بما فيها `src` و`tests` و`scripts` و`docs` و`.github/workflows` و`package.json` و`package-lock.json` والإعدادات وREADME وCHANGELOG. لا تنسخ مجلد المشروع بوصفه مجلدًا إضافيًا داخل المستودع. لا تحذف مجلد `.git`. لا ترفع `node_modules` أو `coverage` أو ملفات البيئة؛ `dist` موجود في التسليم للتجربة ويعيد Actions بناءه من المصدر.

تحقق محليًا:

```bash
npm ci
python3 scripts/generate-validation-fixtures.py --check
npm test
npm run typecheck
npm run build
npm run verify:build
git diff --check
git status --short
```

راجع التغييرات ثم ارفع **الفرع** للمراجعة:

```bash
git add .
git commit -m "Release v2.1.0 scientific validation and numerical fixes"
git push -u origin scientific-validation-v2.1.0
```

افتح GitHub واختر **Compare & pull request**. عنوان مناسب: `v2.1.0 — Scientific Validation Release`. أرفق نتائج الاختبارات والقيود من `docs/verification.md`. لا تدمج قبل مراجعة التغييرات والفحوص البصرية المطلوبة. يمكنك جعل فحص `Scientific and application checks` إلزاميًا في قواعد حماية `main`.

## رفع عبر واجهة GitHub

أنشئ فرعًا من `main` داخل نفس المستودع، وارفع ملفات المصدر والاختبارات والتوثيق والإعدادات المحدثة إلى جذر ذلك الفرع. راجع ملفات `.github/workflows`؛ بعض طرق اختيار الملفات تخفي المجلدات التي تبدأ بنقطة. افتح Pull Request إلى `main` بدل الرفع المباشر إلى الفرع المنشور.

## النشر بعد الموافقة

الموافقة على دمج Pull Request في `main` **تُشغّل سير عمل النشر الموجود تلقائيًا**. لا تدمج إذا لم تكن تريد النشر بعد. من **Settings → Pages → Source** يجب أن يكون المصدر **GitHub Actions**. يتوقف النشر عند فشل التحقق من المراجع المستقلة أو الاختبارات أو TypeScript أو البناء أو فحص الإنتاج.

الإعداد الافتراضي `base: './'` يولد مسارات نسبية تعمل تحت `/NuclearDecay-Lab/`. فحص الإنتاج يتأكد من وجود JavaScript وCSS والأيقونة داخل هذا المسار، ويشغّل مدخل البناء عند عنوان المستودع مع رابط صفحة مباشر `#/half-life`. ويمكن ضبط `VITE_BASE_PATH=/NuclearDecay-Lab/` إذا أردت مسارًا صريحًا؛ ليس ضروريًا للبناء المرفق.

بعد نجاح Actions، افتح الموقع وجرّب جميع الأدوات واللغتين والثيمات والأحجام الضيقة والعريضة. افحص تنزيل CSV وPNG وHTML والطباعة فعلًا. مثال C-14: `100 MBq` و`5730 y` يعطي `49.82 MBq` في العرض المعتاد، مع القيمة العددية الكاملة في التفاصيل. عند إدخال نصف العمر المرجعي المحوّل نفسه يكون النشاط `50 MBq`.
