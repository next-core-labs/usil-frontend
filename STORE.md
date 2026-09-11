# يوصل / Usil — دليل المتاجر (App Store + Play)

Arabic first, English below. This slice is marketplace + legal + Android project — not every market problem.

---

## عربي — ماذا شُحن وماذا يبقى عليك

### الروابط العامة (ضعها في المتاجر)

- الموقع: https://usil.app
- سياسة الخصوصية: **https://usil.app/privacy**
- شروط الاستخدام: **https://usil.app/terms**

بعد النشر حدّث الصفحة بقوة (Ctrl+Shift+R / اسحب للتحديث مع تجاهل الكاش).

### iOS — ما زال يحتاج Mac

- التطبيق موجود في App Store Connect: Apple ID `6807169838`، Bundle ID `sa.usil.app`.
- مشروع Xcode موجود على السيرفر تحت `ios/`. CocoaPods لم تُثبَّت من Linux — على الماك: `cd ios/App && pod install`.
- **لا يمكن عمل Archive ولا رفع IPA من Linux ولا من iPad.** تحتاج Mac + Xcode → Product → Archive → Upload to App Store Connect.
- Capacitor يفتح https://usil.app داخل التطبيق (ليس Expo، ليس EAS).

### Android — المجلد أُضيف على السيرفر

نُفِّذ `npx cap add android` في `/var/www/midyaf`.  
`applicationId`: `sa.usil.app` · `versionName`: `1.0` · Capacitor Android `7.6.8` (متوافق مع core).  
المجلد `android/` مستثنى من صورة Docker ومن Git على السيرفر (`.dockerignore` / `.gitignore`) حتى لا يدخل `dist` داخل الحاوية.

شغلك بعد ذلك:

1. انسخ مجلد `android/` إلى جهاز فيه Android Studio (أو CI).
2. أنشئ مفتاح توقيع (keystore) واحفظه خارج Git.
3. ابنِ **AAB موقّع**: `./gradlew bundleRelease` (بعد ضبط `signingConfigs`).
4. ارفع الـ AAB على [Google Play Console](https://play.google.com/console) مع:
   - Privacy policy: `https://usil.app/privacy`
   - نفس Bundle ID / applicationId: `sa.usil.app`

هذا الجهاز Linux **لا يرفع** التطبيق إلى Play نيابة عنك.

### صراحة — لا نعد بـ

- رفع ثنائي App Store من هذا الـ VM
- فوترة ZATCA الإلكترونية
- ربط بنوك الطعام / هدر الغذاء
- سوق B2B مؤسسي كامل

«سو كل شي» هنا = شريحة السوق (مواسم، باقات، جمهور، شارات ضريبة) + صفحات قانونية + مشروع Android Capacitor.

---

## English — store steps

### Public URLs

- App: https://usil.app
- Privacy: https://usil.app/privacy
- Terms: https://usil.app/terms

Hard-refresh after deploys (`Cache-Control: no-store` on HTML).

### iOS (Mac required)

App Store Connect app exists (Apple ID 6807169838, bundle `sa.usil.app`). Archive/upload **cannot** be done from this Linux VM or from an iPad-only setup. On a Mac: `pod install` in `ios/App`, then Xcode Archive.

Usil is Capacitor wrapping the live site (`server.url = https://usil.app`). Do not use Expo / EAS / Ionic starter kits.

### Android (your Play Console)

We add the Capacitor `android/` folder on the server. You still must:

1. Open it in Android Studio
2. Create a release keystore (never commit it)
3. Build a **signed AAB**
4. Upload via Play Console, privacy URL `https://usil.app/privacy`

### Out of scope

No ZATCA e-invoicing, no food-waste bank APIs, no App Store binary upload from Linux, no full B2B suite. This is the marketplace / legal / Android **slice**.
