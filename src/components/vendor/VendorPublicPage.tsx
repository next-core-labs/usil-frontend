import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import type { ServiceItem } from '../../types';
import type { VendorPublicFile } from '../../contracts/vendors/vendor-profile';
import { VendorSocialIcons } from './VendorSocialIcons';
import { ServiceCard } from '../ServiceCard';
import { FULFILLMENT_AR_LABEL } from '../../contracts/vendors/vendor-listings';

type PublicPayload = VendorPublicFile & { listings?: ServiceItem[] };

export function VendorPublicPage({
  vendorId,
  onOpenListing,
}: {
  vendorId: string;
  onOpenListing: (service: ServiceItem) => void;
}) {
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
      <div className="max-w-3xl mx-auto p-6 animate-pulse space-y-3" dir="rtl">
        <div className="h-16 w-16 rounded-xl bg-slate-200" />
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-32 bg-slate-100 rounded" />
      </div>
    );
  }

  if (status === 'missing' || !file) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center space-y-2" dir="rtl">
        <Store className="w-10 h-10 mx-auto text-slate-400" />
        <h1 className="text-xl font-bold text-navy">ما لقينا ملف هذا المورد</h1>
        <p className="text-sm text-slate-500">إما الحساب غير معتمد بعد، أو الرابط غلط.</p>
      </div>
    );
  }

  const listings = file.listings || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <header className="flex items-start gap-4">
        {file.logoUrl ? (
          <img src={file.logoUrl} alt={file.projectName} className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-navy text-white flex items-center justify-center">
            <Store className="w-8 h-8" />
          </div>
        )}
        <div>
          <p className="text-2xs font-medium text-action">ملف مورّد يوصل</p>
          <h1 className="text-2xl font-bold text-navy">{file.projectName}</h1>
          <p className="text-sm text-slate-600">{file.personName}</p>
          {file.projectType ? <p className="text-xs text-slate-500 mt-1">{file.projectType}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {file.fulfillment.map((lane) => (
              <span key={lane} className="px-2 py-0.5 rounded-full bg-action text-white text-2xs font-medium">
                {FULFILLMENT_AR_LABEL[lane as keyof typeof FULFILLMENT_AR_LABEL] || lane}
              </span>
            ))}
          </div>
          {file.socials?.length ? (
            <div className="mt-3">
              <VendorSocialIcons links={file.socials} />
            </div>
          ) : null}
        </div>
      </header>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-bold text-slate-900">هذا المورد ما نشر منتجات بعد</p>
          <p className="text-xs text-slate-500 mt-1">ما نعرض كتالوج وهمي مكان منتجاته.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {listings.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onOpenDetails={onOpenListing}
              onAddToCart={() => onOpenListing(service)}
              isInCart={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
