import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Users,
  Zap,
  Calendar as CalendarIcon,
  Calculator,
  Wallet,
  AlertTriangle,
  ArrowUpDown,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  VendorBooking,
  WhatsAppThread,
  ReceivableDebt,
  ExpenseRecord,
  CrewMember,
  ClientOrderTracking,
  InventoryItem,
} from '../../types';
import { calculateInventoryForecasts } from '../../utils/inventoryForecast';
import { Package, Boxes } from 'lucide-react';

export type WidgetId =
  | 'bookings_kpi'
  | 'conflict_shield'
  | 'revenue_kpi'
  | 'whatsapp_alerts'
  | 'receivables_kpi'
  | 'crew_kpi'
  | 'profit_kpi'
  | 'tracking_kpi'
  | 'inventory_kpi';

export interface DashboardWidgetConfig {
  id: WidgetId;
  title: string;
  category: 'operations' | 'finance' | 'communications' | 'security';
  visible: boolean;
}

const DEFAULT_WIDGET_CONFIGS: DashboardWidgetConfig[] = [
  { id: 'bookings_kpi', title: 'إجمالي الحجوزات والمناسبات', category: 'operations', visible: true },
  { id: 'conflict_shield', title: 'حماية التعارض والازدواجية', category: 'security', visible: true },
  { id: 'inventory_kpi', title: 'مخزون واستهلاك المناسبات', category: 'operations', visible: true },
  { id: 'revenue_kpi', title: 'إجمالي الإيرادات المسجلة', category: 'finance', visible: true },
  { id: 'whatsapp_alerts', title: 'رسائل الواتساب والعملاء', category: 'communications', visible: true },
  { id: 'profit_kpi', title: 'صافي أرباح المناسبات (P&L)', category: 'finance', visible: true },
  { id: 'receivables_kpi', title: 'الذمم والتحصيل المعلق', category: 'finance', visible: true },
  { id: 'crew_kpi', title: 'طاقم العمل الميداني والسيارات', category: 'operations', visible: true },
  { id: 'tracking_kpi', title: 'تتبع الطلبات والمناسبات الحية', category: 'operations', visible: true },
];

const LOCAL_STORAGE_KEY = 'usil_vendor_dashboard_widget_order_v2';

interface VendorWidgetGridProps {
  bookings: VendorBooking[];
  threads: WhatsAppThread[];
  receivables: ReceivableDebt[];
  expenses: ExpenseRecord[];
  crewMembers: CrewMember[];
  trackings: ClientOrderTracking[];
  inventoryItems?: InventoryItem[];
  onNavigateTab: (tabId: string) => void;
}

export const VendorWidgetGrid: React.FC<VendorWidgetGridProps> = ({
  bookings,
  threads,
  receivables,
  expenses,
  crewMembers,
  trackings,
  inventoryItems,
  onNavigateTab,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        // Ensure all default widgets exist
        const savedIds = new Set(parsed.map((p) => p.id));
        const missing = DEFAULT_WIDGET_CONFIGS.filter((d) => !savedIds.has(d.id));
        return [...parsed, ...missing];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WIDGET_CONFIGS;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showVisibilityManager, setShowVisibilityManager] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const saveWidgets = (newWidgets: DashboardWidgetConfig[], message?: string) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newWidgets));
      if (message) setToastMessage(message);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetToDefault = () => {
    saveWidgets(DEFAULT_WIDGET_CONFIGS, 'تمت إعادة ترتيب البطاقات للوضع الافتراضي');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent ghost or data
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...widgets];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    saveWidgets(updated, `تم نقل "${movedItem.title}" بنجاح`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Keyboard / Touch Reorder
  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const updated = [...widgets];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    saveWidgets(updated, `تم تغيير ترتيب "${movedItem.title}"`);
  };

  const toggleWidgetVisibility = (id: WidgetId) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgets(updated);
  };

  // Calculated Metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const externalBookingsCount = bookings.filter((b) => b.source !== 'platform').length;
  const unreadMessagesCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const overdueDebtsCount = receivables.filter((r) => r.status.startsWith('overdue')).length;
  const totalOverdueAmount = receivables
    .filter((r) => r.status.startsWith('overdue'))
    .reduce((sum, r) => sum + r.remainingAmount, 0);
  const onDutyCrewCount = crewMembers.filter((c) => c.status === 'on_mission').length;
  const activeTrackingsCount = trackings.filter((t) => t.status !== 'completed').length;

  // Inventory Demand Forecast calculation
  const inventoryForecasts = inventoryItems ? calculateInventoryForecasts(inventoryItems, bookings) : [];
  const inventoryDeficitCount = inventoryForecasts.filter((f) => f.status === 'critical_shortage').length;
  const inventoryLowCount = inventoryForecasts.filter((f) => f.status === 'low_stock').length;

  const renderWidgetContent = (widget: DashboardWidgetConfig, index: number) => {
    switch (widget.id) {
      case 'bookings_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('calendar')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-[#155EEF] hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-[#155EEF]" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#155EEF] font-bold">التقويم</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">{bookings.length} مناسبة</div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              منها {externalBookingsCount} حجز مباشر وكاشير (0% عمولة)
            </span>
          </div>
        );

      case 'conflict_shield':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('calendar')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-emerald-500 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">فوري</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>100% نشط</span>
            </div>
            <span className="text-[11px] text-slate-500 block">فحص فوري للمبيعات والكاشير والمنصة</span>
          </div>
        );

      case 'revenue_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('ledger')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-blue-500 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">المحاسبة</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {totalRevenue.toLocaleString('ar-SA')} <span className="text-xs font-sans text-slate-500">ر.س</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">شاملة مبيعات الكاشير وحجوزات المنصة</span>
          </div>
        );

      case 'whatsapp_alerts':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('whatsapp')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-emerald-500 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">API</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 flex items-center gap-2">
              <span>{unreadMessagesCount} محادثة جديدة</span>
              {unreadMessagesCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />}
            </div>
            <span className="text-[11px] text-slate-500 block">WhatsApp Business Cloud متصل</span>
          </div>
        );

      case 'profit_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('ledger')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-[#C0A16B] hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#C0A16B]" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">قائمة الدخل</span>
            </div>
            <div className={`text-xl font-extrabold font-mono ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {netProfit.toLocaleString('ar-SA')} <span className="text-xs font-sans text-slate-500">ر.س</span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              الإيرادات - المصروفات ({totalExpenses.toLocaleString('ar-SA')} ر.س)
            </span>
          </div>
        );

      case 'receivables_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('ledger')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-rose-400 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">الذمم</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-rose-700">
              {totalOverdueAmount.toLocaleString('ar-SA')} <span className="text-xs font-sans text-slate-500">ر.س</span>
            </div>
            <span className="text-[11px] text-rose-600 font-semibold block">
              {overdueDebtsCount > 0 ? `${overdueDebtsCount} مطالبات متأخرة تحتاج تذكيراً` : 'جميع الذمم مسددة ومنتظمة'}
            </span>
          </div>
        );

      case 'crew_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('crew')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-blue-400 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">الميدان</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {onDutyCrewCount} / {crewMembers.length} <span className="text-xs font-sans text-slate-500">مباشر ومناوبة</span>
            </div>
            <span className="text-[11px] text-slate-500 block">تسجيل الحضور بـ GPS والسيارات</span>
          </div>
        );

      case 'tracking_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('tracking')}
            className={`p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:border-amber-400 hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                {widget.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">حي ومباشر</span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {activeTrackingsCount} <span className="text-xs font-sans text-slate-500">مناسبة جارية الآن</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">متابعة مراحل التجهيز وصب القهوة</span>
          </div>
        );

      case 'inventory_kpi':
        return (
          <div
            onClick={() => !isCustomizing && onNavigateTab('inventory')}
            className={`p-4 rounded-2xl border card-shadow space-y-1.5 transition-all relative group cursor-pointer hover:shadow-md ${
              isCustomizing ? 'ring-2 ring-blue-400/40 bg-blue-50/20' : ''
            } ${
              inventoryDeficitCount > 0
                ? 'bg-rose-50/50 border-rose-300 hover:border-rose-500'
                : inventoryLowCount > 0
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                : 'bg-white border-slate-200 hover:border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Package className={`w-3.5 h-3.5 ${inventoryDeficitCount > 0 ? 'text-rose-600' : 'text-[#155EEF]'}`} />
                {widget.title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                inventoryDeficitCount > 0
                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                  : 'bg-blue-50 text-[#155EEF]'
              }`}>
                {inventoryDeficitCount > 0 ? 'عجز وشيك' : 'المستودع'}
              </span>
            </div>
            <div className="text-xl font-extrabold font-mono text-slate-900 flex items-center gap-2">
              {inventoryDeficitCount > 0 ? (
                <span className="text-rose-600 font-black">{inventoryDeficitCount} بنود ستنفد ⚠️</span>
              ) : (
                <span>{inventoryItems?.length || 0} بنود جاهزة</span>
              )}
            </div>
            <span className={`text-[11px] font-semibold block ${
              inventoryDeficitCount > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              {inventoryDeficitCount > 0
                ? 'حساب ديناميكي لاستهلاك ضيوف الفعاليات'
                : 'رصيد المخزون يغطي كافة المناسبات القادمة'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-3">
      {/* Widget Grid Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-[#155EEF]" />
            <span>بطاقات العمليات ومؤشرات الأداء (KPIs)</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (اسحب وأفلت لترتيب البطاقات حسب أولوياتك اليومية)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Visibility / Filter Trigger */}
          <button
            onClick={() => setShowVisibilityManager((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border ${
              showVisibilityManager
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="إخفاء / إظهار البطاقات"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>تخصيص العرض ({visibleWidgets.length}/{widgets.length})</span>
          </button>

          {/* Drag & Drop Mode Toggle */}
          <button
            onClick={() => setIsCustomizing((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isCustomizing
                ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span>{isCustomizing ? 'إنهاء التخصيص' : 'ترتيب بالسحب (Drag & Drop)'}</span>
          </button>

          {/* Reset button */}
          {isCustomizing && (
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200"
              title="إعادة الترتيب الافتراضي"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Visibility Manager Drawer / Panel */}
      {showVisibilityManager && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 card-shadow space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#155EEF]" />
              حدد البطاقات التي ترغب بظهورها في شاشتك الرئيسية:
            </span>
            <button
              onClick={() => setShowVisibilityManager(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {widgets.map((widget) => {
              const isVis = widget.visible;
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`p-2.5 rounded-xl border text-right text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                    isVis
                      ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="truncate">{widget.title}</span>
                  {isVis ? (
                    <Eye className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions when customizing */}
      {isCustomizing && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-[#155EEF] shrink-0" />
            <span className="font-semibold">
              وضع الترتيب نشط: اسحب أي بطاقة من مقبض السحب وأفلتها في الموقع المطلوب، أو استخدم الأسهم للتحريك.
            </span>
          </div>
          <button
            onClick={() => setIsCustomizing(false)}
            className="px-3 py-1 rounded-lg bg-[#155EEF] text-white font-bold text-xs shrink-0 hover:bg-[#0F45B5]"
          >
            حفظ وإنهاء
          </button>
        </div>
      )}

      {/* Customizable Widget Grid (Drag & Drop Active) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map((widget, index) => {
          const isDragging = draggedIndex === index;
          const isOver = dragOverIndex === index;

          return (
            <div
              key={widget.id}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all duration-200 ${
                isDragging ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
              } ${isOver && !isDragging ? 'ring-2 ring-[#155EEF] ring-offset-2 rounded-2xl' : ''}`}
            >
              {/* Drag Handle & Reorder overlay when in Customizing Mode */}
              {isCustomizing && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
                  {/* Move Left / Right (Arabic RTL friendly) */}
                  <button
                    onClick={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
                    title="تحريك للخلف"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-[#155EEF]"
                    title="اسحب للإفلات"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <button
                    onClick={() => moveWidget(index, 'down')}
                    disabled={index === visibleWidgets.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
                    title="تحريك للأمام"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Render Card Content */}
              {renderWidgetContent(widget, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
