import React, { useEffect } from 'react';
import { ShieldCheck, ClipboardList, MessageCircle, Heart } from 'lucide-react';
import { LoginScreen } from '../../LoginScreen';
import { UsilMark } from '../../components/UsilMark';
import { useLang } from '../lang';
import { useStorefront } from '../context';

/**
 * `/login` — the auth card from the design, with a navy brand panel beside it
 * on wide screens listing what an account unlocks (orders, chat, favourites).
 */
export function LoginPage() {
  const { t, L } = useLang();
  const sf = useStorefront();
  const mode = (sf.search.get('mode') as 'login' | 'register' | 'verify' | null) || 'login';
  const next = sf.search.get('next') || '';

  // A signed-in user only belongs here to verify their email.
  useEffect(() => {
    if (sf.user && mode !== 'verify') sf.navigate(next || '/account', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sf.user?.id]);

  const perks = [
    { Icon: ClipboardList, title: L('تابع طلباتك', 'Track your orders'), sub: L('الحالة، الدفع، والإلغاء حسب سياسة الاسترجاع.', 'Status, payment, and cancellation under the refund policy.') },
    { Icon: MessageCircle, title: L('راسل المورّدين', 'Message providers'), sub: L('اسأل عن التوفر والتفاصيل قبل الحجز.', 'Ask about availability and details before booking.') },
    { Icon: Heart, title: L('احفظ المفضلة', 'Keep favourites'), sub: L('ارجع للخدمات اللي أعجبتك بضغطة.', 'Return to the services you liked in one tap.') },
  ];

  return (
    <main className="min-h-[70vh] py-10 px-[clamp(16px,4vw,40px)]">
      <div className="mx-auto max-w-[960px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-6 items-stretch">
        <aside className="hidden lg:flex flex-col justify-between bg-navy text-white rounded-[20px] p-9 relative overflow-hidden">
          <div aria-hidden className="absolute -start-24 -bottom-24 w-80 h-80 rounded-full border-[60px] border-action/25" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <UsilMark variant="inverse" className="w-10 h-10" />
              <span className="font-bold text-2xl tracking-[-0.02em]">{t.brand}</span>
            </div>
            <h2 className="mt-8 text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em] leading-[1.15] sf-balance">
              {t.heroTitle}
              <br />
              <span className="text-sky">{t.heroHighlight}</span>
            </h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-on-navy-soft max-w-[400px]">{t.accGuestSub}</p>
          </div>
          <ul className="relative mt-10 flex flex-col gap-4">
            {perks.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-white/10 text-sky grid place-items-center shrink-0">
                  <p.Icon className="w-5 h-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{p.title}</span>
                  <span className="block text-[13px] text-on-navy-muted mt-0.5 leading-[1.6]">{p.sub}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="relative mt-8 flex items-center gap-2 text-xs text-on-navy-muted">
            <ShieldCheck className="w-4 h-4 text-sky" aria-hidden />
            {L('جلسة آمنة · بياناتك تُعالج في السعودية', 'Secure session · data processed in Saudi Arabia')}
          </div>
        </aside>

        <div className="flex items-start justify-center">
          <LoginScreen
            key={mode}
            embedded
            defaultMode={mode}
            verifyPrefill={sf.user ? { email: sf.user.email, phone: sf.user.phone } : undefined}
            onSuccess={(user, meta) => {
              sf.onAuthSuccess(user);
              if (meta?.needsEmailVerification) return;
              sf.navigate(next || '/account', { replace: true });
            }}
            onOpenVendorRegister={sf.openVendorRegister}
            onOpenCourierRegister={sf.openCourierRegister}
            guestLabel={t.orGuest}
            onContinueAsGuest={() => sf.goHome()}
          />
        </div>
      </div>
    </main>
  );
}
