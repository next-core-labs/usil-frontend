import React, { useEffect, useMemo, useState } from 'react';
import { Headset, Mail, MessageCircle, RefreshCw, Search, Store } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Select, Tabs, Textarea } from '../ui';
import type { BadgeTone } from '../ui';
import {
  buildVendorContacts,
  fillVendorTemplate,
  supportReplyText,
  USIL_WHATSAPP_DISPLAY,
  VENDOR_TEMPLATES,
  whatsappChatUrl,
  type VendorContact,
  type VendorTemplateId,
} from '../../utils/ownerWhatsApp';

type SupportStatus = 'new' | 'replied' | 'closed';

type SupportMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: SupportStatus;
  createdAt: string;
};

const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = {
  new: 'جديدة',
  replied: 'تم الرد',
  closed: 'مغلقة',
};

const SUPPORT_STATUS_TONE: Record<SupportStatus, BadgeTone> = {
  new: 'warning',
  replied: 'info',
  closed: 'neutral',
};

const PHONE_SOURCE_LABEL: Record<VendorContact['phoneSource'], string> = {
  business_whatsapp: 'واتساب أعمال',
  account: 'جوال الحساب',
  application: 'جوال طلب الانضمام',
  none: 'بدون رقم',
};

const APPLICATION_LABEL: Record<NonNullable<VendorContact['applicationStatus']>, { label: string; tone: BadgeTone }> = {
  approved: { label: 'معتمد', tone: 'success' },
  pending: { label: 'طلب معلّق', tone: 'warning' },
  rejected: { label: 'مرفوض', tone: 'danger' },
};

type VendorFilter = 'all' | 'approved' | 'pending' | 'no_phone';

const waLinkClass =
  'inline-flex items-center justify-center gap-1.5 min-h-9 h-9 px-3 rounded-control bg-[#25D366] text-white text-xs font-semibold hover:brightness-95 transition';

/**
 * The owner's WhatsApp desk: message any vendor with a ready template, and
 * answer support messages from the site's contact form.
 */
export function OwnerWhatsAppPanel({
  users,
  applications,
  vendorSocials,
  onNewSupportCount,
}: {
  users: Parameters<typeof buildVendorContacts>[0]['users'];
  applications: Parameters<typeof buildVendorContacts>[0]['applications'];
  vendorSocials: Parameters<typeof buildVendorContacts>[0]['socials'];
  onNewSupportCount?: (count: number) => void;
}) {
  const [view, setView] = useState<'vendors' | 'support'>('vendors');

  // ── Vendors ──
  const contacts = useMemo(
    () => buildVendorContacts({ users, applications, socials: vendorSocials }),
    [users, applications, vendorSocials],
  );
  const [query, setQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<VendorFilter>('all');
  const [templateId, setTemplateId] = useState<VendorTemplateId>('greeting');
  const [templateBody, setTemplateBody] = useState(VENDOR_TEMPLATES[0].body);

  const pickTemplate = (id: VendorTemplateId) => {
    setTemplateId(id);
    setTemplateBody(VENDOR_TEMPLATES.find((item) => item.id === id)?.body || '');
  };

  const visibleContacts = contacts.filter((contact) => {
    if (vendorFilter === 'approved' && contact.applicationStatus !== 'approved' && !contact.userId) return false;
    if (vendorFilter === 'pending' && contact.applicationStatus !== 'pending') return false;
    if (vendorFilter === 'no_phone' && whatsappChatUrl(contact.phone)) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [contact.name, contact.projectName, contact.email, contact.phone]
      .some((value) => value.toLowerCase().includes(needle));
  });

  // ── Support ──
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportFilter, setSupportFilter] = useState<SupportStatus | 'all'>('new');

  const loadSupport = async () => {
    setSupportLoading(true);
    setSupportError(null);
    try {
      const res = await fetch('/api/admin/support-messages', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSupportError(data.error || 'تعذر تحميل رسائل الدعم.');
        return;
      }
      setMessages(data.data || []);
    } catch {
      setSupportError('تعذر الاتصال بالخادم.');
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    void loadSupport();
  }, []);

  const newSupportCount = messages.filter((row) => row.status === 'new').length;
  useEffect(() => {
    onNewSupportCount?.(newSupportCount);
  }, [newSupportCount, onNewSupportCount]);

  const setSupportStatus = async (id: string, status: SupportStatus) => {
    const res = await fetch(`/api/admin/support-messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      setSupportError(data.error || 'تعذر تحديث حالة الرسالة.');
      return;
    }
    setMessages((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  // Opening a WhatsApp reply is the owner answering, so a new message moves to "replied".
  const markRepliedIfNew = (row: SupportMessage) => {
    if (row.status === 'new') void setSupportStatus(row.id, 'replied');
  };

  const visibleMessages = messages.filter((row) => supportFilter === 'all' || row.status === supportFilter);

  return (
    <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" aria-hidden />
            واتساب يوصل
          </h2>
          <p className="text-xs text-ink-3 mt-1 leading-relaxed max-w-2xl">
            تواصل مع الموردين ورد على رسائل الدعم مباشرة. الرسالة تنفتح في واتساب جاهزة، وتقدر تعدّلها قبل الإرسال.
          </p>
          <p className="text-xs text-ink-2 mt-1.5">
            أرسل من رقم يوصل الرسمي{' '}
            <span className="font-mono font-bold" dir="ltr">
              {USIL_WHATSAPP_DISPLAY}
            </span>{' '}
            — هو الرقم اللي يشوفه الموردون والعملاء في صفحة الدعم.
          </p>
        </div>
      </div>

      <Tabs<'vendors' | 'support'>
        size="sm"
        ariaLabel="أقسام واتساب"
        active={view}
        onChange={setView}
        tabs={[
          { id: 'vendors', label: 'الموردين', icon: Store, count: contacts.length, countTone: 'neutral' },
          { id: 'support', label: 'الدعم', icon: Headset, count: newSupportCount, countTone: 'warning' },
        ]}
      />

      {view === 'vendors' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3 rounded-2xl border border-line bg-paper p-4 h-fit">
            <label className="block text-sm font-medium text-ink-2" htmlFor="owner-wa-template">
              قالب الرسالة
            </label>
            <Select
              id="owner-wa-template"
              value={templateId}
              onChange={(event) => pickTemplate(event.target.value as VendorTemplateId)}
            >
              {VENDOR_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </Select>
            <Textarea
              aria-label="نص الرسالة"
              rows={6}
              value={templateBody}
              onChange={(event) => setTemplateBody(event.target.value)}
              placeholder="اكتب رسالتك للمورد…"
            />
            <p className="text-2xs text-ink-3 leading-relaxed">
              استخدم <span dir="ltr">{'{name}'}</span> لاسم المورد و<span dir="ltr">{'{project}'}</span> لاسم المتجر — تتعبأ تلقائياً لكل مورد.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 right-3" aria-hidden />
                <Input
                  aria-label="بحث في الموردين"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث بالاسم أو المتجر أو الجوال"
                  className="pr-9"
                />
              </div>
              <Select
                aria-label="تصفية الموردين"
                value={vendorFilter}
                onChange={(event) => setVendorFilter(event.target.value as VendorFilter)}
                className="sm:w-44"
              >
                <option value="all">كل الموردين</option>
                <option value="approved">المعتمدون</option>
                <option value="pending">طلبات معلّقة</option>
                <option value="no_phone">بدون رقم واتساب</option>
              </Select>
            </div>

            {contacts.length === 0 ? (
              <EmptyState
                icon={Store}
                title="ما فيه موردين بعد"
                description="يظهر هنا كل مورد له حساب أو طلب انضمام، مع رقم واتساب جاهز للتواصل."
              />
            ) : visibleContacts.length === 0 ? (
              <p className="text-sm text-ink-3">ما فيه موردين يطابقون البحث.</p>
            ) : (
              <ul className="space-y-2">
                {visibleContacts.map((contact) => {
                  const url = whatsappChatUrl(contact.phone, fillVendorTemplate(templateBody, contact));
                  const app = contact.applicationStatus ? APPLICATION_LABEL[contact.applicationStatus] : null;
                  return (
                    <li
                      key={contact.key}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{contact.projectName || contact.name}</p>
                        <p className="text-xs text-ink-3 truncate">
                          {contact.projectName ? `${contact.name} · ` : ''}
                          <span dir="ltr">{contact.email}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {app ? (
                            <Badge size="sm" tone={app.tone}>
                              {app.label}
                            </Badge>
                          ) : null}
                          <Badge size="sm" tone={contact.phoneSource === 'business_whatsapp' ? 'success' : 'neutral'}>
                            {PHONE_SOURCE_LABEL[contact.phoneSource]}
                          </Badge>
                          {contact.phone ? (
                            <span className="text-2xs font-mono text-ink-2" dir="ltr">
                              {contact.phone}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className={waLinkClass}>
                          <MessageCircle className="w-4 h-4" aria-hidden />
                          واتساب
                        </a>
                      ) : contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="inline-flex items-center gap-1.5 min-h-9 h-9 px-3 rounded-control border border-line text-xs font-semibold text-ink hover:border-navy-300"
                        >
                          <Mail className="w-4 h-4" aria-hidden />
                          بريد
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['new', 'replied', 'closed', 'all'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSupportFilter(status)}
                aria-pressed={supportFilter === status}
                className={`px-3 h-9 rounded-control text-xs font-semibold border ${
                  supportFilter === status ? 'bg-navy text-white border-navy' : 'bg-surface text-ink-2 border-line'
                }`}
              >
                {status === 'all' ? 'الكل' : SUPPORT_STATUS_LABEL[status]}
                {status !== 'all' ? ` (${messages.filter((row) => row.status === status).length})` : ''}
              </button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              icon={RefreshCw}
              onClick={() => void loadSupport()}
              loading={supportLoading}
              className="ms-auto"
            >
              تحديث
            </Button>
          </div>

          {supportError ? <p className="text-sm text-danger">{supportError}</p> : null}

          {supportLoading && messages.length === 0 ? (
            <p className="text-sm text-ink-3">جارٍ التحميل…</p>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={Headset}
              title="ما فيه رسائل دعم بعد"
              description="تظهر هنا الرسائل اللي يرسلها العملاء والموردين من صفحة الدعم."
            />
          ) : visibleMessages.length === 0 ? (
            <p className="text-sm text-ink-3">ما فيه رسائل بهذه الحالة.</p>
          ) : (
            <ul className="space-y-3">
              {visibleMessages.map((row) => {
                const reply = supportReplyText(row.name, row.message);
                const waUrl = whatsappChatUrl(row.phone, reply);
                const mailUrl = row.email
                  ? `mailto:${row.email}?subject=${encodeURIComponent('رد دعم يوصل')}&body=${encodeURIComponent(reply)}`
                  : '';
                return (
                  <li key={row.id} className="rounded-2xl border border-line bg-paper p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-ink">{row.name}</p>
                        <p className="text-xs text-ink-3 mt-0.5" dir="ltr">
                          {[row.phone, row.email].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-ink-3">
                          {new Date(row.createdAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <Badge size="sm" tone={SUPPORT_STATUS_TONE[row.status]}>
                          {SUPPORT_STATUS_LABEL[row.status]}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{row.message}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markRepliedIfNew(row)}
                          className={waLinkClass}
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden />
                          رد عبر واتساب
                        </a>
                      ) : null}
                      {mailUrl ? (
                        <a
                          href={mailUrl}
                          onClick={() => markRepliedIfNew(row)}
                          className="inline-flex items-center gap-1.5 min-h-9 h-9 px-3 rounded-control border border-line bg-surface text-xs font-semibold text-ink hover:border-navy-300"
                        >
                          <Mail className="w-4 h-4" aria-hidden />
                          رد بالبريد
                        </a>
                      ) : null}
                      {row.status !== 'closed' ? (
                        <Button size="sm" variant="ghost" onClick={() => void setSupportStatus(row.id, 'closed')}>
                          إغلاق
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => void setSupportStatus(row.id, 'new')}>
                          إعادة فتح
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
