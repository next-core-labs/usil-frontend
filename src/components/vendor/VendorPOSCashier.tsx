import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  POSItem,
  POSCartItem,
  POSSaleRecord,
  VendorBrandSettings,
  VendorBooking,
  NFCPaymentData,
} from '../../types';
import { VendorTapToPayNfcModal } from './VendorTapToPayNfcModal';
import {
  Calculator,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Share2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Receipt,
  User,
  Phone,
  Calendar as CalendarIcon,
  Tag,
  ArrowRight,
  QrCode,
  DollarSign,
  Coffee,
  Users,
  Utensils,
  Cake,
  Music,
  ShoppingBag,
  Search,
  Barcode,
  ScanLine,
  Zap,
  Check,
  Copy,
  Hash,
  Keyboard,
  Info,
  Flame,
  Clock,
  Sparkle,
  Wifi,
  Radio,
} from 'lucide-react';

interface VendorPOSCashierProps {
  posItems?: POSItem[];
  items?: POSItem[];
  salesRecords?: POSSaleRecord[];
  sales?: POSSaleRecord[];
  brandSettings: VendorBrandSettings;
  existingBookings?: VendorBooking[];
  blockedDates?: any[];
  onRecordSale?: (sale: POSSaleRecord) => void;
  onCompleteSale?: (sale: POSSaleRecord) => void;
  onAddBookingFromPOS: (booking: Omit<VendorBooking, 'id' | 'bookingNumber' | 'createdAt'>) => void;
}

export const VendorPOSCashier: React.FC<VendorPOSCashierProps> = ({
  posItems,
  items,
  salesRecords,
  sales,
  brandSettings,
  onRecordSale,
  onCompleteSale,
  onAddBookingFromPOS,
}) => {
  const effectiveItems = items || posItems || [];
  const effectiveSales = sales || salesRecords || [];
  const handleSaleAction = onCompleteSale || onRecordSale;

  // Catalog & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [skuSearchInput, setSkuSearchInput] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'all' | 'sku_only'>('all');

  // Fast Feedback / Notifications
  const [skuToast, setSkuToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Cart / Register State
  const [cart, setCart] = useState<POSCartItem[]>([]);

  // Customer & Event Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('2026-08-27');
  const [venueName, setVenueName] = useState('قاعة / استراحة خاصة');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'visa' | 'apple_pay' | 'cash' | 'bank_transfer' | 'tap_to_pay_nfc'>('tap_to_pay_nfc');

  // Tap-to-Pay NFC Modal
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);

  // Custom Item Drawer
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(150);
  const [customItemSku, setCustomItemSku] = useState('');

  // Quick Add-ons Drawer / Tab Toggle in Cart
  const [isQuickAddonsDrawerOpen, setIsQuickAddonsDrawerOpen] = useState(false);

  // Print / Completed State
  const [completedSale, setCompletedSale] = useState<POSSaleRecord | null>(null);
  const [showThermalReceiptModal, setShowThermalReceiptModal] = useState(false);

  const skuInputRef = useRef<HTMLInputElement>(null);

  const categories = ['الكل', 'إضافات', 'ضيافة', 'طواقم', 'معدات', 'بوفيهات', 'حلويات وعصائر'];

  // Common quick add-ons (filter items marked as quick add-on or in category 'إضافات')
  const commonAddOns = useMemo(() => {
    return effectiveItems.filter((it) => it.isQuickAddOn || it.category === 'إضافات');
  }, [effectiveItems]);

  // Toast Auto-clear
  useEffect(() => {
    if (skuToast) {
      const timer = setTimeout(() => setSkuToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [skuToast]);

  // Calculations
  const subtotal = cart.reduce((sum, ci) => sum + (ci.customPrice ?? ci.item.price) * ci.quantity, 0);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = discountedSubtotal * 0.15;
  const grandTotal = discountedSubtotal + taxAmount;

  // Cart operations
  const handleAddToCart = (item: POSItem, customQty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.item.id === item.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += customQty;
        return updated;
      }
      return [...prev, { item, quantity: customQty, customPrice: item.price }];
    });

    setSkuToast({
      message: `تمت إضافة "${item.title}" (+${customQty}) إلى السلة بنجاح ⚡`,
      type: 'success',
    });
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci, i) => {
          if (i === index) {
            const newQ = ci.quantity + delta;
            return newQ > 0 ? { ...ci, quantity: newQ } : null;
          }
          return ci;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // SKU Direct Search & Scan Handler
  const handleSkuSubmit = (overrideSku?: string) => {
    const rawInput = (overrideSku || skuSearchInput).trim();
    if (!rawInput) return;

    const normalized = rawInput.toLowerCase();

    // Find exact or closest matching SKU / Barcode / ID
    const matchedItem = effectiveItems.find((it) => {
      const sku = (it.sku || '').toLowerCase();
      const barcode = (it.barcode || '').toLowerCase();
      const id = it.id.toLowerCase();
      const title = it.title.toLowerCase();

      return (
        sku === normalized ||
        barcode === normalized ||
        id === normalized ||
        sku.replace(/[^a-z0-9]/g, '') === normalized.replace(/[^a-z0-9]/g, '') ||
        sku.includes(normalized) ||
        barcode.includes(normalized)
      );
    });

    if (matchedItem) {
      handleAddToCart(matchedItem, 1);
      setSkuSearchInput('');
      if (skuInputRef.current) {
        skuInputRef.current.focus();
      }
    } else {
      setSkuToast({
        message: `لم يتم العثور على صنف بالرمز "${rawInput}". يمكنك إضافته كبند مخصص سريع.`,
        type: 'error',
      });
      // Suggest custom SKU prefill
      setCustomItemSku(rawInput.toUpperCase());
    }
  };

  const handleCopySku = (skuText: string) => {
    navigator.clipboard.writeText(skuText);
    setCopiedSku(skuText);
    setSkuToast({
      message: `تم نسخ رمز الـ SKU: ${skuText}`,
      type: 'info',
    });
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleAddCustomItem = () => {
    if (!customItemTitle.trim() || customItemPrice <= 0) return;
    const generatedSku = customItemSku.trim() || `SKU-CST-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: POSItem = {
      id: `custom-pos-${Date.now()}`,
      sku: generatedSku,
      title: customItemTitle,
      category: 'إضافات',
      price: customItemPrice,
      unit: 'حسب الطلب',
      isQuickAddOn: true,
    };
    handleAddToCart(newItem, 1);
    setCustomItemTitle('');
    setCustomItemPrice(150);
    setCustomItemSku('');
  };

  // Successful Tap-to-Pay (NFC) completion handler
  const handleNfcPaymentSuccess = (nfcData: NFCPaymentData) => {
    setIsNfcModalOpen(false);

    if (cart.length === 0) return;

    const receiptNum = `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: POSSaleRecord = {
      id: `pos-sale-${Date.now()}`,
      receiptNumber: receiptNum,
      customerName: customerName.trim() || 'عميل تلامس Tap-to-Pay',
      customerPhone: customerPhone.trim() || '05XXXXXXXX',
      eventDate,
      items: [...cart],
      subtotal,
      taxAmount,
      discount: discountAmount,
      total: grandTotal,
      paidAmount: grandTotal,
      paymentMethod: 'tap_to_pay_nfc',
      nfcPaymentData: nfcData,
      source: 'pos_cashier',
      createdAt:
        new Date().toLocaleDateString('ar-SA') +
        ' ' +
        new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
    };

    if (handleSaleAction) {
      handleSaleAction(newSale);
    }

    onAddBookingFromPOS({
      serviceId: cart[0]?.item.id || 'pos-custom',
      serviceTitle: cart.map((c) => `${c.item.title} (${c.item.sku || 'N/A'})`).join(' + '),
      customerName: newSale.customerName,
      customerPhone: newSale.customerPhone,
      date: eventDate,
      startTime: '17:00',
      endTime: '22:00',
      city: brandSettings.city || 'الرياض',
      venueName: venueName || 'حجز كاشير مباشر',
      guestCount: 100,
      totalAmount: grandTotal,
      depositAmount: grandTotal,
      remainingAmount: 0,
      source: 'external_phone',
      status: 'confirmed',
      notes: `تم الدفع عبر كاشير الهاتف الذكي بتقنية التلامس (Tap-to-Pay NFC) - برقم إيصال ${receiptNum} وتفويض ${nfcData.authCode} (${nfcData.cardScheme.toUpperCase()}).`,
      hasConflict: false,
    });

    setCompletedSale(newSale);
    setShowThermalReceiptModal(true);

    // Reset Form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
  };

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      setSkuToast({ message: 'يرجى إضافة بند واحد على الأقل للسلة لإتمام البيع', type: 'error' });
      return;
    }

    // If Tap-to-Pay NFC is selected, open the dedicated contactless receiver terminal modal
    if (paymentMethod === 'tap_to_pay_nfc') {
      setIsNfcModalOpen(true);
      return;
    }

    const receiptNum = `POS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: POSSaleRecord = {
      id: `pos-sale-${Date.now()}`,
      receiptNumber: receiptNum,
      customerName: customerName.trim() || 'عميل مباشر (كاشير)',
      customerPhone: customerPhone.trim() || '05XXXXXXXX',
      eventDate,
      items: [...cart],
      subtotal,
      taxAmount,
      discount: discountAmount,
      total: grandTotal,
      paidAmount: grandTotal,
      paymentMethod,
      source: 'pos_cashier',
      createdAt:
        new Date().toLocaleDateString('ar-SA') +
        ' ' +
        new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
    };

    if (handleSaleAction) {
      handleSaleAction(newSale);
    }

    // Automatically sync into unified vendor calendar to block date and prevent conflict!
    onAddBookingFromPOS({
      serviceId: cart[0]?.item.id || 'pos-custom',
      serviceTitle: cart.map((c) => `${c.item.title} (${c.item.sku || 'N/A'})`).join(' + '),
      customerName: newSale.customerName,
      customerPhone: newSale.customerPhone,
      date: eventDate,
      startTime: '17:00',
      endTime: '22:00',
      city: brandSettings.city || 'الرياض',
      venueName: venueName || 'حجز كاشير مباشر',
      guestCount: 100,
      totalAmount: grandTotal,
      depositAmount: grandTotal,
      remainingAmount: 0,
      source: 'external_phone',
      status: 'confirmed',
      notes: `تم الحجز والدفع عبر الكاشير الفوري برقم إيصال ${receiptNum} (عمولة المنصة 0%). بنود: ${cart
        .map((c) => `${c.item.title} [${c.item.sku || 'SKU'}] x${c.quantity}`)
        .join(', ')}`,
      hasConflict: false,
    });

    setCompletedSale(newSale);
    setShowThermalReceiptModal(true);

    // Reset Form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
  };

  // Filter Catalog Items
  const filteredItems = useMemo(() => {
    return effectiveItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'الكل' && item.category !== selectedCategory) return false;

      // Search Query filter (matches Title, SKU, Barcode, Description, or Category)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const skuMatch = (item.sku || '').toLowerCase().includes(query);
        const barcodeMatch = (item.barcode || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const catMatch = item.category.toLowerCase().includes(query);

        if (!titleMatch && !skuMatch && !barcodeMatch && !descMatch && !catMatch) {
          return false;
        }
      }

      return true;
    });
  }, [effectiveItems, selectedCategory, searchQuery]);

  // SKU Suggestions based on current SKU search input
  const skuSuggestions = useMemo(() => {
    if (!skuSearchInput.trim()) return [];
    const q = skuSearchInput.trim().toLowerCase();
    return effectiveItems.filter(
      (it) =>
        (it.sku || '').toLowerCase().includes(q) ||
        (it.barcode || '').toLowerCase().includes(q) ||
        it.title.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [effectiveItems, skuSearchInput]);

  return (
    <div className="space-y-6 text-right relative">
      
      {/* Dynamic Toast Feedback */}
      {skuToast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            skuToast.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/40 shadow-emerald-950/20'
              : skuToast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-500/40 shadow-rose-950/20'
              : 'bg-blue-950 text-blue-100 border-blue-500/40 shadow-blue-950/20'
          }`}
        >
          {skuToast.type === 'success' ? (
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          ) : skuToast.type === 'error' ? (
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{skuToast.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-[#0A1A33] text-white card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-bold border border-white/10">
            <Zap className="w-3.5 h-3.5" />
            <span>كاشير يوصل ونقاط البيع السريعة (POS) • بحث بالـ SKU وإضافات سريعة بنقرة واحدة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            <span>كاشير المنشأة الفوري ونظام الباركود</span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#C0A16B]/20 text-[#C0A16B] border border-[#C0A16B]/30 font-mono font-bold">
              0% عمولة
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-2xl">
            نظام نقطة بيع متطور يدعم مسح أكواد التخزين (SKU)، أزرار الإضافات الشائعة الفورية، إصدار الفواتير والإيصالات الحرارية، ومزامنة التقويم المباشرة.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/10 text-xs font-mono font-bold text-[#C0A16B] text-center">
            {brandSettings.brandName.slice(0, 26)}
          </div>
          <button
            onClick={() => {
              if (skuInputRef.current) {
                skuInputRef.current.focus();
                setSkuToast({ message: 'جاهز لمسح أو إدخال كود الـ SKU ⚡', type: 'info' });
              }
            }}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
            <span>مسح كود SKU (Ctrl+K)</span>
          </button>
        </div>
      </div>

      {/* FAST ADD-ONS HERO BAR (QUICK ADD BUTTONS FOR CASHIER EFFICIENCY) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-emerald-500/10 border border-amber-500/20 card-shadow space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>الإضافات والخدمات الشائعة (بنقرة واحدة Quick-Add)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 text-[10px] font-bold">
                  أعلى كفاءة للكاشير ⚡
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                أضف الخدمات الإضافية الأكثر طلباً إلى الفاتورة فوراً بضغطة زر دون الحاجة للبحث
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono font-bold self-end sm:self-center">
            {commonAddOns.length} خدمات شائعة جاهزة
          </div>
        </div>

        {/* Quick Add Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {commonAddOns.map((addon) => {
            const inCartItem = cart.find((c) => c.item.id === addon.id);
            const inCartQty = inCartItem ? inCartItem.quantity : 0;

            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => handleAddToCart(addon, 1)}
                className={`relative p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 group cursor-pointer active:scale-95 ${
                  inCartQty > 0
                    ? 'bg-blue-50/80 border-[#155EEF] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xs'
                }`}
              >
                {inCartQty > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 px-2 py-0.5 rounded-full bg-[#155EEF] text-white text-[10px] font-mono font-black shadow-xs">
                    x{inCartQty}
                  </span>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
                      {addon.sku || 'SKU'}
                    </span>
                    <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-[#155EEF] transition-colors">
                    {addon.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">{addon.unit.split('/')[0]}</span>
                  <span className="font-mono font-black text-[#155EEF]">
                    {addon.price.toLocaleString('ar-SA')} <span className="text-[9px] font-sans">ر.س</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* POS Grid: Catalog & SKU Lookup on Right (7 cols), Register on Left (5 cols) */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Menu, SKU Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Dedicated SKU & Barcode Quick Search Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
            
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-[#155EEF]" />
                <span>إدخال أو مسح كود الصنف (SKU / Barcode)</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                  اضغط Enter للإضافة المباشرة ⚡
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={skuInputRef}
                    type="text"
                    value={skuSearchInput}
                    onChange={(e) => setSkuSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSkuSubmit();
                      }
                    }}
                    placeholder="امسح الباركود أو أدخل الـ SKU (مثال: SKU-DSP-101 أو 101 أو كود الصنف)..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-500 placeholder:font-sans focus:bg-white focus:border-[#155EEF] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  />
                  <Barcode className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  {skuSearchInput && (
                    <button
                      type="button"
                      onClick={() => setSkuSearchInput('')}
                      className="text-slate-600 hover:text-slate-800 text-xs font-bold absolute left-3 top-1/2 -translate-y-1/2"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSkuSubmit()}
                  disabled={!skuSearchInput.trim()}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    skuSearchInput.trim()
                      ? 'bg-[#155EEF] hover:bg-[#0F45B5] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة بالكود</span>
                </button>
              </div>

              {/* Instant SKU Autocomplete Dropdown */}
              {skuSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-2xl border border-slate-200 dropdown-shadow z-30 space-y-1">
                  <div className="text-[10px] font-bold text-slate-600 px-2 pb-1 border-b border-slate-100">
                    أصناف مطابقة للكود (انقر للإضافة الفورية):
                  </div>
                  {skuSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onClick={() => {
                        handleAddToCart(sug, 1);
                        setSkuSearchInput('');
                      }}
                      className="p-2 rounded-xl hover:bg-blue-50 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#155EEF]">
                          {sug.sku || 'SKU'}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-[#155EEF] truncate">
                          {sug.title}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#155EEF] shrink-0">
                        {sug.price.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick SKU Test Scanner Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-600" />
                <span>أكواد سريعة للتجربة:</span>
              </span>
              {['SKU-DSP-101', 'SKU-COF-102', 'SKU-ADD-110', 'SKU-ADD-111', 'SKU-CRW-103', 'SKU-BUF-105'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setSkuSearchInput(code);
                    handleSkuSubmit(code);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#155EEF] border border-slate-200 text-[10px] font-mono font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  +{code}
                </button>
              ))}
            </div>

          </div>

          {/* Catalog Search & Category Filter */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 card-shadow space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الوصف، أو التصنيف (مثال: قهوجي، بوفيه، عود، كرك، عصائر)..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:border-[#155EEF] focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 absolute left-3 top-1/2 -translate-y-1/2"
                >
                  مسح
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0A1A33] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Item Grid with SKU Badges */}
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="sm:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">لم يتم العثور على أي صنف يطابق البحث</div>
                <p className="text-[11px] text-slate-400">جرب البحث بكلمة أخرى أو استخدم إدخال كود الـ SKU المباشر أعلاه</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const inCart = cart.find((ci) => ci.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between space-y-2 group hover:shadow-xs ${
                      inCart
                        ? 'border-[#155EEF] ring-1 ring-blue-100 bg-blue-50/20'
                        : 'border-slate-200 hover:border-[#155EEF]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.sku && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySku(item.sku!);
                              }}
                              title="انقر لنسخ رمز الـ SKU"
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-[#155EEF] transition-colors"
                            >
                              <Hash className="w-2.5 h-2.5" />
                              <span>{item.sku}</span>
                              {copiedSku === item.sku ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600" />
                              )}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded-full bg-slate-100">
                            {item.category}
                          </span>
                          {item.isQuickAddOn && (
                            <span className="text-[9px] text-amber-700 font-bold px-1.5 py-0.2 rounded bg-amber-100">
                              إضافة شائعة ⚡
                            </span>
                          )}
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#155EEF] transition-colors leading-snug">
                        {item.title}
                      </h4>

                      {item.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-bold">
                      <span className="text-slate-500 text-[11px]">{item.unit}</span>
                      <div className="flex items-center gap-1.5">
                        {inCart && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-100 text-[#155EEF]">
                            x{inCart.quantity} في السلة
                          </span>
                        )}
                        <span className="font-mono text-[#155EEF] text-sm">
                          {item.price.toLocaleString('ar-SA')} ر.س
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Custom Fast Item Box with Custom SKU */}
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#155EEF]" />
                <span>إضافة بند أو خدمة مخصصة سريعة للكاشير</span>
              </h4>
              <span className="text-[10px] text-slate-500">يتم توليد SKU تلقائياً أو تخصيصه</span>
            </div>

            <div className="grid sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={customItemTitle}
                onChange={(e) => setCustomItemTitle(e.target.value)}
                placeholder="اسم البند (مثال: بخور عود كمبودي إضافي)"
                className="sm:col-span-5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
              <input
                type="text"
                value={customItemSku}
                onChange={(e) => setCustomItemSku(e.target.value.toUpperCase())}
                placeholder="كود SKU مخصص (اختياري)"
                className="sm:col-span-3 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none"
              />
              <div className="sm:col-span-2 flex items-center bg-white border border-slate-200 rounded-xl px-2">
                <input
                  type="number"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                  className="w-full py-2 bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none text-left"
                />
                <span className="text-[10px] text-slate-400 font-bold mr-1">ر.س</span>
              </div>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#0A1A33] hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إضافة
              </button>
            </div>
          </div>

        </div>

        {/* Register Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="p-5 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
            
            {/* Register Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#155EEF]" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">سلة الإيصال / الكاشير</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {brandSettings.brandName} • 0% عمولة
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {cart.length} بنود
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    title="تفريغ السلة بالكامل"
                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add-ons In-Cart Flyout Bar */}
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>إضافات سريعة فورية للسلة:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuickAddonsDrawerOpen(!isQuickAddonsDrawerOpen)}
                  className="text-[10px] text-[#155EEF] font-bold hover:underline"
                >
                  {isQuickAddonsDrawerOpen ? 'إخفاء الإضافات ▲' : 'عرض الكل ▼'}
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {commonAddOns.slice(0, 4).map((addon) => (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => handleAddToCart(addon, 1)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#155EEF] text-[10px] font-bold text-slate-800 whitespace-nowrap flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#155EEF]" />
                    <span>{addon.title.slice(0, 18)}...</span>
                    <span className="font-mono text-[#155EEF]">+{addon.price} ر.س</span>
                  </button>
                ))}
              </div>

              {isQuickAddonsDrawerOpen && (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5">
                  {commonAddOns.map((addon) => (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => handleAddToCart(addon, 1)}
                      className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#155EEF] text-[10px] font-bold text-slate-800 flex items-center justify-between text-right shadow-2xs transition-colors cursor-pointer"
                    >
                      <span className="truncate flex-1 ml-1">{addon.title}</span>
                      <span className="font-mono text-[#155EEF] shrink-0">+{addon.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">اسم العميل</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="أبو تركي (حجز مباشر)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">رقم الجوال</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">تاريخ المناسبة</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">موقع الفعالية</label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="قصر طويق / استراحة"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Cart Items List with SKU Tag */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                  السلة فارغة. استخدم البحث بالـ SKU أو أزرار الإضافات السريعة.
                </div>
              ) : (
                cart.map((ci, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ci.item.sku && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {ci.item.sku}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 truncate">{ci.item.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#155EEF] font-bold">
                        {(ci.customPrice ?? ci.item.price).toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateQuantity(i, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">{ci.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(i, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(i)}
                        className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 mr-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Totals */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">المجموع الفرعي (قبل الضريبة):</span>
                <span className="font-mono font-bold text-slate-900">{subtotal.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">خصم مخصص (إن وجد):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 text-left focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">ر.س</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono font-bold text-slate-900">{taxAmount.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-900">الإجمالي النهائي المطلوب:</span>
                <span className="font-mono text-base font-extrabold text-[#155EEF]">
                  {grandTotal.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">طريقة الدفع في نقطة البيع</label>
                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>يدعم Web NFC</span>
                </span>
              </div>

              {/* Tap-to-Pay Dedicated Direct Banner */}
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) {
                    setSkuToast({ message: 'يرجى إضافة بند للسلة أولاً لبدء الدفع بالتمرير', type: 'error' });
                    return;
                  }
                  setIsNfcModalOpen(true);
                }}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-l from-[#0A1A33] via-[#0F284D] to-[#155EEF] text-white flex items-center justify-between border border-blue-400/30 shadow-xs hover:shadow-md transition-all cursor-pointer group text-right"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-[#C0A16B] group-hover:scale-110 transition-transform">
                    <Wifi className="w-4 h-4 rotate-90" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>استقبال الدفع بالتمرير (Tap-to-Pay NFC)</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#C0A16B]/30 text-[#C0A16B] text-[9px] font-mono">
                        مدى / Apple Pay
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      حوّل هاتفك لمحطة POS لتمرير بطاقة العميل مباشرة
                    </div>
                  </div>
                </div>
                <div className="text-xs font-black font-mono text-[#C0A16B] bg-white/10 px-2 py-1 rounded-lg border border-white/10 shrink-0 mr-2">
                  فتح NFC
                </div>
              </button>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'tap_to_pay_nfc', label: 'تلامس Tap-to-Pay', icon: Wifi },
                  { id: 'mada', label: 'مدى Mada', icon: CreditCard },
                  { id: 'apple_pay', label: 'Apple Pay', icon: Smartphone },
                  { id: 'bank_transfer', label: 'تحويل بنكي', icon: Banknote },
                  { id: 'visa', label: 'فيزا/ماستر', icon: CreditCard },
                  { id: 'cash', label: 'نقداً Cash', icon: Banknote },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm.id as any);
                        if (pm.id === 'tap_to_pay_nfc' && cart.length > 0) {
                          setIsNfcModalOpen(true);
                        }
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0A1A33] text-white border-[#0A1A33] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${pm.id === 'tap_to_pay_nfc' ? 'rotate-90 text-[#C0A16B]' : ''}`} />
                      <span className="text-[10px]">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zero Commission Highlight */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>العمولة 0% — مبيعات الكاشير تذهب مباشرة لحسابك بالكامل</span>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : paymentMethod === 'tap_to_pay_nfc'
                  ? 'bg-gradient-to-r from-[#155EEF] to-[#0A1A33] hover:opacity-95 text-white'
                  : 'bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white'
              }`}
            >
              {paymentMethod === 'tap_to_pay_nfc' ? (
                <>
                  <Wifi className="w-4 h-4 rotate-90 text-[#C0A16B]" />
                  <span>بدء تمرير البطاقة بالهاتف (Tap-to-Pay)</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>إتمام البيع وطباعة الإيصال الفوري</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

      {/* Recent POS Sales History Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 card-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900">سجل مبيعات الكاشير ونقاط البيع الأخيرة</h3>
            <p className="text-xs text-slate-500">تمت جميعها بعمولة 0% مع إدراجها بالتقويم تلقائياً</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            {effectiveSales.length} عمليات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold">رقم الإيصال</th>
                <th className="py-2.5 px-3 font-bold">العميل</th>
                <th className="py-2.5 px-3 font-bold">تاريخ المناسبة</th>
                <th className="py-2.5 px-3 font-bold">البنود والـ SKU</th>
                <th className="py-2.5 px-3 font-bold">طريقة الدفع</th>
                <th className="py-2.5 px-3 font-bold">الإجمالي</th>
                <th className="py-2.5 px-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{sale.receiptNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{sale.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{sale.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700">{sale.eventDate}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {sale.items.map((i) => `${i.item.title}${i.item.sku ? ` [${i.item.sku}]` : ''} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                      sale.paymentMethod === 'tap_to_pay_nfc'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {sale.paymentMethod === 'tap_to_pay_nfc' ? (
                        <>
                          <Wifi className="w-2.5 h-2.5 rotate-90 text-blue-600" />
                          <span>تلامس NFC</span>
                        </>
                      ) : sale.paymentMethod === 'mada' ? (
                        'مدى'
                      ) : sale.paymentMethod === 'apple_pay' ? (
                        'Apple Pay'
                      ) : sale.paymentMethod === 'bank_transfer' ? (
                        'تحويل بنكي'
                      ) : sale.paymentMethod === 'cash' ? (
                        'نقداً'
                      ) : (
                        'فيزا'
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-[#155EEF]">
                    {sale.total.toLocaleString('ar-SA')} ر.س
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => {
                        setCompletedSale(sale);
                        setShowThermalReceiptModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>طباعة</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 80mm Thermal Receipt Modal (100% White-Labeled with SKUs) */}
      {showThermalReceiptModal && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 usil-modal-scroll">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowThermalReceiptModal(false)} />

          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-slate-200 card-shadow z-10 my-auto text-right overflow-hidden">
            
            {/* Receipt Modal Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إتمام البيع بنجاح</span>
              </span>
              <button
                onClick={() => setShowThermalReceiptModal(false)}
                className="text-white/70 hover:text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            {/* The 80mm Thermal Receipt (Simulated) */}
            <div className="p-6 font-mono text-xs text-slate-900 space-y-4 bg-white" id="thermal-receipt">
              
              {/* Brand Header */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900">{brandSettings.brandName}</h3>
                <p className="text-[10px] text-slate-600 font-sans">{brandSettings.slogan}</p>
                <div className="text-[10px] text-slate-500 pt-1 space-y-0.5">
                  <div>س.ت: {brandSettings.crNumber}</div>
                  <div>الرقم الضريبي: {brandSettings.vatNumber}</div>
                  <div>هاتف: {brandSettings.phone}</div>
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الإيصال:</span>
                  <span className="font-bold">{completedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span>{completedSale.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">العميل:</span>
                  <span className="font-bold">{completedSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ المناسبة:</span>
                  <span className="font-bold">{completedSale.eventDate}</span>
                </div>
              </div>

              {/* Items with SKU */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="flex-1 truncate">{it.item.title} x{it.quantity}</span>
                      <span className="font-bold shrink-0 mr-2">
                        {((it.customPrice ?? it.item.price) * it.quantity).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                    {it.item.sku && (
                      <div className="text-[9px] text-slate-400">
                        كود: {it.item.sku}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الخاضع للضريبة:</span>
                  <span>{completedSale.subtotal.toLocaleString('ar-SA')} ر.س</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>الخصم:</span>
                    <span>-{completedSale.discount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span>{completedSale.taxAmount.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
                  <span>المبلغ المدفوع:</span>
                  <span>{completedSale.total.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>

              {/* Tap-to-Pay EMV Contactless Audit Details (if paid via NFC) */}
              {(completedSale.paymentMethod === 'tap_to_pay_nfc' || completedSale.nfcPaymentData) && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1 border-b border-dashed pb-3">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 rotate-90 text-emerald-600" />
                      <span>دفع تلامسي (Tap-to-Pay NFC)</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px]">
                      مقبول APPROVED
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-0.5">
                    <span>البطاقة:</span>
                    <span className="font-bold">
                      {completedSale.nfcPaymentData?.cardScheme === 'mada'
                        ? 'مدى تلامسية (MADA CL)'
                        : completedSale.nfcPaymentData?.cardScheme === 'apple_pay'
                        ? 'Apple Pay (Tokenized)'
                        : completedSale.nfcPaymentData?.cardScheme === 'visa'
                        ? 'فيزا تلامسية (VISA CL)'
                        : 'ماستركارد تلامسية'}
                    </span>
                  </div>
                  {completedSale.nfcPaymentData?.maskedPan && (
                    <div className="flex justify-between text-slate-600">
                      <span>رقم البطاقة:</span>
                      <span className="font-mono">{completedSale.nfcPaymentData.maskedPan}</span>
                    </div>
                  )}
                  {completedSale.nfcPaymentData?.authCode && (
                    <div className="flex justify-between text-slate-600">
                      <span>رمز التفويض (AUTH):</span>
                      <span className="font-mono font-bold text-slate-800">{completedSale.nfcPaymentData.authCode}</span>
                    </div>
                  )}
                  {completedSale.nfcPaymentData?.rrn && (
                    <div className="flex justify-between text-slate-600">
                      <span>الرقم المرجعي (RRN):</span>
                      <span className="font-mono">{completedSale.nfcPaymentData.rrn}</span>
                    </div>
                  )}
                  {completedSale.nfcPaymentData?.aid && (
                    <div className="flex justify-between text-slate-600">
                      <span>معرف التطبيق (AID):</span>
                      <span className="font-mono">{completedSale.nfcPaymentData.aid}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 text-[9px] pt-0.5 border-t border-slate-200">
                    <span>التحقق:</span>
                    <span>معتمد بدون رقم سري (PINless EMV &lt; 300 SAR)</span>
                  </div>
                </div>
              )}

              {/* QR Code & Footer */}
              <div className="text-center space-y-2 pt-1">
                <div className="w-24 h-24 mx-auto bg-slate-50 border border-slate-300 p-2 rounded-xl flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
                <p className="text-[10px] text-slate-500 font-sans">
                  فاتورة ضريبية مبسطة معتمدة من هيئة الزكاة والضريبة والجمارك
                </p>
                <div className="text-[9px] text-slate-400">
                  شكراً لثقتكم بنا • نسعد بخدمتكم دائماً
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة إيصال حراري</span>
              </button>

              <a
                href={`https://wa.me/${completedSale.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `مرحباً ${completedSale.customerName}،\nشكراً لاختيارك ${brandSettings.brandName}.\nتم إصدار إيصال الحجز رقم ${completedSale.receiptNumber} بقيمة ${completedSale.total} ر.س لتاريخ ${completedSale.eventDate}.\nطريقة الدفع: ${completedSale.paymentMethod === 'tap_to_pay_nfc' ? 'تلامس بالجوال (Tap-to-Pay NFC)' : completedSale.paymentMethod}\nنتشرف بخدمتكم!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>إرسال بالواتساب</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Tap-to-Pay (NFC) Receiver Terminal Modal */}
      <VendorTapToPayNfcModal
        isOpen={isNfcModalOpen}
        onClose={() => setIsNfcModalOpen(false)}
        grandTotal={grandTotal}
        customerName={customerName}
        brandSettings={brandSettings}
        onPaymentSuccess={handleNfcPaymentSuccess}
      />

    </div>
  );
};
