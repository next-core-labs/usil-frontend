import React from 'react';
import { UsilMark } from '../components/UsilMark';
import { SAUDI_REGIONS } from '../data/saudiPlaces';
import { useLang } from './lang';
import { useStorefront } from './context';
import { fill } from './copy';

/** Navy four-column footer from the design: brand, Browse, Company, Regions, then the legal strip. */
export function SiteFooter() {
  const { t } = useLang();
  const sf = useStorefront();

  const cols: Array<{ title: string; links: Array<{ label: string; go: () => void; href: string }> }> = [
    {
      title: t.footBrowse,
      links: [
        { label: t.navCatalog, go: () => sf.goCatalog(), href: '/catalog' },
        { label: t.navRequest, go: () => sf.navigate('/request'), href: '/request' },
        { label: t.navOrders, go: () => sf.navigate('/orders'), href: '/orders' },
        { label: t.account, go: () => sf.navigate(sf.user ? '/account' : '/login'), href: '/account' },
      ],
    },
    {
      title: t.footCompany,
      links: [
        { label: t.navProviders, go: () => sf.navigate('/providers'), href: '/providers' },
        { label: t.footAbout, go: () => sf.navigate('/about'), href: '/about' },
        { label: t.footContact, go: () => sf.navigate('/support'), href: '/support' },
        { label: t.footRefund, go: () => sf.navigate('/refund'), href: '/refund' },
      ],
    },
    {
      title: t.footCities,
      links: SAUDI_REGIONS.slice(0, 6).map((region) => ({
        label: region,
        href: '/catalog',
        go: () => {
          sf.setSelectedCity(region);
          sf.goCatalog();
        },
      })),
    },
  ];

  return (
    <footer className="bg-navy text-white mt-[clamp(56px,8vw,96px)]">
      <div className="sf-wrap pt-[clamp(40px,5vw,64px)] pb-8 grid gap-8 grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))]">
        <div className="min-w-[200px]">
          <div className="flex items-center gap-2">
            <UsilMark variant="inverse" className="w-8 h-8" />
            <span className="font-bold text-[22px] tracking-[-0.02em]">{t.brand}</span>
          </div>
          <p className="mt-3.5 text-sm leading-[1.7] text-on-navy-muted max-w-[280px]">{t.footTag}</p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <div className="text-[13px] font-semibold tracking-[.04em] text-sky-200 mb-3.5">{col.title}</div>
            <div className="flex flex-col gap-2">
              {col.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault();
                    l.go();
                  }}
                  className="text-sm text-on-navy no-underline transition-colors hover:text-white min-h-0"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="sf-wrap py-[18px] flex items-center justify-between flex-wrap gap-3 text-xs text-on-navy-muted">
          <span>{fill(t.copyright, { year: new Date().getFullYear() })}</span>
          <span className="flex gap-4">
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                sf.navigate('/terms');
              }}
              className="text-on-navy-muted no-underline hover:text-white min-h-0"
            >
              {t.terms}
            </a>
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                sf.navigate('/privacy');
              }}
              className="text-on-navy-muted no-underline hover:text-white min-h-0"
            >
              {t.privacy}
            </a>
            <a
              href="/support"
              onClick={(e) => {
                e.preventDefault();
                sf.navigate('/support');
              }}
              className="text-on-navy-muted no-underline hover:text-white min-h-0"
            >
              {t.footSupport}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
