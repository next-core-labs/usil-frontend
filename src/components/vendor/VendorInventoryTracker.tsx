import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  InventoryCategory,
  InventoryDemandForecast,
  VendorBooking,
  VendorBrandSettings,
} from '../../types';
import {
  calculateInventoryForecasts,
  getInventorySummaryStats,
} from '../../utils/inventoryForecast';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Truck,
  ShoppingCart,
  Calendar,
  Layers,
  ArrowUpDown,
  Edit3,
  Trash2,
  X,
  FileText,
  DollarSign,
  Info,
  Check,
  Building2,
  BarChart3,
  Sparkles,
  Zap,
  Camera,
  QrCode,
} from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface VendorInventoryTrackerProps {
  inventoryItems: InventoryItem[];
  bookings: VendorBooking[];
  brandSettings: VendorBrandSettings;
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRecordRestockExpense: (
    item: InventoryItem,
    quantityAdded: number,
    totalCost: number,
    supplierName: string,
    notes?: string
  ) => void;
}

const CATEGORY_LABELS: Record<InventoryCategory, { label: string; color: string }> = {
  disposables: { label: 'أكواب ومستهلكات', color: 'bg-blue-50 text-[#155EEF] border-blue-200' },
  raw_beverages: { label: 'بن ومشروبات خام', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ingredients: { label: 'مكونات وتمور وضيافة', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  equipment_assets: { label: 'معدات وأصول تشغيل', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  presentation_ware: { label: 'أواني وصواني تقديم', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  uniforms_cleaners: { label: 'أزياء وتعقيم', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const VendorInventoryTracker: React.FC<VendorInventoryTrackerProps> = ({
  inventoryItems,
  bookings,
  brandSettings,
  onUpdateItemStock,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onRecordRestockExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'low' | 'safe'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  
  // Restock form state
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockTotalCost, setRestockTotalCost] = useState<number>(0);
  const [restockSupplier, setRestockSupplier] = useState<string>('');
  const [restockNotes, setRestockNotes] = useState<string>('');

  // Item Form State (for Add / Edit)
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    nameAr: '',
    nameEn: '',
    category: 'disposables',
    currentStock: 100,
    minStockThreshold: 50,
    unit: 'كوب',
    unitCost: 1.0,
    estimatedUsagePerGuest: 2.0,
    leadTimeDays: 3,
    supplierName: '',
    supplierPhone: '',
    barcode: '',
    location: '',
    notes: '',
  });

  // Calculate dynamic forecasts based on scheduled bookings
  const forecasts = useMemo(() => {
    return calculateInventoryForecasts(inventoryItems, bookings);
  }, [inventoryItems, bookings]);

  const stats = useMemo(() => {
    return getInventorySummaryStats(forecasts);
  }, [forecasts]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts.filter((f) => {
      const matchSearch =
        f.item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.item.nameEn && f.item.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.item.supplierName && f.item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.item.location && f.item.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === 'all' || f.item.category === selectedCategory;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'critical' && f.status === 'critical_shortage') ||
        (statusFilter === 'low' && f.status === 'low_stock') ||
        (statusFilter === 'safe' && f.status === 'safe');

      return matchSearch && matchCategory && matchStatus;
    });
  }, [forecasts, searchTerm, selectedCategory, statusFilter]);

  // Handle open restock modal
  const handleOpenRestock = (item: InventoryItem, suggestedQty: number = 0) => {
    setRestockItem(item);
    const qty = suggestedQty > 0 ? suggestedQty : item.minStockThreshold * 2;
    setRestockQty(qty);
    setRestockTotalCost(Math.round(qty * item.unitCost * 100) / 100);
    setRestockSupplier(item.supplierName || '');
    setRestockNotes(`توريد سريع لدعم الفعاليات المجدولة (+${qty} ${item.unit})`);
  };

  // Submit restock
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    onRecordRestockExpense(
      restockItem,
      Number(restockQty),
      Number(restockTotalCost),
      restockSupplier,
      restockNotes
    );
    setRestockItem(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      nameAr: item.nameAr,
      nameEn: item.nameEn || '',
      category: item.category,
      currentStock: item.currentStock,
      minStockThreshold: item.minStockThreshold,
      unit: item.unit,
      unitCost: item.unitCost,
      estimatedUsagePerGuest: item.estimatedUsagePerGuest,
      leadTimeDays: item.leadTimeDays || 3,
      supplierName: item.supplierName || '',
      supplierPhone: item.supplierPhone || '',
      barcode: item.barcode || '',
      location: item.location || '',
      notes: item.notes || '',
    });
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      category: 'disposables',
      currentStock: 100,
      minStockThreshold: 40,
      unit: 'حبة',
      unitCost: 10,
      estimatedUsagePerGuest: 1.0,
      leadTimeDays: 2,
      supplierName: '',
      supplierPhone: '',
      barcode: '',
      location: 'المستودع الرئيسي',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Add with pre-filled barcode from scanner
  const handleOpenAddWithBarcode = (barcode: string) => {
    setEditingItem(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      category: 'disposables',
      currentStock: 100,
      minStockThreshold: 40,
      unit: 'حبة',
      unitCost: 10,
      estimatedUsagePerGuest: 1.0,
      leadTimeDays: 2,
      supplierName: '',
      supplierPhone: '',
      barcode: barcode,
      location: 'المستودع الرئيسي',
      notes: 'تمت إضافته عبر قارئ الباركود بالكاميرا',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit
  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr.trim()) return;

    if (editingItem) {
      onEditItem({
        ...formData,
        id: editingItem.id,
      });
    } else {
      onAddItem(formData);
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0A1A33] via-[#0F294D] to-[#155EEF] text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/15">
              <Package className="w-5 h-5 text-[#C0A16B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  إدارة المخزون والتنبؤ باستهلاك المناسبات
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#C0A16B]/20 text-[#DFC18D] border border-[#C0A16B]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#C0A16B]" />
                  نظام التنبؤ الذكي بالطلب
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium">
                احتساب الاستهلاك الفعلي وتنبيهات النقص التلقائية لجميع مستلزمات الضيافة والأكواب والمواد بناءً على حجوزات المناسبات المجدولة.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <button
            id="btn-scan-barcode-camera"
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-102"
          >
            <Camera className="w-4 h-4" />
            <span>مسح باركود بالكاميرا</span>
          </button>

          <button
            id="btn-add-inventory-item"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#C0A16B] hover:bg-[#b0915b] text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بند جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">إجمالي أصناف المخزون</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {stats.totalItemsCount} صنف
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">عجز حرج بالفعاليات</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-rose-600 font-mono">
                {stats.criticalCount}
              </span>
              {stats.criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold animate-pulse">
                  يتطلب توريد فوري
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">دون حد الأمان المطلوب</span>
            <span className="text-xl font-black text-amber-600 font-mono">
              {stats.lowStockCount} أصناف
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">تكلفة إعادة التوريد المقترحة</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {stats.totalRestockEstimatedCost.toLocaleString()} ر.س
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Demand Warning Banner */}
      {stats.criticalCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-950">
                  تنبيه تشغيلي عاجل: تم رصد عجز متوقع في ({stats.criticalCount}) من مستلزمات الحفلات المجدولة!
                </h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  بناءً على جداول المناسبات وعدد الضيوف المجدولين، الرصيد الحالي بالمستودع لن يكفي لتغطية كامل الفعاليات. اضغط على زر "طلب توريد سريع" لتوليد سند توريد وقيد محاسبي فوري.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter('critical')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>عرض البنود الحرجة فقط ({stats.criticalCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم البند، المورد، موقع المستودع، أو الباركود..."
              className="w-full pl-20 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="مسح باركود بالكاميرا"
              >
                <Camera className="w-3.5 h-3.5 text-[#155EEF]" />
                <span className="hidden sm:inline">مسح</span>
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#0A1A33] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              الكل ({forecasts.length})
            </button>

            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                statusFilter === 'critical'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>عجز حرج ({stats.criticalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                statusFilter === 'low'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>منخفض ({stats.lowStockCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('safe')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                statusFilter === 'safe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>آمن ({stats.safeCount})</span>
            </button>
          </div>
        </div>

        {/* Categories Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">التصنيف:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-50 text-[#155EEF] border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            جميع التصنيفات
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedCategory === catKey
                  ? 'bg-blue-50 text-[#155EEF] border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {catMeta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items List / Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#155EEF]" />
            <h3 className="text-sm font-extrabold text-slate-900">
              قائمة أصناف المخزون والتنبؤ بالاستهلاك ({filteredForecasts.length})
            </h3>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            تحديث فوري بناءً على الحجوزات النشطة
          </span>
        </div>

        {filteredForecasts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-700">لا توجد بنود مخزون تطابق الفلتر المحدد</h4>
              <p className="text-xs text-slate-500">
                جرّب تعديل مصطلح البحث أو اختيار تصنيف آخر.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setStatusFilter('all');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredForecasts.map(({ item, forecastedUsageCount, upcomingGuestsCount, remainingProjectedStock, status, suggestedReorderQuantity, estimatedReorderCost }) => {
              const catMeta = CATEGORY_LABELS[item.category] || { label: item.category, color: 'bg-slate-50 text-slate-700 border-slate-200' };
              const stockRatio = item.minStockThreshold > 0 ? (item.currentStock / item.minStockThreshold) : 1;
              const isShortage = status === 'critical_shortage';
              const isLow = status === 'low_stock';

              return (
                <div
                  key={item.id}
                  id={`inventory-card-${item.id}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-xs space-y-3.5 ${
                    isShortage
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-300/60'
                      : isLow
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  {/* Top Row: Title, Category & Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                        
                        {isShortage && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            عجز متوقع بالفعاليات ({Math.abs(remainingProjectedStock)} {item.unit})
                          </span>
                        )}

                        {isLow && !isShortage && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            دون حد الأمان
                          </span>
                        )}

                        {!isShortage && !isLow && (
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            رصيد كافي وآمن
                          </span>
                        )}

                        {item.location && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            📍 {item.location}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {item.nameAr}
                      </h4>
                      {item.nameEn && (
                        <p className="text-[11px] font-mono text-slate-400">
                          {item.nameEn}
                        </p>
                      )}
                    </div>

                    {/* Quick Stock Controls & Restock Trigger */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenRestock(item, suggestedReorderQuantity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                          isShortage
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-blue-50 hover:bg-blue-100 text-[#155EEF] border border-blue-200'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>طلب توريد (+{suggestedReorderQuantity > 0 ? suggestedReorderQuantity : 50})</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="تعديل البند"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف بند المخزون "${item.nameAr}"؟`)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="حذف البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Metrics & Consumption Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
                    {/* Current Stock */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block">الرصيد الفعلي الحالي</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className={`text-base font-black font-mono ${
                          item.currentStock <= item.minStockThreshold ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {item.currentStock} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                        </span>
                        
                        {/* Inline Quick +/- */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                          <button
                            onClick={() => onUpdateItemStock(item.id, item.currentStock - 1)}
                            className="w-5 h-5 flex items-center justify-center rounded-md bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                            title="إنقاص 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => onUpdateItemStock(item.id, item.currentStock + 1)}
                            className="w-5 h-5 flex items-center justify-center rounded-md bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                            title="زيادة 1"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Events Demand */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <span className="text-[10px] text-slate-400 font-bold block">مطلوب للفعاليات القادمة</span>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-base font-black text-[#155EEF] font-mono">
                          {forecastedUsageCount}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.unit} ({upcomingGuestsCount} ضيف)
                        </span>
                      </div>
                    </div>

                    {/* Projected Balance */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                      remainingProjectedStock < 0
                        ? 'bg-rose-100/60 border-rose-300 text-rose-900'
                        : remainingProjectedStock <= item.minStockThreshold
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-white border-slate-200/90'
                    }`}>
                      <span className="text-[10px] font-bold block opacity-75">المتبقي بعد الفعاليات</span>
                      <span className="text-base font-black font-mono mt-1">
                        {remainingProjectedStock}{' '}
                        <span className="text-[11px] font-normal">{item.unit}</span>
                      </span>
                    </div>

                    {/* Safety Minimum & Unit Cost */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90">
                      <span className="text-[10px] text-slate-400 font-bold block">حد الأمان وسعر الشراء</span>
                      <div className="mt-1 flex items-baseline justify-between text-[11px] font-mono">
                        <span className="text-slate-600 font-bold">الأمان: {item.minStockThreshold} {item.unit}</span>
                        <span className="text-emerald-700 font-bold">@{item.unitCost} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* Supplier & Reorder recommendation footer */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-3">
                      {item.supplierName && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          المورد: <strong className="text-slate-700">{item.supplierName}</strong>
                        </span>
                      )}
                      {item.leadTimeDays && (
                        <span className="text-slate-400 font-mono">
                          مدة التوريد: {item.leadTimeDays} أيام
                        </span>
                      )}
                    </div>

                    {suggestedReorderQuantity > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-[#C0A16B]" />
                        <span>الكمية المقترحة لإعادة الطلب:</span>
                        <span className="font-mono text-emerald-700">
                          {suggestedReorderQuantity} {item.unit} (~ {estimatedReorderCost} ر.س)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restock & Record Expense Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    طلب وتوريد مخزون: {restockItem.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    تسجيل كمية التوريد الجديدة وترحيل سند الصرف تلقائياً لقائمة الدخل P&L
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRestock} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الرصيد الحالي بالمستودع</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {restockItem.currentStock} {restockItem.unit}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block">الرصيد المتوقع بعد التوريد</span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    {restockItem.currentStock + Number(restockQty || 0)} {restockItem.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">الكمية الموردة ({restockItem.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockQty}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      setRestockQty(qty);
                      setRestockTotalCost(Math.round(qty * restockItem.unitCost * 100) / 100);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">إجمالي تكلفة الشراء (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={restockTotalCost}
                    onChange={(e) => setRestockTotalCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">اسم المورّد / الشركة الموردة</label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="e.g. مصنع الأكواب الذهبية"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">ملاحظات التوريد أو رقم فاتورة المورد</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="ملاحظات تشغيلية..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#155EEF] shrink-0" />
                <span>
                  سيتم تحديث كمية المخزون فوراً، وإنشاء سند صرف تلقائي بتصنيف <strong>توريدات ومستلزمات المخزون</strong> في لوحة المحاسبة.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد التوريد وقيد المصروف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingItem ? 'تعديل بيانات بند المخزون' : 'إضافة بند مخزون جديد'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    حدد معدل الاستهلاك لكل ضيف لاحتساب التنبؤ التلقائي باحتياج الفعاليات
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">اسم الصنف بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="e.g. أكواب ورقية دبل 8oz بطباعة الشعار"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-slate-700">الاسم بالإنجليزية (اختياري)</label>
                  <input
                    type="text"
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Custom Double Wall Paper Cups 8oz"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">التصنيف *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryCategory })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
                      <option key={catKey} value={catKey}>
                        {catMeta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">وحدة القياس *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. كرتون، كوب، كجم، حبة، لتر"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">الرصيد الفعلي الحالي *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">حد الأمان (الحد الأدنى) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStockThreshold}
                    onChange={(e) => setFormData({ ...formData, minStockThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">تكلفة شراء الوحدة (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">معدل الاستهلاك التقريبي لكل ضيف *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={formData.estimatedUsagePerGuest}
                    onChange={(e) => setFormData({ ...formData, estimatedUsagePerGuest: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">اسم المورّد المعتمد</label>
                  <input
                    type="text"
                    value={formData.supplierName || ''}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="e.g. مصنع التغليف الراقي"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">موقع الصنف في المستودع</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. ممر A - رف 2"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#155EEF]/20 focus:border-[#155EEF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A1A33] hover:bg-[#155EEF] text-white font-black shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'حفظ التعديلات' : 'إضافة البند للمستودع'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode & QR Code Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        inventoryItems={inventoryItems}
        brandSettings={brandSettings}
        onUpdateItemStock={onUpdateItemStock}
        onOpenAddItemWithBarcode={handleOpenAddWithBarcode}
        onOpenRestockExpense={(item, suggestedQty) => {
          setIsScannerOpen(false);
          handleOpenRestock(item, suggestedQty);
        }}
      />
    </div>
  );
};
