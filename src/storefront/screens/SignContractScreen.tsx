import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSignature, Link2Off, Loader2, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { UsilMark } from '../../components/UsilMark';
import { SignaturePad, type SignaturePadHandle } from '../../components/contracts/SignaturePad';
import { fetchContract, signContract, type PublicContract } from '../../components/contracts/signContractApi';
import { signTokenFromPath } from '../../utils/siteRoutes';

/**
 * `/sign/<token>` — the client reads the contract the vendor sent and signs
 * it themselves: typed full name, a drawn signature and explicit consent. No
 * account is needed; the private link is the key. Never indexed.
 */

const AR = 'ar-SA-u-nu-latn-ca-gregory';
const stampFormat = new Intl.DateTimeFormat(AR, {
  timeZone: 'Asia/Riyadh',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const dayFormat = new Intl.DateTimeFormat(AR, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function stamp(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : `${stampFormat.format(date)} (توقيت الرياض)`;
}

function day(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : dayFormat.format(parsed);
}

function sar(value: number): string {
  return `${(Number(value) || 0).toLocaleString(AR, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;
}

/** Keeps crawlers out even if the server header is stripped by a proxy. */
function useNoIndex(title: string) {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = meta?.getAttribute('content') ?? null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    let referrer = document.querySelector<HTMLMetaElement>('meta[name="referrer"]');
    const previousReferrer = referrer?.getAttribute('content') ?? null;
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.setAttribute('name', 'referrer');
      document.head.appendChild(referrer);
    }
    referrer.setAttribute('content', 'no-referrer');
    return () => {
      if (previous === null) meta?.remove();
      else meta?.setAttribute('content', previous);
      if (previousReferrer === null) referrer?.remove();
      else referrer?.setAttribute('content', previousReferrer);
    };
  }, []);
  useEffect(() => {
    // The shell's SEO pass (and its late remote-SEO pass) writes the store's
    // title after this screen mounts; keep the contract's title while it is open.
    document.title = title;
    const node = document.querySelector('title');
    if (!node || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      if (document.title !== title) document.title = title;
    });
    observer.observe(node, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [title]);
}

type View =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; contract: PublicContract };

/**
 * The app-install banner would cover the signature box on a phone. It reads
 * its session flag in an effect that runs after this screen first renders,
 * so setting the flag here keeps it away for this visit.
 */
function quietInstallBanner(): true {
  try {
    sessionStorage.setItem('usil_pwa_dismissed', 'true');
  } catch {
    /* storage blocked — the banner can still be closed by hand */
  }
  return true;
}

export function SignContractScreen() {
  useState(quietInstallBanner);
  const token = signTokenFromPath(window.location.pathname) || '';
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [changed, setChanged] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** The signature just drawn here — shown in the printable copy after signing. */
  const [signedImage, setSignedImage] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);
  const pad = useRef<SignaturePadHandle>(null);

  const contract = view.kind === 'ready' ? view.contract : null;
  useNoIndex(contract ? `عقد ${contract.number} — ${contract.vendor.name} | يوصل` : 'توقيع عقد | يوصل');

  const load = useCallback(async () => {
    if (!token) {
      setView({ kind: 'invalid', message: 'رابط العقد غير مكتمل.' });
      return;
    }
    const outcome = await fetchContract(token);
    if (outcome.kind === 'ok') setView({ kind: 'ready', contract: outcome.contract });
    else if (outcome.kind === 'invalid') setView({ kind: 'invalid', message: outcome.message });
    else setView({ kind: 'error', message: outcome.message });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    setChanged(false);
    // The text may differ now: consent is given again, on what is on screen.
    setAgree(false);
    setFormError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!contract || submitting) return;
    setFormError('');
    const fullName = name.replace(/\s+/g, ' ').trim();
    if (fullName.length < 3) return setFormError('اكتب اسمك الكامل كما في الهوية.');
    const image = pad.current?.toDataUrl() || null;
    if (!image) return setFormError('ارسم توقيعك في المربع.');
    if (!agree) return setFormError('أكّد أنك قرأت العقد وتوافق على جميع بنوده.');
    setSubmitting(true);
    const outcome = await signContract(token, { name: fullName, signature: image, contentHash: contract.contentHash });
    setSubmitting(false);
    if (outcome.kind === 'ok') {
      setSignedImage(image);
      setJustSigned(true);
      setView({ kind: 'ready', contract: outcome.contract });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (outcome.kind === 'changed') {
      setChanged(true);
    } else if (outcome.kind === 'already_signed') {
      if (outcome.contract) setView({ kind: 'ready', contract: outcome.contract });
      else void load();
    } else if (outcome.kind === 'invalid') {
      setView({ kind: 'invalid', message: outcome.message });
    } else {
      setFormError(outcome.message);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-paper text-ink print:bg-white">
      <header className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-2" aria-label="يوصل">
            <UsilMark className="h-8 w-8" />
            <span className="text-base font-bold text-navy">يوصل</span>
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-ink-1">
            <Lock size={13} aria-hidden />
            رابط توقيع خاص
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
        {view.kind === 'loading' ? (
          <div className="grid place-items-center py-24 text-ink-3">
            <Loader2 className="animate-spin" size={28} aria-hidden />
            <p className="mt-3 text-sm">جارٍ فتح العقد…</p>
          </div>
        ) : view.kind === 'invalid' ? (
          <StateCard
            icon={<Link2Off size={28} aria-hidden />}
            title="الرابط غير صالح"
            body={`${view.message} إذا وصلك الرابط من المورّد فاطلب منه رابطاً جديداً.`}
          />
        ) : view.kind === 'error' ? (
          <StateCard
            icon={<AlertTriangle size={28} aria-hidden />}
            title="ما قدرنا نفتح العقد"
            body={view.message}
            action={
              <button type="button" onClick={() => void refresh()} className="btn-action">
                إعادة المحاولة
              </button>
            }
          />
        ) : contract ? (
          <>
            {contract.status === 'signed' ? (
              <section className="mb-5 rounded-2xl border border-success-border bg-success-bg p-4 print:hidden">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={22} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-bold text-ink">
                      {justSigned ? 'تم توقيع العقد بنجاح' : 'هذا العقد موقّع'}
                    </h1>
                    <p className="mt-1 text-sm text-ink-1">
                      وقّعه {contract.signature?.name || contract.client.name} في {stamp(contract.signedAt)}.
                      {justSigned ? ' وصل المورّد إشعار بالتوقيع.' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
                    >
                      <Download size={16} aria-hidden />
                      تحميل نسخة
                    </button>
                    <p className="mt-2 text-xs text-ink-3">تفتح نافذة الطباعة — اختر «حفظ كملف PDF» لحفظ نسختك.</p>
                  </div>
                </div>
              </section>
            ) : (
              <p className="mb-4 text-sm leading-7 text-ink-1 print:hidden">
                أرسل لك <strong className="text-ink">{contract.vendor.name}</strong> هذا العقد. اقرأه كاملاً، ثم وقّعه أسفل الصفحة.
              </p>
            )}

            <ContractDocument contract={contract} signedImage={signedImage} />

            {contract.status === 'sent' ? (
              <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5 rounded-2xl border border-line bg-surface p-4 shadow-sm print:hidden sm:p-5" noValidate>
                <div className="flex items-center gap-2">
                  <FileSignature size={20} className="text-action" aria-hidden />
                  <h2 className="text-lg font-bold text-ink">التوقيع</h2>
                </div>

                {changed ? (
                  <div role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-3 text-sm text-ink">
                    <p className="flex items-center gap-2 font-semibold">
                      <AlertTriangle size={16} aria-hidden />
                      العقد تغيّر — حدّث الصفحة
                    </p>
                    <p className="mt-1 text-ink-1">عدّل المورّد العقد بعد ما فتحته. حدّث لتقرأ النسخة الجديدة قبل التوقيع.</p>
                    <button
                      type="button"
                      onClick={() => void refresh()}
                      disabled={refreshing}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden />
                      تحديث العقد
                    </button>
                  </div>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-1">الاسم الكامل</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="كما في الهوية الوطنية أو الإقامة"
                    className="h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink placeholder:text-ink-3 focus:border-action focus:outline-none"
                  />
                </label>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink-1">التوقيع</span>
                  <SignaturePad ref={pad} onChange={setHasInk} disabled={submitting} />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(event) => setAgree(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-action)]"
                  />
                  <span className="text-sm font-medium leading-6 text-ink">قرأت العقد وأوافق على جميع بنوده</span>
                </label>

                {formError ? (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || changed || !agree || !hasInk || name.trim().length < 3}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-action text-base font-bold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <ShieldCheck size={18} aria-hidden />}
                  وقّع العقد
                </button>
                <p className="text-xs leading-6 text-ink-3">
                  توقيعك الإلكتروني ملزم مثل توقيعك على الورق. نحفظ مع التوقيع اسمك ووقت التوقيع وعنوان IP ونوع جهازك وبصمة نص
                  العقد، ليكون إثباتاً لك وللمورّد.
                </p>
              </form>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

function StateCard({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy-100 text-ink-1">{icon}</div>
      <h1 className="mt-4 text-lg font-bold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-ink-1">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
      <a href="/" className="mt-5 inline-block text-sm font-medium text-action hover:underline">
        الذهاب إلى يوصل
      </a>
    </div>
  );
}

function ContractDocument({ contract, signedImage }: { contract: PublicContract; signedImage: string | null }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white">
          {contract.vendor.logoUrl ? (
            <img src={contract.vendor.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xl font-bold text-navy">{contract.vendor.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ink">{contract.vendor.name}</p>
          {contract.vendor.crNumber ? <p className="text-xs text-ink-3">سجل تجاري {contract.vendor.crNumber}</p> : null}
        </div>
        <div className="text-left">
          <p className="text-[11px] text-ink-3">رقم العقد</p>
          <p dir="ltr" className="font-mono text-sm font-semibold text-ink">
            {contract.number}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-4 text-[15px] leading-8 sm:p-5">
        <h2 className="text-center text-xl font-bold text-navy">عقد تقديم خدمات</h2>

        <section className="grid gap-3 sm:grid-cols-2">
          <Party label="الطرف الأول (المورّد)" name={contract.vendorName} detail={contract.vendor.crNumber ? `سجل تجاري ${contract.vendor.crNumber}` : undefined} />
          <Party label="الطرف الثاني (العميل)" name={contract.client.name} detail={contract.client.phoneMasked ? `جوال ينتهي بـ ${contract.client.phoneMasked.slice(-3)}` : undefined} />
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold text-ink-3">المناسبة والخدمة</h3>
          <dl className="space-y-1">
            <Row label="الخدمة" value={contract.event.service} />
            <Row label="التاريخ" value={`${day(contract.event.date)}${contract.event.time ? ` — الساعة ${contract.event.time}` : ''}`} />
            {contract.event.location ? <Row label="الموقع" value={contract.event.location} /> : null}
          </dl>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {[
            ['الإجمالي', contract.amounts.total],
            ['العربون', contract.amounts.deposit],
            ['المتبقي', contract.amounts.remaining],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-line bg-surface-2 p-2.5 text-center">
              <p className="text-xs text-ink-3">{label}</p>
              <p className="mt-0.5 text-sm font-bold text-ink sm:text-base">{sar(value as number)}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink-3">البنود</h3>
          <ol className="space-y-2.5">
            {contract.terms.map((term, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy-100 text-xs font-bold text-navy">
                  {index + 1}
                </span>
                <span className="whitespace-pre-line">{term}</span>
              </li>
            ))}
          </ol>
        </section>

        {contract.notes ? (
          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink-3">ملاحظات</h3>
            <p className="whitespace-pre-line">{contract.notes}</p>
          </section>
        ) : null}

        <section className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs text-ink-3">صادر من المورّد</p>
            <p className="font-semibold text-ink">{contract.issuedBy?.name || contract.vendorName}</p>
            {contract.issuedBy ? <p className="text-xs text-ink-3">{stamp(contract.issuedBy.at)}</p> : null}
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs text-ink-3">توقيع العميل</p>
            {contract.status === 'signed' ? (
              <>
                {signedImage ? <img src={signedImage} alt="توقيعك" className="my-1 h-14 w-auto max-w-full object-contain" /> : null}
                <p className="font-semibold text-ink">{contract.signature?.name}</p>
                <p className="text-xs text-ink-3">وُقّع إلكترونياً — {stamp(contract.signedAt)}</p>
              </>
            ) : (
              <p className="text-ink-3">بانتظار توقيعك</p>
            )}
          </div>
        </section>

        <p className="flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-ink-3">
          <ShieldCheck size={13} aria-hidden />
          <span>
            بصمة العقد: <span dir="ltr" className="font-mono">{contract.contentHash.slice(0, 16)}</span> · عبر منصة يوصل
          </span>
        </p>
      </div>
    </article>
  );
}

function Party({ label, name, detail }: { label: string; name: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="font-semibold text-ink">{name}</p>
      {detail ? <p className="text-xs text-ink-3">{detail}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-ink-3">{label}:</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
