import React, { useMemo, useState } from 'react';
import { Headset, MessageCircle, Search, UserRound, Users } from 'lucide-react';
import type { CrewMember, VendorBooking } from '../../types';
import { Badge, EmptyState, Input, Select, Tabs, Textarea } from '../ui';
import type { BadgeTone } from '../ui';
import { USIL_WHATSAPP_DISPLAY, usilWhatsAppUrl, whatsappChatUrl } from '../../utils/ownerWhatsApp';
import {
  buildClientContacts,
  CLIENT_TEMPLATES,
  CREW_TEMPLATES,
  fillTemplate,
  SUPPORT_TEMPLATES,
  templateBody,
  type Template,
} from '../../utils/vendorWhatsApp';

type View = 'clients' | 'crew' | 'support';

const STATUS_LABEL: Record<VendorBooking['status'], { label: string; tone: BadgeTone }> = {
  confirmed: { label: 'مؤكد', tone: 'info' },
  in_progress: { label: 'قيد التنفيذ', tone: 'action' },
  completed: { label: 'مكتمل', tone: 'success' },
  cancelled: { label: 'ملغي', tone: 'danger' },
  pending_deposit: { label: 'بانتظار العربون', tone: 'warning' },
};

const CREW_STATUS_LABEL: Record<CrewMember['status'], string> = {
  available: 'متاح',
  on_mission: 'في مهمة',
  off_duty: 'خارج الدوام',
};

const waLinkClass =
  'inline-flex items-center justify-center gap-1.5 min-h-9 h-9 px-3 rounded-control bg-[#25D366] text-white text-xs font-semibold hover:brightness-95 transition';

function TemplateEditor({
  id,
  templates,
  templateId,
  body,
  onPick,
  onBodyChange,
  hint,
  children,
}: {
  id: string;
  templates: Template[];
  templateId: string;
  body: string;
  onPick: (id: string) => void;
  onBodyChange: (body: string) => void;
  hint: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-paper p-4 h-fit">
      <label className="block text-sm font-medium text-ink-2" htmlFor={id}>
        قالب الرسالة
      </label>
      <Select id={id} value={templateId} onChange={(event) => onPick(event.target.value)}>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.label}
          </option>
        ))}
      </Select>
      {children}
      <Textarea
        aria-label="نص الرسالة"
        rows={6}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        placeholder="اكتب رسالتك…"
      />
      <p className="text-2xs text-ink-3 leading-relaxed">{hint}</p>
    </div>
  );
}

const bookingLabel = (booking: VendorBooking) => `${booking.serviceTitle} · ${booking.date}`;

/**
 * WhatsApp for the vendor: message clients about their bookings, brief the
 * crew, and reach Usil support on the official number.
 */
export function VendorWhatsAppDesk({
  bookings,
  crewMembers,
  brandName,
}: {
  bookings: VendorBooking[];
  crewMembers: CrewMember[];
  brandName: string;
}) {
  const [view, setView] = useState<View>('clients');
  const today = new Date().toISOString().slice(0, 10);

  // ── Clients ──
  const clients = useMemo(() => buildClientContacts(bookings, today), [bookings, today]);
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [clientTemplate, setClientTemplate] = useState(CLIENT_TEMPLATES[0].id);
  const [clientBody, setClientBody] = useState(CLIENT_TEMPLATES[0].body);
  // Which booking each client's message is about, when they have more than one.
  const [bookingChoice, setBookingChoice] = useState<Record<string, string>>({});

  const visibleClients = clients.filter((client) => {
    const upcoming = client.focus.date >= today;
    if (clientFilter === 'upcoming' && !upcoming) return false;
    if (clientFilter === 'past' && upcoming) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [client.name, client.phone, ...client.bookings.map((row) => row.serviceTitle)]
      .some((value) => String(value || '').toLowerCase().includes(needle));
  });

  // ── Crew ──
  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((row) => row.date >= today && row.status !== 'cancelled')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings, today],
  );
  const [crewTemplate, setCrewTemplate] = useState(CREW_TEMPLATES[0].id);
  const [crewBody, setCrewBody] = useState(CREW_TEMPLATES[0].body);
  const [crewBookingId, setCrewBookingId] = useState('');
  const crewBooking = upcomingBookings.find((row) => row.id === crewBookingId) || upcomingBookings[0] || null;

  // ── Usil support ──
  const [supportTemplate, setSupportTemplate] = useState(SUPPORT_TEMPLATES[0].id);
  const [supportBody, setSupportBody] = useState(SUPPORT_TEMPLATES[0].body);
  const supportUrl = usilWhatsAppUrl(fillTemplate(supportBody, { brand: brandName }));

  return (
    <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#25D366]" aria-hidden />
          واتساب
        </h2>
        <p className="text-xs text-ink-3 mt-1 leading-relaxed max-w-2xl">
          راسل عملاءك وطاقمك بقوالب جاهزة فيها تفاصيل الحجز، أو تواصل مع دعم يوصل. الرسالة تنفتح في واتساب وتقدر تعدّلها قبل الإرسال.
        </p>
      </div>

      <Tabs<View>
        size="sm"
        ariaLabel="أقسام واتساب"
        active={view}
        onChange={setView}
        tabs={[
          { id: 'clients', label: 'العملاء', icon: UserRound, count: clients.length, countTone: 'neutral' },
          { id: 'crew', label: 'الطاقم', icon: Users, count: crewMembers.length, countTone: 'neutral' },
          { id: 'support', label: 'دعم يوصل', icon: Headset },
        ]}
      />

      {view === 'clients' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <TemplateEditor
              id="vendor-wa-client-template"
              templates={CLIENT_TEMPLATES}
              templateId={clientTemplate}
              body={clientBody}
              onPick={(id) => {
                setClientTemplate(id);
                setClientBody(templateBody(CLIENT_TEMPLATES, id));
              }}
              onBodyChange={setClientBody}
              hint={
                <>
                  تتعبأ تلقائياً من الحجز:{' '}
                  <span dir="ltr">{'{name} {service} {date} {time} {venue} {remaining} {bookingNumber} {brand}'}</span>
                </>
              }
            />
          </div>

          <div className="lg:col-span-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 right-3" aria-hidden />
                <Input
                  aria-label="بحث في العملاء"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث بالاسم أو الجوال أو الخدمة"
                  className="pr-9"
                />
              </div>
              <Select
                aria-label="تصفية العملاء"
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value as typeof clientFilter)}
                className="sm:w-44"
              >
                <option value="all">كل العملاء</option>
                <option value="upcoming">مناسبات قادمة</option>
                <option value="past">مناسبات سابقة</option>
              </Select>
            </div>

            {clients.length === 0 ? (
              <EmptyState
                icon={UserRound}
                title="ما فيه عملاء بعد"
                description="يظهر هنا كل عميل عنده حجز معك، مع تفاصيل حجزه جاهزة في الرسالة."
              />
            ) : visibleClients.length === 0 ? (
              <p className="text-sm text-ink-3">ما فيه عملاء يطابقون البحث.</p>
            ) : (
              <ul className="space-y-2">
                {visibleClients.map((client) => {
                  const booking =
                    client.bookings.find((row) => row.id === bookingChoice[client.key]) || client.focus;
                  const url = whatsappChatUrl(
                    client.phone,
                    fillTemplate(clientBody, { name: client.name, brand: brandName, booking }),
                  );
                  const status = STATUS_LABEL[booking.status];
                  return (
                    <li key={client.key} className="rounded-2xl border border-line bg-surface p-3 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate">{client.name}</p>
                          <p className="text-xs text-ink-3">
                            <span className="font-mono" dir="ltr">
                              {client.phone}
                            </span>
                            {' · '}
                            {client.bookings.length} حجز · {client.totalSpent.toLocaleString('ar-SA')} ر.س
                          </p>
                        </div>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className={waLinkClass}>
                            <MessageCircle className="w-4 h-4" aria-hidden />
                            واتساب
                          </a>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {client.bookings.length > 1 ? (
                          <Select
                            aria-label={`الحجز المقصود مع ${client.name}`}
                            value={booking.id}
                            onChange={(event) =>
                              setBookingChoice((prev) => ({ ...prev, [client.key]: event.target.value }))
                            }
                            className="min-h-9 py-1.5 text-xs sm:w-auto"
                          >
                            {client.bookings.map((row) => (
                              <option key={row.id} value={row.id}>
                                {bookingLabel(row)}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <span className="text-xs text-ink-2">{bookingLabel(booking)}</span>
                        )}
                        {status ? (
                          <Badge size="sm" tone={status.tone}>
                            {status.label}
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {view === 'crew' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <TemplateEditor
              id="vendor-wa-crew-template"
              templates={CREW_TEMPLATES}
              templateId={crewTemplate}
              body={crewBody}
              onPick={(id) => {
                setCrewTemplate(id);
                setCrewBody(templateBody(CREW_TEMPLATES, id));
              }}
              onBodyChange={setCrewBody}
              hint="تفاصيل المناسبة المختارة تتعبأ تلقائياً في الرسالة لكل فرد من الطاقم."
            >
              <Select
                aria-label="المناسبة"
                value={crewBooking?.id || ''}
                onChange={(event) => setCrewBookingId(event.target.value)}
                disabled={!upcomingBookings.length}
              >
                {upcomingBookings.length === 0 ? <option value="">لا توجد مناسبات قادمة</option> : null}
                {upcomingBookings.map((row) => (
                  <option key={row.id} value={row.id}>
                    {bookingLabel(row)} · {row.customerName}
                  </option>
                ))}
              </Select>
            </TemplateEditor>
          </div>

          <div className="lg:col-span-3">
            {crewMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="ما أضفت طاقم بعد"
                description="أضف أفراد الطاقم من قسم «طاقم العمل والسيارات» وتقدر تراسلهم من هنا."
              />
            ) : (
              <ul className="space-y-2">
                {crewMembers.map((member) => {
                  const url = whatsappChatUrl(
                    member.phone,
                    fillTemplate(crewBody, { name: member.name, brand: brandName, booking: crewBooking }),
                  );
                  return (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{member.name}</p>
                        <p className="text-xs text-ink-3">
                          {member.role} · {CREW_STATUS_LABEL[member.status] || member.status}
                          {member.phone ? (
                            <>
                              {' · '}
                              <span className="font-mono" dir="ltr">
                                {member.phone}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className={waLinkClass}>
                          <MessageCircle className="w-4 h-4" aria-hidden />
                          واتساب
                        </a>
                      ) : (
                        <span className="text-2xs text-ink-3">بدون رقم</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {view === 'support' ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <TemplateEditor
              id="vendor-wa-support-template"
              templates={SUPPORT_TEMPLATES}
              templateId={supportTemplate}
              body={supportBody}
              onPick={(id) => {
                setSupportTemplate(id);
                setSupportBody(templateBody(SUPPORT_TEMPLATES, id));
              }}
              onBodyChange={setSupportBody}
              hint="اشرح طلبك بوضوح، وأضف رقم الطلب أو اسم المنتج إن وجد."
            />
          </div>
          <div className="lg:col-span-3 rounded-2xl border border-line bg-surface p-5 space-y-4 h-fit">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
                <Headset className="w-6 h-6" aria-hidden />
              </span>
              <div>
                <p className="font-bold text-ink">دعم يوصل</p>
                <p className="text-sm font-mono font-bold text-ink-2" dir="ltr">
                  {USIL_WHATSAPP_DISPLAY}
                </p>
              </div>
            </div>
            <p className="text-sm text-ink-2 whitespace-pre-wrap leading-relaxed rounded-xl bg-paper border border-line p-3">
              {fillTemplate(supportBody, { brand: brandName }) || '…'}
            </p>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer" className={`${waLinkClass} w-full min-h-11 h-11 text-sm`}>
              <MessageCircle className="w-4 h-4" aria-hidden />
              إرسال لدعم يوصل عبر واتساب
            </a>
            <p className="text-2xs text-ink-3">
              ساعات الرد: الأحد–الخميس 9 صباحاً – 11 مساءً.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
