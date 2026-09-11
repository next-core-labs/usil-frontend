/**
 * UI contracts for the auth screens.
 *
 * These assertions used to live in the backend auth suites (auth-session-stay,
 * auth-login-remember, auth-forgot-password). They read React source text, so
 * they moved here when the backend was split into its own project.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readSource } from '../test-support/repo-paths.ts';

describe('auth UI contracts', () => {
  it('imports AdminDashboard so admin login does not render an undefined panel', () => {
    const app = readSource('src/App.tsx');
    assert.match(app, /import \{ AdminDashboard \} from '\.\/components\/admin\/AdminDashboard'/);
    assert.equal(app.includes("if (currentUser?.role === 'vendor') setViewMode('vendor')"), false);
  });

  it('shows حفظ البيانات on login and never writes the password to localStorage', () => {
    const login = readSource('src/LoginScreen.tsx');
    assert.match(login, /حفظ البيانات/);
    assert.match(login, /خلّك داخل على هذا الجهاز/);
    assert.match(login, /usil_remember_email/);
    assert.match(login, /remember:\s*mode === 'login' \? remember/);
    assert.equal(/localStorage\.setItem\([^)]*password/i.test(login), false);
    assert.match(login, /localStorage\.removeItem\('usil_remember_password'\)/);
    assert.equal(login.includes('الحقول فارغة — البريد والجوال والرقم السري مطلوبة كلها.'), true);
    assert.equal(login.includes('تعذر تسجيل الدخول. تحقق من البيانات.'), true);
  });

  it('keeps the Arabic reset link inside the auth modal only', () => {
    const login = readSource('src/LoginScreen.tsx');
    const navbar = readSource('src/components/Navbar.tsx');
    assert.match(login, /نسيت كلمة المرور؟/);
    assert.match(login, /استعادة الحساب/);
    assert.match(login, /تم تغيير الرقم السري\. ادخل الآن/);
    assert.equal(login.includes("useState('123456')"), false);
    assert.equal(navbar.includes('نسيت كلمة المرور'), false);
  });
});
