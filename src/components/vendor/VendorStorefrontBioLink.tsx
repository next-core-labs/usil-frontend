import React, { useEffect, useState } from 'react';
import { Link2, Copy, ShieldCheck } from 'lucide-react';
import type { VendorListing } from '../../contracts/vendors/vendor-listings';
import { pathForVendor } from '../../utils/siteRoutes';
import { encodeQrMatrix } from '../../utils/qrMatrix';

const SITE_ORIGIN = 'https://usil.app';

/** Real, scannable QR of `value`, rendered as SVG (nothing until it is encoded). */
const QrSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 128 }) => {
  const [matrix, setMatrix] = useState<boolean[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMatrix(null);
    encodeQrMatrix(value)
      .then((m) => {
        if (!cancelled) setMatrix(m);
      })
      .catch(() => {
        if (!cancelled) setMatrix(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!matrix) return null;
  const quiet = 2;
  const n = matrix.length + quiet * 2;
  const rects: React.ReactNode[] = [];
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) rects.push(<rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width={1} height={1} />);
    })
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="رمز QR لرابط صفحتك"
    >
      <rect width={n} height={n} fill="#fff" />
      <g fill="#000">{rects}</g>
    </svg>
  );
};

export const VendorStorefrontBioLink: React.FC<{
  projectName?: string;
  personName?: string;
  logoUrl?: string;
  vendorId?: string;
  listings?: VendorListing[];
}> = ({
  projectName = '',
  personName = '',
  logoUrl = '',
  vendorId = '',
  listings = [],
}) => {
  const [copied, setCopied] = useState(false);

  // Only a real vendor id resolves to a page (/vendor/:id); a name-based handle would 404.
  const realId = vendorId.trim();
  const storefrontUrl = realId ? `${SITE_ORIGIN}${pathForVendor(realId)}` : '';

  const handleCopy = () => {
    if (!storefrontUrl) return;
    void navigator.clipboard?.writeText(storefrontUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewListings = listings.slice(0, 3);

  return (
    <div className="space-y-6 text-right">
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-medium border border-indigo-200">
            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>رابط ملفك — من اسم مشروعك مو من كتالوج وهمي</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">رابط وصفحة الحجز المباشر</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            يظهر للعميل اسم مشروعك ومنتجاتك اللي أضفتها أنت.
          </p>
        </div>
        {storefrontUrl && (
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? '✓ تم نسخ الرابط' : 'نسخ رابط الملف'}</span>
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
            <h3 className="text-sm font-bold text-slate-900">رابط صفحتك</h3>
            {storefrontUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold break-all text-left"
                    dir="ltr"
                  >
                    {storefrontUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium"
                  >
                    {copied ? 'تم النسخ!' : 'نسخ'}
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950">
                  <div className="flex items-center gap-2 font-bold text-indigo-900">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>شارك هذا الرابط في البايو أو الواتساب ليفتح العميل صفحتك مباشرة.</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                يظهر رابط صفحتك هنا بعد اكتمال تسجيل حسابك كمورّد.
              </p>
            )}
          </div>

          {storefrontUrl && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
              <h3 className="text-sm font-bold text-slate-900">رمز الاستجابة السريعة</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-36 h-36 bg-white p-1 rounded-2xl border border-slate-300 flex items-center justify-center">
                  <QrSvg value={storefrontUrl} size={128} />
                </div>
                <div className="space-y-2 text-right flex-1">
                  <div className="text-xs font-medium text-slate-900">كود صفحة {projectName || 'مشروعك'}</div>
                  <div className="text-2xs text-slate-500 font-mono break-all" dir="ltr">
                    {storefrontUrl}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-[40px] bg-slate-900 p-4 border-4 border-slate-800">
            <div className="rounded-[32px] bg-white overflow-hidden text-right text-slate-900 min-h-[540px] flex flex-col justify-between">
              <div className="bg-gradient-to-b from-navy to-[#132A52] text-white p-6 text-center space-y-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white mx-auto" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 mx-auto" />
                )}
                <div>
                  <h4 className="font-bold text-base">{projectName || 'اسم مشروعك'}</h4>
                  <p className="text-xs text-slate-300 font-normal">{personName || 'يظهر هنا بعد ما تسجّل'}</p>
                </div>
              </div>
              <div className="p-4 space-y-2.5 flex-1 overflow-y-auto">
                {previewListings.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">ما أضفت منتجات بعد — ما نعرض صور وهمية هنا.</p>
                ) : (
                  previewListings.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{item.title}</span>
                        <span className="font-mono text-action">{item.price} ر.س</span>
                      </div>
                      <span className="text-2xs text-slate-500 block">{item.shortDesc}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                <button type="button" className="w-full py-2.5 rounded-xl bg-action text-white text-xs font-medium">
                  احجز مع {projectName || 'المورد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
