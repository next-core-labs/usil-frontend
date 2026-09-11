# شريحة يوصل الحيّة (Vite)

> بنية المشروع ومرجع المطورين: [ARCHITECTURE.md](ARCHITECTURE.md)
> 
> **الواجهة الخلفية انفصلت إلى مشروع مستقل: `../usil backend`** — كل ما يخص الـAPI
> والمصادقة والمدفوعات وتخزين البيانات صار هناك. انظر `../usil backend/README.md`.

بحث المدن يشمل 13 منطقة إدارية مع المحافظات والقرى والمراكز. اكتب الاسم في شريط «المدينة» بدل القائمة القصيرة السابقة.

## التشغيل محلياً

يحتاج Node 22. الواجهة الأمامية والخلفية صارا مشروعين منفصلين — شغّلهما معاً:

```bash
# 1) الخلفية
cd "../usil backend"
npm install
npm run dev                 # http://127.0.0.1:43147

# 2) الواجهة
cd usil
npm install
npm run dev                 # http://127.0.0.1:3000
```

`/api` و `/uploads` تُمرَّر تلقائياً إلى الخلفية عبر بروكسي Vite.

للإنتاج، الخلفية هي من يقدّم الـSPA:

```bash
cd usil && npm run build
cd "../usil backend" && npm run sync:web && npm run build && npm start
```

## ميسر (دفع إلكتروني)

> هذه المسارات تعمل الآن في مشروع `../usil backend`.

الدفع عبر **فاتورة مستضافة**: `POST /v1/invoices` ثم تحويل العميل إلى `invoice.url` على نطاق ميسر. البطاقة لا تمر على سيرفر يوصل.

- إنشاء فاتورة: `POST /api/payments/invoice`
- حالة الدفعة: `GET /api/payments/:id`
- ويبهوك: `POST /api/payments/webhook` (يتطلب `MOYASAR_WEBHOOK_SECRET`)
- الرجوع: `/payment/success` و `/payment/cancelled`
- تفعيل من لوحة الإدارة: تبويب **ميسر** → الصق `sk_live_` أو `sk_test_` (من العين بجانب Secret Key، بدون نجوم)

المصادقة Basic: اسم المستخدم `sk_live_` أو `sk_test_` وكلمة المرور فارغة.

المفتاح يُحفظ في `data/moyasar.json` على الخادم (خارج git) ويُطبَّق فوراً بدون إعادة بناء إن فُعّل من اللوحة.

على ويندوز، إن كان المفتاح أصلاً في `.env.local` على سطح المكتب، من PowerShell (مو Git Bash) داخل مجلد المشروع:

```powershell
.\scripts\enable-moyasar-sccc.ps1
```

هذا يرفع المفتاح إلى الخادم، يعيد إنشاء حاوية التطبيق، ويسجّل الويبهوك. لا يطبع المفتاح. يُبقي `MOYASAR_WEBHOOK_SECRET` الموجود على الخادم كما هو.

أو محلياً فقط:

```powershell
.\scripts\set-secret.ps1 PAYMENT_PROVIDER_SECRET_KEY
.\scripts\complete-moyasar.ps1
```

## Cloudflare (ويبهوك ميسر)

`https://usil.app` خلف Cloudflare مع Bot Fight Mode. طلبات ميسر تجي من سيرفرات مو متصفح، فـ Cloudflare يرد `403` (`cf-mitigated: challenge`). قاعدة WAF ما تتخطى Bot Fight على الخطة المجانية.

الحل: سجل **DNS only** (سحابة رمادية) لـ `hooks.usil.app` → IP الأصل، وCaddy يمرّره لنفس التطبيق. الفاتورة ترسل `callback_url` إلى:

`https://hooks.usil.app/api/payments/webhook`

من لوحة Cloudflare يدوياً:

1. DNS → Add record → Type **A** → Name **hooks** → IPv4 **8.213.85.166**
2. Proxy status: **DNS only** (رمادي، مو برتقالي)
3. Save

أو إذا عندك توكن:

```bash
export CLOUDFLARE_API_TOKEN=...
python3 scripts/connect-cloudflare.py
```

بعد ما السجل ينتشر:

```bash
python3 scripts/register-moyasar-webhook.py
```

كتلة Caddy لـ `usil.app` تبقى كما هي. نضيف فقط موقع `hooks.usil.app` بجانبها.

الملفات هنا تُنسخ إلى `/var/www/midyaf/` على ECS ثم تُبنى بـ:

```bash
docker compose build && docker compose up -d --force-recreate
```

بعد النشر: حدّث الصفحة بقوة (Ctrl+Shift+R / Cmd+Shift+R) لأن الواجهة تُبنى داخل الحاوية.

## سوق بلا مورّدين وهميين

التسجيل كمورد يحفظ **اسم المشروع ونوعه وشعاره وحساباته** كما كتبها صاحب الحساب. بعد موافقة الإدارة تظهر هذه البيانات في مساحة المورّد وفي `/vendor/:id`. السوق لا يعرض كتالوج بذرة ولا منتجات وهمية: `SERVICES` فارغ، والبطاقات تأتي من `/api/catalog/listings` فقط.

لتفريغ الموردين المحليين مرة واحدة: `npm run wipe:vendors`

## ما شُحن في هذه الشريحة

- `src/LoginScreen.tsx` — بدون كلمات مرور تجريبية على الواجهة العامة
- `src/components/BookingTrustBox.tsx` — سعر نهائي + ضريبة 15% + رابط سياسة الاسترجاع + ضمان التأخير
- `src/components/market/HowUsilWorks.tsx` — شريط «كيف يشتغل يوصل»
- `src/components/legal/` — `/privacy` `/terms` `/refund` `/support` مع عنوان ووصف عربي
- `src/utils/seo.ts` + `../usil backend/server/seo/` — عنوان الصفحة والوصف حسب المسار، مع حقن من إعدادات الإدارة
- لوحة **تحسين الظهور / SEO** في الإدارة: عنوان، وصف، OG، تويتر، robots.txt، خريطة الموقع، تحقق Search Console، وتحليلات اختيارية
- `GET /robots.txt` و `GET /sitemap.xml` و `GET /api/seo/public`
- `src/App.tsx` — مناسبات وجمهور فوق الطية، حالات فارغ/تحميل/خطأ
- دفع ميسر: `../usil backend/server/payments/` + `POST /api/bookings` + `GET /api/payments/moyasar`

`capacitor.config.ts` — `sa.usil.app` يلف https://usil.app

خطوات المتاجر: [STORE.md](STORE.md)
# usil-frontend
