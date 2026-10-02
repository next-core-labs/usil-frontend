import React, { useEffect, useState } from 'react';
import { MessageCircle, Store, ShieldCheck } from 'lucide-react';
import type { ServiceItem } from '../../types';
import type { VendorPublicFile } from '../../contracts/vendors/vendor-profile';
import { VendorSocialIcons } from './VendorSocialIcons';
import { FULFILLMENT_AR_LABEL } from '../../contracts/vendors/vendor-listings';
import { ProductCard } from '../../storefront/ProductCard';
import { useLang } from '../../storefront/lang';
import { formatCount } from '../../storefront/money';

type PublicPayload = VendorPublicFile & { listings?: ServiceItem[] };

/** `/vendor/:id` — the provider's public file in the storefront's visual language. */
export function VendorPublicPage({
  vendorId,
  onOpenListing,
  onMessageVendor,
}: {
  vendorId: string;
  onOpenListing: (service: ServiceItem) => void;
  /** Omitted when the viewer cannot message vendors (vendor and staff accounts). */
  onMessageVendor?: (vendor: { vendorId: string; vendorName: string }) => void;
}) {
  const { t, L } = useLang();
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [file, setFile] = useState<PublicPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(`/api/vendors/${encodeURIComponent(vendorId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json.data) {
          setStatus('missing');
          return;
        }
        setFile(json.data as PublicPayload);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  if (status === 'loading') {
    return (
      <main className="sf-wrap pt-8 pb-16" aria-busy="true">
        <div className="usil-skeleton h-40 rounded-card" />
      </main>
    );
  }

  if (status === 'missing' || !file) {
    return (
      <main className="sf-wrap pt-8 pb-16">
        <div className="py-16 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card max-w-xl mx-auto">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <Store className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{L('ما لقينا ملف هذا المورد', 'We could not find this provider')}</div>
          <div className="text-sm text-ink-3 mt-1.5">{L('إما الحساب غير معتمد بعد، أو الرابط غلط.', 'Either the account is not approved yet, or the link is wrong.')}</div>
        </div>
      </main>
    );
  }

  const listings = file.listings || [];

  return (
    <main className="sf-wrap pt-8 pb-16">
      <header className="bg-navy text-white rounded-card p-[clamp(20px,3vw,28px)] flex items-start gap-[18px] flex-wrap">
        {file.logoUrl ? (
          <img src={file.logoUrl} alt={file.projectName} className="w-20 h-20 rounded-card object-cover bg-surface" />
        ) : (
          <span className="w-20 h-20 rounded-card bg-action grid place-items-center">
            <Store className="w-8 h-8" aria-hidden />
          </span>
        )}
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-200">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
            {t.pendingVendor}
          </div>
          <h1 className="text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em] mt-1">{file.projectName}</h1>
          <p className="text-sm text-on-navy-muted">{file.personName}</p>
          {file.projectType ? <p className="text-xs text-on-navy-muted mt-0.5">{file.projectType}</p> : null}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {file.fulfillment.map((lane) => (
              <span key={lane} className="px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-semibold">
                {FULFILLMENT_AR_LABEL[lane as keyof typeof FULFILLMENT_AR_LABEL] || lane}
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-semibold tnum">
              {formatCount(listings.length)} {t.listingsWord}
            </span>
          </div>
          {file.socials?.length ? (
            <div className="mt-3">
              <VendorSocialIcons links={file.socials} />
            </div>
          ) : null}
        </div>
        {onMessageVendor ? (
          <button
            type="button"
            onClick={() => onMessageVendor({ vendorId, vendorName: file.projectName })}
            className="h-11 px-4 rounded-control bg-surface text-navy text-sm font-semibold inline-flex items-center gap-2 hover:bg-action hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            {t.chatVendor}
          </button>
        ) : null}
      </header>

      {listings.length === 0 ? (
        <div className="mt-6 py-14 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <div className="text-lg font-bold">{L('هذا المورد ما نشر منتجات بعد', 'This provider has not published products yet')}</div>
          <div className="text-sm text-ink-3 mt-1">{L('ما نعرض كتالوج وهمي مكان منتجاته.', 'We never show a placeholder catalog in their place.')}</div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-3.5">
          {listings.map((service) => (
            <ProductCard key={service.id} service={service} onOpen={onOpenListing} className="h-full" />
          ))}
        </div>
      )}
    </main>
  );
}
