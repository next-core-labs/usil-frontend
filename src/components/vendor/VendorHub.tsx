import React, { useState } from 'react';
import {
  VendorBooking,
  BlockedDate,
  WhatsAppThread,
  WhatsAppMessage,
  CrewMember,
  VendorInvoice,
  FinancialPayout,
  POSItem,
  POSSaleRecord,
  VendorBrandSettings,
  ClientOrderTracking,
  ExpenseRecord,
  ReceivableDebt,
  CrewPayrollEntry,
  ConsolidatedCrewPaymentVoucher,
  CrewWorkHourLog,
  InventoryItem,
  SmartServiceContract,
} from '../../types';
import { VendorCalendarView } from './VendorCalendarView';
import { VendorExternalBookingModal } from './VendorExternalBookingModal';
import { VendorWhatsAppInbox } from './VendorWhatsAppInbox';
import { VendorInvoiceGenerator } from './VendorInvoiceGenerator';
import { VendorCrewDispatch } from './VendorCrewDispatch';
import { VendorFinancialSuite } from './VendorFinancialSuite';
import { VendorStorefrontBioLink } from './VendorStorefrontBioLink';
import { VendorPOSCashier } from './VendorPOSCashier';
import { VendorBrandSettingsModal } from './VendorBrandSettingsModal';
import { VendorDatabaseBackupModal } from './VendorDatabaseBackupModal';
import { VendorOrderTrackerManager } from './VendorOrderTrackerManager';
import { VendorPendingReviewsManager } from './VendorPendingReviewsManager';
import { TrustAndGrowthHub } from './TrustAndGrowthHub';
import { VendorWidgetGrid } from './VendorWidgetGrid';
import { VendorInventoryTracker } from './VendorInventoryTracker';
import { VendorListingsPanel } from './VendorListingsPanel';
import { VendorSocialsPanel } from './VendorSocialsPanel';
import { VendorOwnFileCard } from './VendorOwnFileCard';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import type { VendorListing } from '../../contracts/vendors/vendor-listings';
import type { VendorOwnProfile } from '../../contracts/vendors/vendor-profile';
import { calculateInventoryForecasts } from '../../utils/inventoryForecast';
import {
  Calendar as CalendarIcon,
  MessageCircle,
  FileText,
  Users,
  Wallet,
  Link2,
  Plus,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Store,
  CheckCircle2,
  Calculator,
  Building2,
  Clock,
  Zap,
  Scale,
  Star,
  Award,
  Database,
  Download,
  Package,
  Boxes,
  Camera,
  Menu,
  X,
  Cloud,
  CloudOff,
  LogOut,
  Share2,
} from 'lucide-react';
import { UsilMark } from '../UsilMark';

interface VendorHubProps {
  bookings: VendorBooking[];
  blockedDates: BlockedDate[];
  threads: WhatsAppThread[];
  crewMembers: CrewMember[];
  invoices: VendorInvoice[];
  payouts: FinancialPayout[];
  posItems: POSItem[];
  salesRecords: POSSaleRecord[];
  brandSettings: VendorBrandSettings;
  trackings: ClientOrderTracking[];
  expenses: ExpenseRecord[];
  receivables: ReceivableDebt[];
  payrollEntries: CrewPayrollEntry[];
  consolidatedVouchers?: ConsolidatedCrewPaymentVoucher[];
  inventoryItems?: InventoryItem[];
  onAddBooking: (booking: Omit<VendorBooking, 'id' | 'bookingNumber' | 'createdAt'>) => void;
  onAddBlockedDate: (date: string, reason: string, type: BlockedDate['type']) => void;
  onRemoveBlockedDate: (id: string) => void;
  onSendMessage: (threadId: string, text: string, attachmentType?: WhatsAppMessage['attachmentType'], attachmentData?: any) => void;
  onAddInvoice: (invoice: VendorInvoice) => void;
  onAddCrewMember: (crew: CrewMember) => void;
  onUpdateCrewStatus: (crewId: string, newStatus: CrewMember['status']) => void;
  onAddWorkLog?: (crewId: string, log: CrewWorkHourLog) => void;
  onRequestPayout: (amount: number, iban: string) => void;
  onAddPOSSale: (sale: POSSaleRecord) => void;
  onUpdateBrandSettings: (settings: VendorBrandSettings) => void;
  onUpdateTrackingStep: (trackingId: string, stepId: string, isCompleted: boolean) => void;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'voucherNumber'>) => void;
  onDeleteExpense: (id: string) => void;
  onRecordReceivablePayment: (debtId: string, amount: number, method: string) => void;
  onSendReceivableReminder: (debtId: string, phone: string, message: string) => void;
  onAddPayrollEntry: (entry: Omit<CrewPayrollEntry, 'id'>) => void;
  onMarkPayrollPaid: (id: string, method: 'bank_transfer' | 'cash') => void;
  onBatchMarkPayrollPaid?: (
    ids: string[],
    voucherNumber: string,
    method: 'bank_transfer' | 'cash' | 'mada'
  ) => void;
  onAddConsolidatedVoucher?: (
    voucher: ConsolidatedCrewPaymentVoucher,
    autoCreateExpense: boolean
  ) => void;
  onAutoCalculatePayrollFromHours?: () => void;
  onUpdateItemStock?: (itemId: string, newStock: number) => void;
  onAddInventoryItem?: (item: Omit<InventoryItem, 'id'>) => void;
  onEditInventoryItem?: (item: InventoryItem) => void;
  onDeleteInventoryItem?: (itemId: string) => void;
  onRecordRestockExpense?: (
    item: InventoryItem,
    quantityAdded: number,
    totalCost: number,
    supplierName: string,
    notes?: string
  ) => void;
  listings?: VendorListing[];
  ownProfile?: VendorOwnProfile | null;
  onAddListing?: (item: Omit<VendorListing, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>) => void;
  onEditListing?: (item: VendorListing) => void;
  onDeleteListing?: (id: string) => void;
  onSwitchToClientMode: () => void;
  onReturnToAdmin?: () => void;
  onChangeSupervisedVendor?: () => void;
  supervisorBanner?: string | null;
  onLogout?: () => void;
  workspaceSync?: 'idle' | 'loading' | 'synced' | 'error';
  contracts?: SmartServiceContract[];
  onContractsChange?: (contracts: SmartServiceContract[]) => void;
  onNotify?: (msg: string) => void;
}

export type VendorActiveTab =
  | 'calendar'
  | 'listings'
  | 'trust'
  | 'inventory'
  | 'pos'
  | 'ledger'
  | 'reviews'
  | 'tracking'
  | 'whatsapp'
  | 'invoices'
  | 'brand'
  | 'crew'
  | 'biolink'
  | 'socials';

export const VendorHub: React.FC<VendorHubProps> = ({
  bookings,
  blockedDates,
  threads,
  crewMembers,
  invoices,
  payouts,
  posItems,
  salesRecords,
  brandSettings,
  trackings,
  expenses,
  receivables,
  payrollEntries,
  consolidatedVouchers = [],
  inventoryItems = [],
  onAddBooking,
  onAddBlockedDate,
  onRemoveBlockedDate,
  onSendMessage,
  onAddInvoice,
  onAddCrewMember,
  onUpdateCrewStatus,
  onAddWorkLog,
  onRequestPayout,
  onAddPOSSale,
  onUpdateBrandSettings,
  onUpdateTrackingStep,
  onAddExpense,
  onDeleteExpense,
  onRecordReceivablePayment,
  onSendReceivableReminder,
  onAddPayrollEntry,
  onMarkPayrollPaid,
  onBatchMarkPayrollPaid,
  onAddConsolidatedVoucher,
  onAutoCalculatePayrollFromHours,
  onUpdateItemStock,
  onAddInventoryItem,
  onEditInventoryItem,
  onDeleteInventoryItem,
  onRecordRestockExpense,
  listings = [],
  ownProfile = null,
  onAddListing,
  onEditListing,
  onDeleteListing,
  onSwitchToClientMode,
  onReturnToAdmin,
  onChangeSupervisedVendor,
  supervisorBanner,
  onLogout,
  workspaceSync = 'idle',
  contracts = [],
  onContractsChange,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<VendorActiveTab>('listings');
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalPrefillDate, setModalPrefillDate] = useState('2026-08-25');

  // Stats calculation
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const externalBookingsCount = bookings.filter((b) => b.source !== 'platform').length;
  const unreadMessagesCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const overdueDebtsCount = receivables.filter((r) => r.status.startsWith('overdue')).length;

  // Inventory forecasts calculation
  const inventoryForecasts = calculateInventoryForecasts(inventoryItems, bookings);
  const inventoryShortageCount = inventoryForecasts.filter((f) => f.status === 'critical_shortage').length;
  const inventoryLowCount = inventoryForecasts.filter((f) => f.status === 'low_stock').length;

  const handleOpenExternalBooking = (prefillDate?: string) => {
    if (prefillDate) setModalPrefillDate(prefillDate);
    setIsExternalModalOpen(true);
  };

  const navTabs = [
    { id: 'listings', label: 'منتجاتي ومسار يوصل', icon: Package, count: listings.length, badgeColor: 'bg-[#155EEF] text-white' },
    { id: 'calendar', label: 'التقويم ومنع التعارض', icon: CalendarIcon, count: bookings.length },
    {
      id: 'inventory',
      label: 'المخزون واستهلاك المناسبات',
      icon: Package,
      count: inventoryShortageCount > 0 ? inventoryShortageCount : inventoryLowCount > 0 ? inventoryLowCount : inventoryItems.length,
      badgeColor: inventoryShortageCount > 0 ? 'bg-rose-600 text-white animate-pulse' : inventoryLowCount > 0 ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-blue-100 text-blue-800',
    },
    { id: 'trust', label: 'أدوات الثقة والعقود الذكية (B2B)', icon: ShieldCheck, count: 2, badgeColor: 'bg-[#C0A16B] text-slate-950 font-black' },
    { id: 'pos', label: 'كاشير المحل ونقاط البيع (POS)', icon: Calculator, badgeColor: 'bg-emerald-600 text-white' },
    { id: 'ledger', label: 'النظام المحاسبي وقائمة الدخل', icon: TrendingUp, count: overdueDebtsCount || undefined, badgeColor: 'bg-rose-600 text-white' },
    { id: 'reviews', label: 'التقييم المزدوج وتذكير الطلبات', icon: Star, count: 1, badgeColor: 'bg-amber-500 text-white' },
    { id: 'tracking', label: 'تتبع الطلبات المباشر وAPI', icon: Zap, count: trackings.length, badgeColor: 'bg-blue-600 text-white' },
    { id: 'whatsapp', label: 'محادثات الواتساب API', icon: MessageCircle, count: unreadMessagesCount || undefined, badgeColor: 'bg-emerald-500 text-white' },
    { id: 'invoices', label: 'الفواتير بهويتك الخاصة', icon: FileText, count: invoices.length },
    { id: 'socials', label: 'حسابات التواصل', icon: Share2 },
    { id: 'brand', label: 'تخصيص الهوية والبراند', icon: Building2 },
    { id: 'crew', label: 'طاقم العمل والسيارات', icon: Users, count: crewMembers.length },
    { id: 'biolink', label: 'رابط البايو (0% عمولة)', icon: Link2 },
  ];

  return (
    <div className="h-[100dvh] bg-[#131314] text-[#e3e3e3] flex overflow-hidden" dir="rtl">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed md:static z-40 inset-y-0 start-0 w-[272px] max-w-[85vw] bg-[#1e1f20] flex flex-col border-l border-white/8 transition-transform md:translate-x-0 usil-safe-top usil-safe-bottom ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <UsilMark variant="inverse" className="w-8 h-8" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-white truncate max-w-[160px]">
                {ownProfile?.projectName || brandSettings.brandName || 'يوصل'}
              </div>
              <div className="text-[10px] text-white/45">
                {ownProfile?.personName || 'مساحة المورّد'}
              </div>
            </div>
          </div>
          <button type="button" className="md:hidden text-white/60" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              handleOpenExternalBooking();
              setSidebarOpen(false);
            }}
            className="w-full h-10 rounded-full bg-[#d3e3fd] text-[#041e49] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#b8d2fa]"
          >
            <Plus className="w-4 h-4" />
            حجز جديد
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as VendorActiveTab);
                  setSidebarOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-full text-[13px] font-medium flex items-center gap-2.5 text-right transition-colors ${
                  isActive ? 'bg-[#004a77] text-white' : 'text-[#c4c7c5] hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{tab.label}</span>
                {tab.count !== undefined ? (
                  <span className="text-[10px] font-mono text-white/50">{tab.count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/8 space-y-1">
          {onReturnToAdmin ? (
            <button
              type="button"
              onClick={onReturnToAdmin}
              className="w-full px-3 py-2 rounded-lg text-xs text-[#d3e3fd] hover:bg-white/5 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              لوحة الإدارة
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSwitchToClientMode}
            className="w-full px-3 py-2 rounded-lg text-xs text-[#c4c7c5] hover:bg-white/5 flex items-center gap-2"
          >
            <Store className="w-4 h-4" />
            سوق العملاء
          </button>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-3 py-2 rounded-lg text-xs text-[#c4c7c5] hover:bg-white/5 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          ) : null}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 usil-safe-top">
        <header className="h-14 shrink-0 px-3 sm:px-4 flex items-center justify-between border-b border-white/8">
          <div className="flex items-center gap-2">
            <button type="button" className="md:hidden w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-white/80">
              {navTabs.find((tab) => tab.id === activeTab)?.label || 'Vendor Studio'}
            </span>
            {workspaceSync === 'loading' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-white/40">
                <Cloud className="w-3 h-3 animate-pulse" />
                جاري المزامنة
              </span>
            ) : workspaceSync === 'synced' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400/80">
                <Cloud className="w-3 h-3" />
                محفوظ على السيرفر
              </span>
            ) : workspaceSync === 'error' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400/90">
                <CloudOff className="w-3 h-3" />
                الحفظ محلي فقط
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setActiveTab('pos')} className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center" title="POS">
              <Calculator className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setIsScannerModalOpen(true)} className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center" title="Barcode">
              <Camera className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setIsBrandModalOpen(true)} className="w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center" title="Brand">
              <Building2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 usil-safe-bottom">
          <div className="max-w-6xl mx-auto rounded-3xl bg-[#1e1f20] border border-white/5 p-3 sm:p-5 min-h-full">
        {supervisorBanner ? (
          <div className="mb-3 rounded-2xl border border-[#C0A16B]/40 bg-[#C0A16B]/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#E8D5A3]">{supervisorBanner}</p>
            <div className="flex items-center gap-2">
              {onChangeSupervisedVendor ? (
                <button
                  type="button"
                  onClick={onChangeSupervisedVendor}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-[11px] font-bold text-white"
                >
                  تبديل المورّد
                </button>
              ) : null}
              {onReturnToAdmin ? (
                <button
                  type="button"
                  onClick={onReturnToAdmin}
                  className="px-3 py-1.5 rounded-lg bg-[#d3e3fd] text-[11px] font-bold text-[#041e49]"
                >
                  لوحة الإدارة
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {/* Active Tab View */}

        <div className="pt-2">
          {activeTab === 'listings' && (
            <div className="space-y-4">
              {ownProfile ? <VendorOwnFileCard profile={ownProfile} compact /> : null}
              <VendorListingsPanel
                listings={listings}
                vendorName={ownProfile?.projectName || brandSettings.brandName}
                onAdd={onAddListing || (() => {})}
                onEdit={onEditListing || (() => {})}
                onDelete={onDeleteListing || (() => {})}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <VendorCalendarView
              bookings={bookings}
              blockedDates={blockedDates}
              onOpenExternalBookingModal={handleOpenExternalBooking}
              onAddBlockedDate={onAddBlockedDate}
              onRemoveBlockedDate={onRemoveBlockedDate}
            />
          )}

          {activeTab === 'inventory' && (
            <VendorInventoryTracker
              inventoryItems={inventoryItems}
              bookings={bookings}
              brandSettings={brandSettings}
              onUpdateItemStock={onUpdateItemStock || (() => {})}
              onAddItem={onAddInventoryItem || (() => {})}
              onEditItem={onEditInventoryItem || (() => {})}
              onDeleteItem={onDeleteInventoryItem || (() => {})}
              onRecordRestockExpense={onRecordRestockExpense || (() => {})}
            />
          )}

          {activeTab === 'trust' && (
            <TrustAndGrowthHub
              bookings={bookings}
              contracts={contracts}
              onContractsChange={onContractsChange}
              vendorName={brandSettings.brandName}
              onNotify={onNotify || ((msg) => console.log(msg))}
            />
          )}

          {activeTab === 'pos' && (
            <VendorPOSCashier
              items={posItems}
              sales={salesRecords}
              brandSettings={brandSettings}
              existingBookings={bookings}
              blockedDates={blockedDates}
              onCompleteSale={onAddPOSSale}
              onAddBookingFromPOS={(b) => onAddBooking(b as any)}
            />
          )}

          {activeTab === 'tracking' && (
            <VendorOrderTrackerManager
              trackings={trackings}
              brandSettings={brandSettings}
              onUpdateStep={onUpdateTrackingStep}
            />
          )}

          {activeTab === 'whatsapp' && (
            <VendorWhatsAppInbox
              threads={threads}
              onSendMessage={onSendMessage}
            />
          )}

          {activeTab === 'invoices' && (
            <VendorInvoiceGenerator
              invoices={invoices}
              brandSettings={brandSettings}
              onAddInvoice={onAddInvoice}
              onOpenBrandSettings={() => setIsBrandModalOpen(true)}
            />
          )}

          {activeTab === 'socials' && <VendorSocialsPanel />}

          {activeTab === 'brand' && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 card-shadow space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">إعدادات وهوية العلامة التجارية (White-Label)</h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    خصص شعارك، اسم البراند، الختم الرسمي، والحساب البنكي لتظهر على فواتيرك وإيصالات الكاشير ورابط التتبع.
                  </p>
                </div>
                <button
                  onClick={() => setIsBrandModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  <span>تعديل وحفظ بيانات الهوية</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={brandSettings.logoUrl}
                      alt={brandSettings.brandName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-300 bg-white"
                    />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{brandSettings.brandName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{brandSettings.slogan}</p>
                      <p className="text-xs text-[#155EEF] font-bold pt-1">{brandSettings.city} • {brandSettings.phone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block">السجل التجاري:</span>
                      <span className="font-mono font-bold text-slate-800">{brandSettings.crNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">الرقم الضريبي:</span>
                      <span className="font-mono font-bold text-slate-800">{brandSettings.vatNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700">بيانات التحويل البنكي المعتمد بالفاتورة:</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">البنك:</span>
                      <span className="font-bold text-slate-900">{brandSettings.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">اسم الحساب:</span>
                      <span className="font-bold text-slate-900">{brandSettings.accountHolder}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الآيبان:</span>
                      <span className="font-mono font-bold text-slate-900">{brandSettings.iban}</span>
                    </div>
                  </div>

                  {brandSettings.stampUrl && (
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                      <img
                        src={brandSettings.stampUrl}
                        alt="الختم الرسمي"
                        className="w-14 h-14 object-contain mix-blend-multiply"
                      />
                      <span className="text-xs text-slate-600 font-bold">الختم والتوقيع الرسمي معتمد</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Local Database & Backup Protection Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1A33] text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#C0A16B]/20 border border-[#C0A16B]/40 flex items-center justify-center text-[#C0A16B] shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>النسخ الاحتياطي لقاعدة بيانات المتجر المحلية (localforage DB)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        حفظ محلي فوري
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      احصل على نسخة احتياطية كاملة (JSON) تشمل كافة الحجوزات، الفواتير، الكاشير، والقيود المحاسبية كإجراء وقائي.
                    </p>
                  </div>
                </div>

                <button
                  id="brand-tab-backup-btn"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية (JSON)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'crew' && (
            <VendorCrewDispatch
              crewMembers={crewMembers}
              bookings={bookings}
              onAddCrewMember={onAddCrewMember}
              onUpdateCrewStatus={onUpdateCrewStatus}
              onAddWorkLog={onAddWorkLog}
            />
          )}

          {activeTab === 'ledger' && (
            <VendorFinancialSuite
              payouts={payouts}
              bookings={bookings}
              invoices={invoices}
              expenses={expenses}
              receivables={receivables}
              payrollEntries={payrollEntries}
              posSales={salesRecords}
              brandSettings={brandSettings}
              crewMembers={crewMembers}
              consolidatedVouchers={consolidatedVouchers}
              onRequestPayout={onRequestPayout}
              onAddExpense={onAddExpense}
              onDeleteExpense={onDeleteExpense}
              onRecordReceivablePayment={onRecordReceivablePayment}
              onSendReceivableReminder={onSendReceivableReminder}
              onAddPayrollEntry={onAddPayrollEntry}
              onMarkPayrollPaid={onMarkPayrollPaid}
              onBatchMarkPayrollPaid={onBatchMarkPayrollPaid}
              onAddConsolidatedVoucher={onAddConsolidatedVoucher}
              onAutoCalculatePayrollFromHours={onAutoCalculatePayrollFromHours}
            />
          )}

          {activeTab === 'reviews' && (
            <VendorPendingReviewsManager
              bookings={bookings}
              onOpenWhatsAppMessage={(phone, text) => onSendMessage('th-1', text)}
            />
          )}

          {activeTab === 'biolink' && (
            <VendorStorefrontBioLink
              projectName={ownProfile?.projectName || brandSettings.brandName}
              personName={ownProfile?.personName}
              logoUrl={ownProfile?.logoUrl || brandSettings.logoUrl}
              vendorId={ownProfile?.vendorId}
              listings={listings}
            />
          )}
        </div>
          </div>
        </div>

      </div>

      {/* External Booking Modal */}

      <VendorExternalBookingModal
        isOpen={isExternalModalOpen}
        onClose={() => setIsExternalModalOpen(false)}
        onSaveBooking={onAddBooking}
        existingBookings={bookings}
        blockedDates={blockedDates}
        crewMembers={crewMembers}
        initialDate={modalPrefillDate}
        listings={listings}
      />

      {/* Brand Settings Modal */}
      <VendorBrandSettingsModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        settings={brandSettings}
        onSave={onUpdateBrandSettings}
      />

      {/* Database Backup & Safeguard Modal */}
      <VendorDatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        brandSettings={brandSettings}
        bookings={bookings}
        blockedDates={blockedDates}
        invoices={invoices}
        payouts={payouts}
        posItems={posItems}
        salesRecords={salesRecords}
        trackings={trackings}
        expenses={expenses}
        receivables={receivables}
        payrollEntries={payrollEntries}
        crewMembers={crewMembers}
        threads={threads}
        consolidatedVouchers={consolidatedVouchers}
        inventoryItems={inventoryItems}
      />

      {/* Barcode & QR Code Camera Scanner Modal */}
      {onUpdateItemStock && (
        <BarcodeScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          inventoryItems={inventoryItems}
          brandSettings={brandSettings}
          onUpdateItemStock={onUpdateItemStock}
          onOpenAddItemWithBarcode={(scannedCode) => {
            setIsScannerModalOpen(false);
            setActiveTab('inventory');
          }}
          onOpenRestockExpense={(item, suggestedQty) => {
            setIsScannerModalOpen(false);
            setActiveTab('inventory');
          }}
        />
      )}
    </div>
  );
};
