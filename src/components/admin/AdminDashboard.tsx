import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  CalendarCheck2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Store,
  Search,
  Bike,
  Share2,
  BadgeCheck,
  ClipboardList,
  Download,
  MapPin,
  CreditCard,
  Package,
  MessageCircle,
} from 'lucide-react';
import { CATEGORIES } from '../../data/services';
import { Tabs } from '../ui/Tabs';
import { StatCard } from '../ui/Card';
import { controlClass } from '../ui/Field';
import type { UserProfile } from '../../types';
import { BOOKING_PENDING_APPROVAL_STATUS, BOOKING_REJECTED_STATUS } from '../../contracts/vendors/vendor-listings';
import { SeoSettingsPanel } from './SeoSettingsPanel';
import { MoyasarSettingsPanel } from './MoyasarSettingsPanel';
import { OwnerWhatsAppPanel } from './OwnerWhatsAppPanel';
import { whatsappChatUrl } from '../../utils/ownerWhatsApp';
import { DEMAND_STATUS_AR, DEMAND_STATUSES, type DemandStatus } from '../../data/cityDemand';
import {
  COLLECTION_OPTIONS,
  EXTERNAL_STATUSES,
  ExternalBookingForm,
  type ExternalBookingRow,
} from '../courier/ExternalBookingForm';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'vendor' | 'admin' | 'accounts_manager' | 'courier';
  emailVerified?: boolean;
};

type VendorApplication = {
  id: string;
  firstName: string;
  fatherName: string;
  familyName: string;
  projectName: string;
  nationalId: string;
  email: string;
  phone: string;
  commercialRegister?: string;
  projectType: string;
  bankName: string;
  iban: string;
  accountHolderName: string;
  fulfillment?: Array<'hour' | 'same_day' | 'tomorrow' | 'instant'>;
  socials?: {
    confirmedOwn?: boolean;
    links?: Array<{ network: string; handle: string; url: string; status: string }>;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type AdminVendorSocials = {
  vendorId: string;
  name: string;
  email?: string;
  projectName?: string;
  source: string;
  socials: {
    confirmedOwn?: boolean;
    links: Array<{ network: string; handle: string; url: string; status: string }>;
  };
};

type CityDemandRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  occasion: string;
  eventDate: string;
  notes: string;
  status: DemandStatus;
  createdAt: string;
};

const FULFILLMENT_ADMIN_LABEL: Record<string, string> = {
  hour: 'يوصل ساعة',
  same_day: 'يوصل اليوم',
  tomorrow: 'يوصل بكرا',
  instant: 'حجز فوري',
};

const FULFILLMENT_IDS = ['hour', 'same_day', 'tomorrow', 'instant'] as const;

type AdminSection =
  | 'overview'
  | 'seo'
  | 'moyasar'
  | 'couriers'
  | 'external'
  | 'listings'
  | 'socials'
  | 'demand'
  | 'whatsapp';

type CourierApplication = {
  id: string;
  firstName: string;
  familyName: string;
  nationalId: string;
  plateLetters: string;
  plateNumbers: string;
  carType: string;
  carTypeOther?: string;
  fulfillment?: string[];
  products?: Array<{ name: string; fulfillment: string[] }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
};

type AdminListing = {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  categoryName: string;
  price: number;
  fulfillment: string[];
};

type AdminBooking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceName: string;
  notes?: string;
  status: string;
  createdAt: string;
};

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  client: 'عميل',
  vendor: 'مورّد',
  admin: 'مدير كل الحسابات',
  accounts_manager: 'مدير الحسابات',
  courier: 'مندوب توصيل',
};

const STATUS_OPTIONS = [
  'جديد',
  BOOKING_PENDING_APPROVAL_STATUS,
  'مؤكد',
  BOOKING_REJECTED_STATUS,
  'قيد التنفيذ',
  'مكتمل',
  'ملغي',
];

const COLLECTION_LABEL: Record<string, string> = Object.fromEntries(
  COLLECTION_OPTIONS.map((option) => [option.id, option.label]),
);

const EXTERNAL_CSV_HEADERS = [
  'التاريخ',
  'المندوب',
  'العميل',
  'الجوال',
  'المدينة',
  'الخدمة',
  'تاريخ المناسبة',
  'المبلغ',
  'شامل الضريبة',
  'طريقة التحصيل',
  'المورّد',
  'الحالة',
];

function csvCell(value: unknown): string {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

export function externalBookingsCsv(rows: ExternalBookingRow[]): string {
  const lines = [EXTERNAL_CSV_HEADERS.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.createdAt?.slice(0, 10) || '',
        row.courierName,
        row.customerName,
        row.phone,
        row.city,
        row.serviceType,
        row.eventDate,
        row.amount,
        row.taxIncluded ? 'نعم' : 'لا',
        COLLECTION_LABEL[row.collection] || row.collection,
        row.vendorName,
        row.status,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function AdminDashboard({
  currentUser,
  onOpenVendorHub,
}: {
  currentUser: UserProfile | null;
  onOpenVendorHub?: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [couriers, setCouriers] = useState<CourierApplication[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');
  const [cityRequests, setCityRequests] = useState<CityDemandRow[]>([]);
  const [vendorSocials, setVendorSocials] = useState<AdminVendorSocials[]>([]);
  const [externalBookings, setExternalBookings] = useState<ExternalBookingRow[]>([]);
  const [newSupportCount, setNewSupportCount] = useState(0);
  const [externalCourierFilter, setExternalCourierFilter] = useState('all');
  const [externalStatusFilter, setExternalStatusFilter] = useState('all');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client' as AdminUser['role'],
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, bookingsRes, appsRes, couriersRes, listingsRes, socialsRes, externalRes, demandRes, supportRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/bookings', { credentials: 'include' }),
        fetch('/api/admin/vendor-applications', { credentials: 'include' }),
        fetch('/api/admin/couriers', { credentials: 'include' }),
        fetch('/api/admin/listings', { credentials: 'include' }),
        fetch('/api/admin/vendor-socials', { credentials: 'include' }),
        fetch('/api/external-bookings', { credentials: 'include' }),
        fetch('/api/admin/city-requests', { credentials: 'include' }),
        fetch('/api/admin/support-messages', { credentials: 'include' }),
      ]);
      const usersData = await usersRes.json();
      const bookingsData = await bookingsRes.json();
      const appsData = await appsRes.json();
      const couriersData = await couriersRes.json();
      const listingsData = await listingsRes.json();
      const socialsData = await socialsRes.json();
      const externalData = await externalRes.json();
      const demandData = demandRes.ok ? await demandRes.json() : { data: [] };
      const supportData = supportRes.ok ? await supportRes.json() : { data: [] };
      if (!usersRes.ok || !usersData.success) {
        setError(usersData.error || 'تعذر تحميل حسابات المنصة.');
        return;
      }
      if (!bookingsRes.ok || !bookingsData.success) {
        setError(bookingsData.error || 'تعذر تحميل الحجوزات.');
        return;
      }
      setUsers(usersData.data || []);
      setBookings(bookingsData.data || []);
      setApplications(appsData.data || []);
      setCouriers(couriersData.data || []);
      setListings(listingsData.data || []);
      setVendorSocials(socialsData.data || []);
      setExternalBookings(externalData.data || []);
      setCityRequests(demandData.data || []);
      setNewSupportCount(
        ((supportData.data || []) as Array<{ status?: string }>).filter((row) => (row.status || 'new') === 'new').length,
      );
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'تعذر إنشاء الحساب.');
        return;
      }
      setForm({ name: '', email: '', phone: '', password: '', role: 'client' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const markEmailVerified = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emailVerified: true }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تأكيد البريد.');
      return;
    }
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, emailVerified: true } : item)));
  };

  const changeRole = async (id: string, role: AdminUser['role']) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تغيير صلاحية الحساب.');
      return;
    }
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, role } : item)));
  };

  const removeUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر حذف الحساب.');
      return;
    }
    setUsers((prev) => prev.filter((item) => item.id !== id));
  };

  const setDemandStatus = async (id: string, status: DemandStatus) => {
    const res = await fetch(`/api/admin/city-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تحديث طلب المدينة.');
      return;
    }
    setCityRequests((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  const toggleSocialVerify = async (vendorId: string, network: string, verified: boolean) => {
    const action = verified ? 'verify' : 'unverify';
    const res = await fetch(`/api/admin/vendor-socials/${vendorId}/${network}/${action}`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تحديث التوثيق');
      return;
    }
    await load();
  };

  const decideApplication = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/admin/vendor-applications/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: action === 'reject' ? 'رفض إداري' : undefined }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر مراجعة طلب المورّد.');
      return;
    }
    await load();
  };

  const decideCourier = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/admin/couriers/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: action === 'reject' ? 'رفض إداري' : undefined }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر مراجعة طلب المندوب.');
      return;
    }
    await load();
  };

  const toggleListingLane = async (listing: AdminListing, lane: string) => {
    const lanes = listing.fulfillment || [];
    const next = lanes.includes(lane)
      ? lanes.filter((item) => item !== lane)
      : [...lanes, lane];
    if (!next.length) {
      setError('المنتج يحتاج مساراً واحداً على الأقل');
      return;
    }
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fulfillment: next }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تعديل مسار المنتج');
      return;
    }
    setListings((prev) => prev.map((item) => (item.id === listing.id ? { ...item, fulfillment: next } : item)));
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setBookings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    }
  };

  const loadExternalBookings = async () => {
    const res = await fetch('/api/external-bookings', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || 'تعذر تحميل الحجوزات الخارجية.');
      return;
    }
    setExternalBookings(data.data || []);
  };

  const updateExternalStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/external-bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر تعديل حالة الحجز الخارجي.');
      return;
    }
    setExternalBookings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const removeExternalBooking = async (id: string) => {
    const res = await fetch(`/api/external-bookings/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || 'تعذر حذف الحجز الخارجي.');
      return;
    }
    setExternalBookings((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredExternal = externalBookings.filter(
    (row) =>
      (externalCourierFilter === 'all' || row.courierId === externalCourierFilter) &&
      (externalStatusFilter === 'all' || row.status === externalStatusFilter),
  );

  const externalCourierChoices = Array.from(
    new Map(externalBookings.map((row) => [row.courierId, row.courierName])).entries(),
  );

  const exportExternalCsv = () => {
    const blob = new Blob([`\uFEFF${externalBookingsCsv(filteredExternal)}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usil-external-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeBooking = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) setBookings((prev) => prev.filter((item) => item.id !== id));
  };

  // Was a tenth local copy of the input string; now the shared treatment.
  const inputClass = controlClass;

  return (
    <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 space-y-6" dir="rtl">
      <section className="bg-surface border border-line rounded-panel p-5 sm:p-6 shadow-e1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-sand text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
              مدير كل الحسابات في يوصل
            </span>
            <h1 className="text-2xl font-bold text-navy mt-3">
              مرحباً {currentUser?.name || 'إدارة يوصل'}
            </h1>
            <p className="text-sm text-ink-3 mt-2 max-w-2xl leading-relaxed">
              من هنا تُدار حسابات العملاء والموردين والإداريين: إنشاء، تغيير الصلاحية، أو الحذف. الدخول يحدد الواجهة تلقائياً حسب نوع الحساب.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenVendorHub ? (
              <button
                type="button"
                onClick={onOpenVendorHub}
                className="inline-flex items-center gap-2 min-h-11 px-4 rounded-control bg-navy text-white text-sm font-semibold hover:bg-navy-700 transition-colors"
              >
                <Store className="w-4 h-4 text-sand" aria-hidden />
                لوحة المورد
              </button>
            ) : null}
            <button
              onClick={load}
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-control bg-surface border border-line text-sm font-semibold text-ink hover:border-navy-300 transition-colors"
              aria-busy={loading || undefined}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              تحديث
            </button>
          </div>
        </div>

        {/* One scrollable tab strip with real tablist semantics, replacing ten
            hand-rolled pills that wrapped into a ragged block on laptops. */}
        <Tabs<AdminSection>
          className="mt-6"
          ariaLabel="أقسام لوحة الإدارة"
          active={adminSection}
          onChange={setAdminSection}
          tabs={[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'seo', label: 'تحسين الظهور / SEO', icon: Search },
            { id: 'moyasar', label: 'ميسر', icon: CreditCard },
            {
              id: 'couriers',
              label: 'مناديب التوصيل',
              icon: Bike,
              count: couriers.filter((item) => item.status === 'pending').length,
              countTone: 'warning' as const,
            },
            { id: 'external', label: 'حجوزات خارجية', icon: ClipboardList },
            { id: 'listings', label: 'منتجات الموردين', icon: Package },
            { id: 'socials', label: 'حسابات التواصل', icon: Share2 },
            {
              id: 'demand',
              label: 'طلبات المدن',
              icon: MapPin,
              count: cityRequests.filter((row) => row.status === 'new').length,
              countTone: 'action' as const,
            },
            {
              id: 'whatsapp',
              label: 'واتساب',
              icon: MessageCircle,
              count: newSupportCount,
              countTone: 'warning' as const,
            },
          ]}
        />

        {/* KPIs ordered by what needs action first: pending approvals lead,
            totals follow. Anything awaiting a decision is toned, not neutral. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {[
            {
              label: 'طلبات موردين معلّقة',
              value: applications.filter((item) => item.status === 'pending').length,
              icon: Store,
              tone: applications.some((item) => item.status === 'pending') ? 'warning' : 'default',
              onClick: () => setAdminSection('overview'),
            },
            {
              label: 'مناديب بانتظار المراجعة',
              value: couriers.filter((item) => item.status === 'pending').length,
              icon: Bike,
              tone: couriers.some((item) => item.status === 'pending') ? 'warning' : 'default',
              onClick: () => setAdminSection('couriers'),
            },
            {
              label: 'طلبات مدن جديدة',
              value: cityRequests.filter((row) => row.status === 'new').length,
              icon: MapPin,
              tone: cityRequests.some((row) => row.status === 'new') ? 'warning' : 'default',
              onClick: () => setAdminSection('demand'),
            },
            { label: 'كل الحسابات', value: users.length, icon: Users, tone: 'default' },
            { label: 'الحجوزات', value: bookings.length, icon: CalendarCheck2, tone: 'default' },
            {
              label: 'حجوزات خارجية',
              value: externalBookings.length,
              icon: ClipboardList,
              tone: 'default',
              onClick: () => setAdminSection('external'),
            },
            {
              label: 'خدمات الكتالوج',
              value: listings.length,
              icon: CheckCircle2,
              tone: 'default',
              onClick: () => setAdminSection('listings'),
            },
          ].map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone as 'default' | 'warning'}
              onClick={stat.onClick}
            />
          ))}
        </div>
      </section>

      {adminSection === 'seo' ? <SeoSettingsPanel /> : null}
      {adminSection === 'moyasar' ? <MoyasarSettingsPanel /> : null}

      {adminSection !== 'seo' && adminSection !== 'moyasar' && error ? (
        <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          {error}
        </div>
      ) : null}

      {adminSection === 'couriers' ? (
        <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
          <h2 className="text-lg font-bold">مناديب التوصيل</h2>
          {couriers.length === 0 ? (
            <p className="text-sm text-slate-500">ما فيه طلبات مناديب حالياً. تظهر هنا بعد سجّل معنا كمندوب توصيل.</p>
          ) : (
            <div className="space-y-3">
              {couriers.map((row) => (
                <article key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {row.firstName} {row.familyName}
                      </p>
                      <p className="text-xs text-slate-500">
                        لوحة {row.plateLetters} {row.plateNumbers} · {row.carType}
                        {row.carTypeOther ? ` · ${row.carTypeOther}` : ''}
                      </p>
                      {row.fulfillment?.length ? (
                        <p className="text-2xs text-action font-medium mt-0.5">
                          أقدر أوصل: {row.fulfillment.map((lane) => FULFILLMENT_ADMIN_LABEL[lane] || lane).join(' · ')}
                        </p>
                      ) : null}
                      {row.products?.length ? (
                        <p className="text-2xs text-slate-600 mt-0.5">
                          المنتجات اللي أوصّلها:{' '}
                          {row.products
                            .map((product) =>
                              product.name
                                ? `${product.name} (${(product.fulfillment || []).map((lane) => FULFILLMENT_ADMIN_LABEL[lane] || lane).join('، ')})`
                                : (product.fulfillment || []).map((lane) => FULFILLMENT_ADMIN_LABEL[lane] || lane).join('، '),
                            )
                            .join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`text-2xs font-bold px-2.5 py-1 rounded-full ${
                        row.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : row.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {row.status === 'pending' ? 'بانتظار موافقة يوصل' : row.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600" dir="ltr">
                    هوية {row.nationalId}
                  </p>
                  <p className="text-2xs text-slate-400">{new Date(row.createdAt).toLocaleString('ar-SA')}</p>
                  {row.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => decideCourier(row.id, 'approve')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                      >
                        موافقة
                      </button>
                      <button
                        type="button"
                        onClick={() => decideCourier(row.id, 'reject')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium"
                      >
                        رفض
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {adminSection === 'external' ? (
        <>
          <ExternalBookingForm onSaved={loadExternalBookings} />

          <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">الحجوزات الخارجية</h2>
                <p className="text-xs text-slate-500 mt-1">
                  حجوزات جاءت للمناديب خارج المنصة — تُسجّل هنا للمتابعة والتحصيل.
                </p>
              </div>
              <button
                type="button"
                onClick={exportExternalCsv}
                disabled={filteredExternal.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير CSV
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={externalCourierFilter}
                onChange={(e) => setExternalCourierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="all">كل المناديب</option>
                {externalCourierChoices.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={externalStatusFilter}
                onChange={(e) => setExternalStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <option value="all">كل الحالات</option>
                {EXTERNAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">جارٍ التحميل…</p>
            ) : externalBookings.length === 0 ? (
              <p className="text-sm text-slate-500">
                ما فيه حجوزات خارجية بعد. سجّل أول حجز من الخانة فوق أو من صفحة المندوب.
              </p>
            ) : filteredExternal.length === 0 ? (
              <p className="text-sm text-slate-500">ما فيه حجوزات تطابق الفلتر المختار.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-sm text-right min-w-[860px]">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100">
                      <th className="py-2 font-bold">التاريخ</th>
                      <th className="py-2 font-bold">المندوب</th>
                      <th className="py-2 font-bold">العميل</th>
                      <th className="py-2 font-bold">الجوال</th>
                      <th className="py-2 font-bold">المدينة</th>
                      <th className="py-2 font-bold">الخدمة</th>
                      <th className="py-2 font-bold">المبلغ</th>
                      <th className="py-2 font-bold">الحالة</th>
                      <th className="py-2 font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExternal.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50 align-top">
                        <td className="py-3 text-xs text-slate-600 whitespace-nowrap">
                          {row.createdAt?.slice(0, 10)}
                          {row.eventDate ? (
                            <div className="text-2xs text-slate-400">مناسبة {row.eventDate}</div>
                          ) : null}
                        </td>
                        <td className="py-3 font-bold whitespace-nowrap">{row.courierName}</td>
                        <td className="py-3">
                          <div className="font-bold">{row.customerName}</div>
                          {row.vendorName ? (
                            <div className="text-2xs text-slate-400">مورّد: {row.vendorName}</div>
                          ) : null}
                        </td>
                        <td className="py-3 font-mono text-xs whitespace-nowrap" dir="ltr">
                          {row.phone}
                        </td>
                        <td className="py-3 whitespace-nowrap">{row.city}</td>
                        <td className="py-3">
                          {row.serviceType}
                          {row.guests ? <div className="text-2xs text-slate-400">{row.guests} ضيف</div> : null}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {row.amount} ر.س
                          <div className="text-2xs text-slate-400">
                            {row.taxIncluded ? 'شامل الضريبة' : 'غير شامل الضريبة'} ·{' '}
                            {COLLECTION_LABEL[row.collection] || row.collection}
                          </div>
                        </td>
                        <td className="py-3">
                          <select
                            value={row.status}
                            onChange={(e) => updateExternalStatus(row.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            {EXTERNAL_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => removeExternalBooking(row.id)}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 inline-flex items-center justify-center hover:bg-rose-100"
                            title="حذف الحجز الخارجي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {adminSection === 'socials' ? (
        <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
          <div>
            <h2 className="text-lg font-bold">حسابات التواصل للموردين</h2>
            <p className="text-xs text-slate-500 mt-1">
              التوثيق هنا مراجعة يوصل للرابط — ليست علامة ميتا أو تيك توك الرسمية. العميل يرى شارة «موثّق» فقط بعد هذا الزر.
            </p>
          </div>
          {vendorSocials.length === 0 ? (
            <p className="text-sm text-slate-500">المورد ما ربط حسابات بعد</p>
          ) : (
            <div className="space-y-3">
              {vendorSocials.map((row) => (
                <article key={row.vendorId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div>
                    <p className="font-bold text-slate-900">{row.projectName || row.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {row.email || row.vendorId}
                    </p>
                  </div>
                  {row.socials?.links?.length === 0 || !row.socials?.links ? (
                    <p className="text-xs text-slate-500">المورد ما ربط حسابات بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {row.socials.links.map((link) => (
                        <div key={link.network} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800">{link.network}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-2xs text-action break-all" dir="ltr">
                              {link.url}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            {link.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-2xs font-medium text-emerald-700">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                موثّق
                              </span>
                            ) : (
                              <span className="text-2xs font-medium text-slate-500">
                                {link.status === 'linked' ? 'مربوط' : 'بانتظار التوثيق'}
                              </span>
                            )}
                            {link.status === 'verified' ? (
                              <button
                                type="button"
                                onClick={() => toggleSocialVerify(row.vendorId, link.network, false)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-2xs font-medium"
                              >
                                إلغاء توثيق
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleSocialVerify(row.vendorId, link.network, true)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-2xs font-medium"
                              >
                                توثيق
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {adminSection === 'whatsapp' ? (
        <OwnerWhatsAppPanel
          users={users}
          applications={applications}
          vendorSocials={vendorSocials}
          onNewSupportCount={setNewSupportCount}
        />
      ) : null}

      {adminSection === 'demand' ? (
        <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
          <div>
            <h2 className="text-lg font-bold">طلبات المدن</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              طلبات عملاء ما لقوا منتجاً في مدينتهم. تواصل ثم حدّث الحالة بعد المطابقة.
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">جارٍ التحميل…</p>
          ) : cityRequests.length === 0 ? (
            <p className="text-sm text-slate-500">ما فيه طلبات بعد. تظهر هنا بعد ما يرسل عميل نموذج «طلب في مدينتك».</p>
          ) : (
            <div className="space-y-3">
              {cityRequests.map((row) => {
                const wa = whatsappChatUrl(row.phone);
                return (
                  <article key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {row.city} · {row.occasion}
                          {row.eventDate ? ` · ${row.eventDate}` : ''}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-2xs font-medium">
                        {DEMAND_STATUS_AR[row.status]}
                      </span>
                    </div>
                    <p className="text-sm font-mono font-bold" dir="ltr">
                      {row.phone}
                    </p>
                    {row.notes ? <p className="text-xs text-slate-600 leading-relaxed">{row.notes}</p> : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 h-9 rounded-xl bg-action text-white text-2xs font-medium inline-flex items-center"
                        >
                          واتساب
                        </a>
                      ) : null}
                      {DEMAND_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => void setDemandStatus(row.id, status)}
                          className={`px-3 h-9 rounded-xl text-2xs font-bold border ${
                            row.status === status
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {DEMAND_STATUS_AR[status]}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {adminSection === 'listings' ? (
        <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
          <h2 className="text-lg font-bold">منتجات الموردين ومسار يوصل</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-slate-500">ما فيه منتجات مورّدين مسجّلة بعد. تظهر هنا بعد تسجيل المنتج من لوحة المورد.</p>
          ) : (
            <div className="space-y-3">
              {listings.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.vendorName} · {item.categoryName} · {item.price} ر.س
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FULFILLMENT_IDS.map((lane) => {
                      const active = (item.fulfillment || []).includes(lane);
                      return (
                        <button
                          key={lane}
                          type="button"
                          onClick={() => toggleListingLane(item, lane)}
                          className={`px-3 h-8 rounded-full text-2xs font-bold border ${
                            active
                              ? 'bg-action border-action text-white'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {FULFILLMENT_ADMIN_LABEL[lane]}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {adminSection === 'overview' ? (
      <>
      <section className="bg-surface border border-line rounded-panel p-5 shadow-e1 space-y-4">
        <h2 className="text-lg font-bold">طلبات تسجيل الموردين</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-slate-500">ما فيه طلبات مورّدين حالياً.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <article key={app.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">
                      {app.firstName} {app.fatherName} {app.familyName}
                    </p>
                    <p className="text-xs text-slate-500">{app.projectName} · {app.projectType}</p>
                    {app.fulfillment?.length ? (
                      <p className="text-2xs text-action font-medium mt-0.5">
                        أقدر أخدم في: {app.fulfillment.map((lane) => FULFILLMENT_ADMIN_LABEL[lane] || lane).join(' · ')}
                      </p>
                    ) : null}
                    {app.socials?.links?.length ? (
                      <p className="text-2xs text-slate-600 mt-0.5">
                        سوشل:{' '}
                        {app.socials.links
                          .map((link) => `${link.network}${link.status === 'verified' ? ' (موثّق)' : ''}`)
                          .join(' · ')}
                      </p>
                    ) : (
                      <p className="text-2xs text-slate-400 mt-0.5">المورد ما ربط حسابات بعد</p>
                    )}
                  </div>
                  <span className={`text-2xs font-bold px-2.5 py-1 rounded-full ${
                    app.status === 'pending' ? 'bg-amber-50 text-amber-700' : app.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {app.status === 'pending' ? 'بانتظار موافقة يوصل' : app.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                  </span>
                </div>
                <p className="text-xs text-slate-600" dir="ltr">
                  {app.email} · {app.phone} · هوية {app.nationalId}
                </p>
                <p className="text-xs text-slate-600">
                  {app.bankName} · {app.iban} · {app.accountHolderName}
                </p>
                {app.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => decideApplication(app.id, 'approve')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium"
                    >
                      موافقة وفتح الدخول
                    </button>
                    <button
                      type="button"
                      onClick={() => decideApplication(app.id, 'reject')}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium"
                    >
                      رفض
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-5 gap-6">
        <form onSubmit={createAccount} className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-4 h-4 text-action" />
            إنشاء حساب جديد
          </h2>
          <input className={inputClass} placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputClass} placeholder="رقم الجوال" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required dir="ltr" />
          <input className={inputClass} type="password" placeholder="الرقم السري" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser['role'] })}>
            <option value="client">عميل</option>
            <option value="vendor">مورّد</option>
            <option value="courier">مندوب توصيل</option>
            <option value="accounts_manager">مدير الحسابات</option>
            <option value="admin">مدير كل الحسابات</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-action hover:bg-[#1249c7] text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
          >
            {saving ? 'جارٍ الإنشاء…' : 'حفظ الحساب'}
          </button>
        </form>

        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-4">كل حسابات يوصل</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-bold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5" dir="ltr">
                    {user.email} · {user.phone}
                  </div>
                  <div className="text-2xs font-medium mt-1">
                    {user.emailVerified === false ? (
                      <span className="text-amber-800">البريد غير مؤكد</span>
                    ) : (
                      <span className="text-emerald-700">البريد مؤكد</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.emailVerified === false ? (
                    <button
                      type="button"
                      onClick={() => markEmailVerified(user.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-2xs font-medium border border-emerald-200"
                    >
                      تأكيد البريد
                    </button>
                  ) : null}
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value as AdminUser['role'])}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                  >
                    <option value="client">عميل</option>
                    <option value="vendor">مورّد</option>
                    <option value="courier">مندوب توصيل</option>
                    <option value="accounts_manager">مدير الحسابات</option>
                    <option value="admin">مدير كل الحسابات</option>
                  </select>
                  {user.id !== currentUser?.id ? (
                    <button
                      onClick={() => removeUser(user.id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 inline-flex items-center justify-center hover:bg-rose-100"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-2xs font-medium text-action">حسابك</span>
                  )}
                </div>
              </div>
            ))}
            {!loading && users.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد حسابات بعد.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-line rounded-panel p-5 shadow-e1">
          <h2 className="text-lg font-bold mb-4">أقسام الكتالوج المعتمدة</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="font-bold text-slate-900 text-sm">{cat.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {listings.filter((item) => item.categoryName === cat.name).length} خدمات
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-line rounded-panel p-5 shadow-e1 overflow-x-auto">
          <h2 className="text-lg font-bold mb-4">حجوزات المنصة</h2>
          {bookings.length === 0 && !loading ? (
            <p className="text-sm text-slate-500">لا توجد حجوزات مسجّلة بعد.</p>
          ) : (
            <table className="w-full text-sm text-right min-w-[640px]">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-bold">رقم</th>
                  <th className="py-2 font-bold">العميل</th>
                  <th className="py-2 font-bold">الخدمة</th>
                  <th className="py-2 font-bold">الحالة</th>
                  <th className="py-2 font-bold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-50">
                    <td className="py-3 font-mono text-xs">{booking.id}</td>
                    <td className="py-3">
                      <div className="font-bold">{booking.name}</div>
                      <div className="text-xs text-slate-500">{booking.phone}</div>
                    </td>
                    <td className="py-3">{booking.serviceName}</td>
                    <td className="py-3">
                      <select
                        value={booking.status}
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium"
                      >
                        {[booking.status, ...STATUS_OPTIONS.filter((s) => s !== booking.status)].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => removeBooking(booking.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 inline-flex items-center justify-center hover:bg-rose-100"
                        title="حذف الحجز"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      </>
      ) : null}
    </main>
  );
}
