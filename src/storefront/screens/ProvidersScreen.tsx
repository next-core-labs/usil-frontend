import React from 'react';
import { Wallet, LayoutGrid, MessageCircle, ShieldCheck } from 'lucide-react';
import { CATEGORIES } from '../../data/services';
import { SAUDI_REGIONS } from '../../data/saudiPlaces';
import { FULFILLMENT_LANES } from '../../data/saudiMarket';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { ArrowIcon, Reveal } from '../primitives';
import { formatCount } from '../money';

/** «انضم كمزوّد» landing: blue hero with honest platform facts, benefits, 3-step wizard preview. */
export function ProvidersScreen() {
  const { t } = useLang();
  const sf = useStorefront();

  const stats = [
    { v: formatCount(CATEGORIES.length - 1), l: t.prStats1 },
    { v: formatCount(SAUDI_REGIONS.length), l: t.prStats2 },
    { v: formatCount(FULFILLMENT_LANES.length), l: t.prStats3 },
  ];
  const benefits = [
    { Icon: Wallet, title: t.prB1, body: t.prB1s },
    { Icon: LayoutGrid, title: t.prB2, body: t.prB2s },
    { Icon: MessageCircle, title: t.prB3, body: t.prB3s },
    { Icon: ShieldCheck, title: t.prB4, body: t.prB4s },
  ];
  const steps = [t.prS1, t.prS2, t.prS3];

  return (
    <main>
      <section className="bg-action text-white">
        <div className="sf-wrap py-[clamp(48px,7vw,96px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-10 items-center">
          <div>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-sky-100 tracking-[.04em]">
              <span className="w-6 h-0.5 bg-white" aria-hidden />
              {t.navProviders}
            </div>
            <h1 className="mt-4 mb-3.5 text-[clamp(34px,5.4vw,64px)] font-bold tracking-[-0.03em] leading-[1.08] sf-balance">{t.prTitle}</h1>
            <p className="mb-7 text-[17px] leading-[1.7] text-on-navy max-w-[520px]">{t.prSub}</p>
            <button
              type="button"
              onClick={sf.openVendorRegister}
              className="h-[54px] px-7 rounded-xl bg-navy text-white text-base font-bold inline-flex items-center gap-2 transition-transform hover:-translate-y-[3px]"
            >
              {t.prCta}
              <ArrowIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-px bg-white/20 rounded-card overflow-hidden">
            {stats.map((s) => (
              <div key={s.l} className="bg-action px-4 py-[22px] text-center">
                <div className="text-[clamp(26px,3vw,40px)] font-bold tracking-[-0.03em] leading-none tnum">{s.v}</div>
                <div className="text-xs text-sky-100 mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sf-wrap pt-[clamp(48px,7vw,88px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 70} className="bg-surface border border-line rounded-card p-6">
              <span className="w-[46px] h-[46px] rounded-xl bg-navy text-white grid place-items-center">
                <b.Icon className="w-[22px] h-[22px]" aria-hidden />
              </span>
              <div className="text-[17px] font-bold mt-7">{b.title}</div>
              <div className="text-sm text-ink-1 leading-[1.7] mt-1.5">{b.body}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sf-wrap pt-[clamp(40px,6vw,72px)]">
        <Reveal className="bg-navy text-white rounded-panel p-[clamp(24px,4vw,48px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6 items-center">
          <div>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.03em]">{t.prHowTitle}</h2>
            <button
              type="button"
              onClick={sf.openVendorRegister}
              className="mt-5 h-12 px-6 rounded-xl bg-surface text-navy text-[15px] font-bold inline-flex items-center gap-2 hover:bg-action hover:text-white transition-colors"
            >
              {t.prCta}
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={s} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 py-4 border-b border-white/10 last:border-0">
                <span className="text-2xl font-bold text-sky leading-none tnum">0{i + 1}</span>
                <span className="text-[15px] font-semibold">{s}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    </main>
  );
}
