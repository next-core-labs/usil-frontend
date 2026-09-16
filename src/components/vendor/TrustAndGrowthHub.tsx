import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SmartServiceContract, InteractiveQuotationProposal, EventReadinessAudit, HospitalityGiftCard, VendorBooking } from '../../types';
import { buildSmartContract, contractPrintHtml, whatsappContractUrl } from '../../utils/vendorContracts';
import { 
  ShieldCheck, 
  FileSignature, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Gift, 
  Award, 
  Plus, 
  Printer, 
  Copy, 
  Share2, 
  AlertCircle,
  TrendingUp,
  Stamp,
  ExternalLink,
  ChevronDown,
  Building,
  CheckSquare
} from 'lucide-react';

interface TrustAndGrowthHubProps {
  onNotify?: (msg: string) => void;
  bookings?: VendorBooking[];
  contracts?: SmartServiceContract[];
  onContractsChange?: (contracts: SmartServiceContract[]) => void;
  vendorName?: string;
}

export const SEED_CONTRACTS: SmartServiceContract[] = [];

export const TrustAndGrowthHub: React.FC<TrustAndGrowthHubProps> = ({
  onNotify,
  bookings = [],
  contracts,
  onContractsChange,
  vendorName = '',
}) => {
  const [subTab, setSubTab] = useState<'verification' | 'contracts' | 'quotations' | 'checklist' | 'giftcards'>('contracts');
  const [localContracts, setLocalContracts] = useState<SmartServiceContract[]>(SEED_CONTRACTS);
  const contractItems = contracts ?? localContracts;
  const setContractItems = (next: SmartServiceContract[]) => {
    setLocalContracts(next);
    onContractsChange?.(next);
  };

  const [activeContractModal, setActiveContractModal] = useState<SmartServiceContract | null>(null);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    bookingId: '',
    clientName: '',
    clientPhone: '',
    serviceTitle: '',
    eventDate: new Date().toISOString().slice(0, 10),
    eventLocation: 'الرياض',
    totalAmount: 5000,
    depositAmount: 1500,
    notes: '',
  });
  const [contractError, setContractError] = useState('');

  const applyBookingToForm = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) {
      setContractForm((prev) => ({ ...prev, bookingId }));
      return;
    }
    setContractForm({
      bookingId: booking.id,
      clientName: booking.customerName,
      clientPhone: booking.customerPhone,
      serviceTitle: booking.serviceTitle,
      eventDate: booking.date,
      eventLocation: `${booking.venueName} — ${booking.city}`,
      totalAmount: booking.totalAmount,
      depositAmount: booking.depositAmount || Math.round(booking.totalAmount * 0.3),
      notes: booking.notes || '',
    });
  };

  const handleCreateContract = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = buildSmartContract({
        ...contractForm,
        vendorName,
      }) as SmartServiceContract;
      setContractItems([created, ...contractItems]);
      setActiveContractModal(created);
      setIsCreateContractOpen(false);
      setContractError('');
      onNotify?.(`تم إنشاء العقد ${created.contractNumber} وبانتظار توقيع العميل`);
    } catch (error) {
      setContractError(error instanceof Error ? error.message : 'تعذر إنشاء العقد');
    }
  };

  const handleShareContract = (cnt: SmartServiceContract) => {
    const url = whatsappContractUrl(cnt);
    window.open(url, '_blank', 'noopener,noreferrer');
    onNotify?.(`تم فتح واتساب لإرسال عقد ${cnt.contractNumber}`);
  };

  const handlePrintContract = (cnt: SmartServiceContract) => {
    const html = contractPrintHtml(cnt);
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
    if (!popup) {
      onNotify?.('اسمح للنوافذ المنبثقة حتى تقدر تطبع العقد');
      return;
    }
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    onNotify?.(`جاهز للطباعة: ${cnt.contractNumber}`);
  };

  const handleSignClient = (cnt: SmartServiceContract) => {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const signed: SmartServiceContract = {
      ...cnt,
      status: 'signed_active',
      clientSignature: {
        signedByName: cnt.clientName,
        signedAt: stamp,
      },
    };
    setContractItems(contractItems.map((item) => (item.id === cnt.id ? signed : item)));
    setActiveContractModal(signed);
    onNotify?.(`تم توثيق توقيع العميل على ${cnt.contractNumber}`);
  };

  // 1. Trust & Verification State
  const [verificationData, setVerificationData] = useState({
    businessName: vendorName || '',
    crNumber: '',
    freelanceCert: '',
    maroofId: '',
    baladyLicense: '',
    vatRegistered: false,
    vatNumber: '',
    insuranceCoverage: '',
    verifiedBadgeLevel: '',
    trustScore: 0,
  });

  const [quotations, setQuotations] = useState<InteractiveQuotationProposal[]>([]);

  const [newQuoteModal, setNewQuoteModal] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState({
    clientName: '',
    clientPhone: '',
    companyName: '',
    eventTitle: '',
    eventDate: new Date().toISOString().slice(0, 10),
    guestCount: 100,
    itemTitle: '',
    itemPrice: 0,
    discount: 0,
    notes: '',
  });

  const [readinessAudit, setReadinessAudit] = useState<EventReadinessAudit>({
    id: 'chk-empty',
    bookingNumber: '',
    eventTitle: '',
    eventDate: '',
    supervisorName: '',
    overallProgress: 0,
    isApprovedForDispatch: false,
    items: [],
  });

  const [giftCards, setGiftCards] = useState<HospitalityGiftCard[]>([]);

  const [newGiftCardModal, setNewGiftCardModal] = useState(false);
  const [newCardData, setNewCardData] = useState({
    recipientName: '',
    recipientPhone: '',
    senderName: '',
    message: '',
    amount: 1000,
    theme: 'gold_luxury' as const
  });

  const handleToggleCheckItem = (itemId: string) => {
    const updatedItems = readinessAudit.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    const checkedCount = updatedItems.filter(i => i.checked).length;
    const progress = updatedItems.length
      ? Math.round((checkedCount / updatedItems.length) * 100)
      : 0;
    setReadinessAudit({
      ...readinessAudit,
      items: updatedItems,
      overallProgress: progress,
      isApprovedForDispatch: progress >= 80
    });
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = Number(newQuoteData.itemPrice);
    const disc = Number(newQuoteData.discount);
    const vat = Math.round((sub - disc) * 0.15);
    const grand = (sub - disc) + vat;

    const newQ: InteractiveQuotationProposal = {
      id: `q-${Date.now()}`,
      quoteNumber: `Q-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newQuoteData.clientName || 'عميل تجاري',
      clientPhone: newQuoteData.clientPhone || '0500000000',
      companyName: newQuoteData.companyName || undefined,
      eventTitle: newQuoteData.eventTitle || 'مناسبة خاصة',
      eventDate: newQuoteData.eventDate,
      guestCount: Number(newQuoteData.guestCount),
      city: 'الرياض',
      items: [
        {
          title: newQuoteData.itemTitle,
          description: newQuoteData.notes,
          quantity: 1,
          unitPrice: sub,
          total: sub
        }
      ],
      subtotal: sub,
      discountAmount: disc,
      vatAmount: vat,
      grandTotal: grand,
      depositRequired: Math.round(grand * 0.3),
      validUntil: '2026-09-10',
      status: 'sent',
      customNote: newQuoteData.notes,
      createdAt: '2026-08-21'
    };

    setQuotations([newQ, ...quotations]);
    setNewQuoteModal(false);
    if (onNotify) onNotify(`تم إنشاء وإرسال عرض السعر رقم ${newQ.quoteNumber} بنجاح!`);
  };

  const handleCreateGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: HospitalityGiftCard = {
      id: `gc-${Date.now()}`,
      code: `MITHYAF-VIP-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: newCardData.recipientName || 'ضيف مميز',
      recipientPhone: newCardData.recipientPhone || '0500000000',
      senderName: newCardData.senderName || 'محب للضيافة',
      message: newCardData.message || 'إهداء خاص بمناسبة كريمة.',
      amount: Number(newCardData.amount),
      balance: Number(newCardData.amount),
      expiryDate: '2026-12-31',
      status: 'active',
      theme: newCardData.theme,
      createdAt: '2026-08-21'
    };

    setGiftCards([newCard, ...giftCards]);
    setNewGiftCardModal(false);
    if (onNotify) onNotify(`تم إصدار بطاقة الإهداء ${newCard.code} بقيمة ${newCard.amount} ر.س بنجاح!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Trust & Business Scaling OS */}
      <div className="bg-gradient-to-r from-navy via-[#0F284D] to-action rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-20 -translate-y-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-sand/20 text-sand border border-sand/30 text-xs font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sand" />
                بوابة التوثيق والنمو التجاري الفائق
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                مؤشر الثقة: 99.4% ⭐
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold">أدوات الثقة، العقود الذكية، وعروض أسعار الشركات (B2B)</h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              ارفع مبيعاتك واكسب ثقة العملاء والشركات عبر توثيق متجرك، توقيع عقود الضيافة المحمية نظامياً، وإرسال عروض أسعار تفاعلية تقبل الدفع الفوري.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
              <span className="text-2xs text-slate-300 block font-medium">العقود النشطة</span>
              <span className="text-lg font-bold text-sand">{contractItems.length} عقود معتمدة</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
              <span className="text-2xs text-slate-300 block font-medium">عروض B2B المقبولة</span>
              <span className="text-lg font-bold text-emerald-400">92% نسبة الإغلاق</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-white/10 scrollbar-none">
          <button
            onClick={() => setSubTab('verification')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              subTab === 'verification' ? 'bg-sand text-slate-950 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>توثيق المنشأة والرخص الحكومية</span>
          </button>

          <button
            onClick={() => setSubTab('contracts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              subTab === 'contracts' ? 'bg-sand text-slate-950 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>عقود الضيافة الذكية المحمية ({contractItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('quotations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              subTab === 'quotations' ? 'bg-sand text-slate-950 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>عروض الأسعار التفاعلية B2B ({quotations.length})</span>
          </button>

          <button
            onClick={() => setSubTab('checklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              subTab === 'checklist' ? 'bg-sand text-slate-950 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>فحص جاهزية المناسبة (Quality Control)</span>
          </button>

          <button
            onClick={() => setSubTab('giftcards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              subTab === 'giftcards' ? 'bg-sand text-slate-950 shadow-md font-bold' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>بطاقات الإهداء وبرامج الولاء ({giftCards.length})</span>
          </button>
        </div>
      </div>

      {/* 1. VERIFICATION & TRUST CREDENTIALS TAB */}
      {subTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  بيانات السجل والاعتماد الرسمي الموثق
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">تظهر هذه الشارات بجانب اسمك في المتجر وفواتيرك لزيادة ثقة العملاء بنسبة 400%</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                ✓ متجر موثق ومعتمد
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block mb-1">الاسم التجاري الرسمي</span>
                <p className="text-sm font-bold text-slate-900">{verificationData.businessName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200">
                    س.ت: {verificationData.crNumber}
                  </span>
                  <span className="text-2xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    رقم ضريبي معتمد
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block mb-1">شهادة العمل الحر / معروف</span>
                <p className="text-sm font-bold text-slate-900">توثيق منصة الأعمال ومعروف</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                    معروف: #{verificationData.maroofId}
                  </span>
                  <span className="text-2xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200">
                    بلدي: {verificationData.baladyLicense}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">التأمين والضمان المعتمد للمناسبات</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">{verificationData.insuranceCoverage}</p>
                  <p className="text-2xs text-slate-500 mt-1">يضمن تعويض العميل فوراً في حال أي طارئ تشغيلي، مما يجعلك الخيار الأول للشركات الكبرى والوزارات.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                تم التحديث والمطابقة اللحظية مع قواعد بيانات وزارة التجارة وهيئة الزكاة.
              </div>
              <button 
                onClick={() => onNotify && onNotify('تم إرسال طلب تجديد وتحديث وثيقة الاعتماد بنجاح!')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all cursor-pointer"
              >
                تحديث وثائق الاعتماد
              </button>
            </div>
          </div>

          {/* Verification Badge Showcase */}
          <div className="bg-gradient-to-br from-navy to-[#102a54] rounded-2xl p-6 text-white border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sand/20 border border-sand/40 flex items-center justify-center mb-4">
                <Stamp className="w-7 h-7 text-sand" />
              </div>
              <span className="text-xs text-sand font-medium block mb-1">شارة الثقة للعميل</span>
              <h3 className="text-lg font-bold">{verificationData.verifiedBadgeLevel}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                يتم إظهار هذا الختم المذهب التفاعلي على جميع عروض أسعارك وفواتيرك، مع رمز QR للتحقق السريع من السجل والتراخيص.
              </p>

              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-slate-400">نسبة تلبية الطلبات بنجاح:</span>
                  <span className="font-bold text-emerald-400">100%</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-slate-400">معدل رضا العملاء:</span>
                  <span className="font-bold text-sand">4.98 من 5 (214 تقييم)</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">سرعة الرد على الحجوزات:</span>
                  <span className="font-bold text-blue-300">أقل من 5 دقائق ⚡</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => onNotify && onNotify('تم نسخ كود شارة التوثيق لتضمينها في موقعك أو بايو انستغرام')}
                className="w-full py-2.5 rounded-xl bg-sand hover:bg-[#b0925c] text-slate-950 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ شارة التوثيق لموقعك / البايو</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SMART CONTRACTS TAB */}
      {subTab === 'contracts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-action" />
                عقود تقديم خدمات الضيافة الإلكترونية المعتمدة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">عقود رسمية تحفظ حقوقك وحقوق العميل مع توقيع إلكتروني ملزم وتوثيق بالشروط الجزائية</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setContractError('');
                setIsCreateContractOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-action hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء عقد جديد لمناسبة</span>
            </button>
          </div>

          {contractItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">ما فيه عقود بعد</p>
              <p className="text-xs text-slate-500">أنشئ عقد من حجز مؤكد أو عبّ البيانات يدوياً. العقد ينحفظ على السيرفر ويتقدر تطبعه أو ترسله واتساب.</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractItems.map((cnt) => (
              <div key={cnt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-action/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {cnt.contractNumber}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      cnt.status === 'signed_active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {cnt.status === 'signed_active' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>موقّع وساري المفعول</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>بانتظار توقيع العميل</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{cnt.serviceTitle}</h4>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الطرف الثاني (العميل):</span>
                      <span className="font-bold text-slate-900">{cnt.clientName} ({cnt.clientPhone})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">تاريخ المناسبة والموقع:</span>
                      <span className="font-bold text-slate-800">{cnt.eventDate} - {cnt.eventLocation}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-400">القيمة الإجمالية للعقد:</span>
                      <span className="font-bold text-emerald-700 font-mono text-sm">{cnt.totalAmount.toLocaleString()} ر.س</span>
                    </div>
                  </div>

                  {cnt.clientSignature && (
                    <div className="mt-4 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-2xs text-emerald-900 flex items-center justify-between">
                      <span>✓ تم التوقيع بواسطة العميل ({cnt.clientSignature.signedByName})</span>
                      <span className="text-emerald-700 font-mono">{cnt.clientSignature.signedAt}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveContractModal(cnt)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>عرض العقد والتوقيعات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareContract(cnt)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer"
                    title="مشاركة العقد عبر واتساب"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE B2B QUOTATIONS TAB */}
      {subTab === 'quotations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-action" />
                عروض الأسعار التفاعلية الفورية للشركات والمناسبات الكبرى
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">أرسل عرض سعر احترافي بخصومات ذكية، يتيح للعميل الموافقة ودفع العربون فوراً من هاتفه</p>
            </div>
            <button
              onClick={() => setNewQuoteModal(true)}
              className="px-4 py-2 rounded-xl bg-action hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء عرض سعر جديد</span>
            </button>
          </div>

          <div className="space-y-4">
            {quotations.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-action/40 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {q.quoteNumber}
                      </span>
                      {q.companyName && (
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200">
                          {q.companyName}
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                        شاهده العميل قبل قليل 👁️
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{q.eventTitle}</h4>
                    <p className="text-xs text-slate-500">الموجه إلى: <strong className="text-slate-800">{q.clientName}</strong> ({q.clientPhone}) | التاريخ: {q.eventDate} ({q.guestCount} ضيف)</p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block font-medium">الإجمالي مع الضريبة 15%</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono text-action">{q.grandTotal.toLocaleString()} ر.س</span>
                    <span className="text-2xs text-emerald-600 block font-medium">عربون التثبيت: {q.depositRequired.toLocaleString()} ر.س</span>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100">
                        <th className="pb-2 font-bold">البند والخدمة</th>
                        <th className="pb-2 font-bold text-center">الكمية</th>
                        <th className="pb-2 font-bold text-center">سعر الوحدة</th>
                        <th className="pb-2 font-bold text-left">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {q.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5">
                            <span className="font-bold text-slate-800 block">{item.title}</span>
                            <span className="text-2xs text-slate-500">{item.description}</span>
                          </td>
                          <td className="py-2.5 text-center font-mono font-bold text-slate-700">{item.quantity}</td>
                          <td className="py-2.5 text-center font-mono text-slate-600">{item.unitPrice.toLocaleString()} ر.س</td>
                          <td className="py-2.5 text-left font-mono font-bold text-slate-900">{item.total.toLocaleString()} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {q.customNote && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>ملاحظة تميز:</strong> {q.customNote}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-2xs text-slate-400">العرض ساري حتى: {q.validUntil}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNotify && onNotify(`تم نسخ رابط العرض التفاعلي للعميل ${q.clientName}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ رابط العرض التفاعلي</span>
                    </button>
                    <button
                      onClick={() => onNotify && onNotify(`تم إرسال العرض رقم ${q.quoteNumber} إلى واتساب ${q.clientPhone}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>إرسال فوري واتساب</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. QUALITY CONTROL & EVENT READINESS CHECKLIST */}
      {subTab === 'checklist' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-medium">
                  {readinessAudit.bookingNumber}
                </span>
                <span className="text-xs text-slate-500 font-medium">المشرف المسؤول: {readinessAudit.supervisorName}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{readinessAudit.eventTitle}</h3>
              <p className="text-xs text-slate-500">{readinessAudit.eventDate}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block font-medium">نسبة الجاهزية</span>
                <span className="text-2xl font-bold text-emerald-600 font-mono">{readinessAudit.overallProgress}%</span>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                readinessAudit.isApprovedForDispatch 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {readinessAudit.isApprovedForDispatch ? '✓ معتمد للانطلاق الميداني' : 'بانتظار استكمال الفحص'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${readinessAudit.overallProgress}%` }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">بنود الجودة قبل تحرك سيارة الضيافة:</h4>
            {readinessAudit.items.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleToggleCheckItem(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.checked 
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-900' 
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    item.checked ? 'bg-emerald-600 text-white shadow-xs' : 'border-2 border-slate-300 bg-white'
                  }`}>
                    {item.checked && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${item.checked ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.title}
                    </span>
                    {item.subtitle && <span className="text-2xs text-slate-500 block">{item.subtitle}</span>}
                  </div>
                </div>

                {item.assignedTo && (
                  <span className="text-2xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-medium shrink-0">
                    المسؤول: {item.assignedTo}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>يتم أرشفة تقرير الفحص وإرسال إشعار فوري للعميل بأن الضيافة جاهزة وبأعلى المعايير.</span>
            </div>
            <button
              onClick={() => onNotify && onNotify('تم اعتماد تقرير فحص الجاهزية وإشعار العميل والطاقم الميداني!')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all cursor-pointer"
            >
              اعتماد وإرسال إشعار الانطلاق 🚀
            </button>
          </div>
        </div>
      )}

      {/* 5. HOSPITALITY GIFT CARDS TAB */}
      {subTab === 'giftcards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-sand" />
                بطاقات إهداء الضيافة وبرامج الولاء (Gift Cards & Loyalty)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">وفّر خيار إهداء باقات الضيافة والقهوة للمجالس والتبريكات، مع رصيد رقمي يضمن تكرار الطلبات</p>
            </div>
            <button
              onClick={() => setNewGiftCardModal(true)}
              className="px-4 py-2 rounded-xl bg-navy hover:bg-slate-900 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-sand" />
              <span>إصدار بطاقة إهداء جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {giftCards.map((gc) => (
              <div 
                key={gc.id} 
                className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px]"
                style={{
                  background: gc.theme === 'gold_luxury' 
                    ? 'linear-gradient(135deg, #0A1A33 0%, #1A365D 50%, #C0A16B 100%)' 
                    : 'linear-gradient(135deg, #2D1B4E 0%, #4C1D95 60%, #9333EA 100%)'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-sand" />
                    <span className="text-xs font-medium tracking-wider text-slate-200">بطاقة إهداء يوصل الفاخرة</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-2xs font-mono font-medium">
                    {gc.code}
                  </span>
                </div>

                <div className="relative z-10 my-4">
                  <p className="text-xs text-slate-300 mb-1">إهداء من: <strong className="text-white">{gc.senderName}</strong> إلى: <strong className="text-sand">{gc.recipientName}</strong></p>
                  <p className="text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/10 text-slate-100">"{gc.message}"</p>
                </div>

                <div className="relative z-10 flex items-end justify-between border-t border-white/15 pt-3">
                  <div>
                    <span className="text-2xs text-slate-300 block font-medium">الرصيد المتاح</span>
                    <span className="text-2xl font-bold font-mono text-white">{gc.balance.toLocaleString()} ر.س</span>
                  </div>
                  <div className="text-left">
                    <span className="text-2xs text-slate-300 block font-medium">صالحة حتى: {gc.expiryDate}</span>
                    <button
                      onClick={() => onNotify && onNotify(`تم نسخ كرت الإهداء لإرساله إلى ${gc.recipientName}`)}
                      className="mt-1 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>إرسال للمستفيد</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCreateContractOpen && createPortal(
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 usil-modal-scroll" dir="rtl">
          <form onSubmit={handleCreateContract} className="bg-white text-slate-900 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold">إنشاء عقد ضيافة لمناسبة</h3>
              <button type="button" onClick={() => setIsCreateContractOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500">✕</button>
            </div>
            {bookings.length > 0 ? (
              <label className="block text-xs font-medium space-y-1">
                <span>اختر حجزاً مؤكداً</span>
                <select
                  value={contractForm.bookingId}
                  onChange={(e) => applyBookingToForm(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white"
                >
                  <option value="">تعبئة يدوية</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.customerName} — {booking.serviceTitle} ({booking.date})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-medium space-y-1">
                <span>اسم العميل</span>
                <input required value={contractForm.clientName} onChange={(e) => setContractForm({ ...contractForm, clientName: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1">
                <span>جوال العميل</span>
                <input required value={contractForm.clientPhone} onChange={(e) => setContractForm({ ...contractForm, clientPhone: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1 sm:col-span-2">
                <span>وصف الخدمة</span>
                <input required value={contractForm.serviceTitle} onChange={(e) => setContractForm({ ...contractForm, serviceTitle: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1">
                <span>تاريخ المناسبة</span>
                <input type="date" required value={contractForm.eventDate} onChange={(e) => setContractForm({ ...contractForm, eventDate: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1">
                <span>الموقع</span>
                <input required value={contractForm.eventLocation} onChange={(e) => setContractForm({ ...contractForm, eventLocation: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1">
                <span>إجمالي العقد</span>
                <input type="number" min={0} required value={contractForm.totalAmount} onChange={(e) => setContractForm({ ...contractForm, totalAmount: Number(e.target.value) })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1">
                <span>العربون</span>
                <input type="number" min={0} value={contractForm.depositAmount} onChange={(e) => setContractForm({ ...contractForm, depositAmount: Number(e.target.value) })} className="w-full h-10 rounded-xl border border-slate-200 px-3" />
              </label>
              <label className="text-xs font-medium space-y-1 sm:col-span-2">
                <span>ملاحظة تُضاف للبنود</span>
                <textarea value={contractForm.notes} onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })} className="w-full min-h-20 rounded-xl border border-slate-200 px-3 py-2" />
              </label>
            </div>
            {contractError ? <p className="text-xs text-rose-600 font-medium">{contractError}</p> : null}
            <button type="submit" className="w-full h-11 rounded-xl bg-action text-white text-sm font-bold">حفظ العقد وفتحه</button>
          </form>
        </div>,
        document.body,
      )}

      {activeContractModal && createPortal(
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 usil-modal-scroll" dir="rtl">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-medium text-slate-500">{activeContractModal.contractNumber}</span>
                <h3 className="text-lg font-bold text-slate-900">عقد اتفاقية تقديم خدمات ضيافة رسمية</h3>
              </div>
              <button 
                type="button"
                onClick={() => setActiveContractModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p><strong>الطرف الأول (المورّد):</strong> {activeContractModal.vendorName} (س.ت: {activeContractModal.vendorCrNumber})</p>
              <p><strong>الطرف الثاني (العميل):</strong> {activeContractModal.clientName} (هاتف: {activeContractModal.clientPhone})</p>
              <p><strong>المناسبة والخدمة:</strong> {activeContractModal.serviceTitle} بتاريخ {activeContractModal.eventDate} في {activeContractModal.eventLocation}</p>
              <p><strong>القيمة المالية:</strong> الإجمالي {activeContractModal.totalAmount.toLocaleString()} ر.س (العربون: {activeContractModal.depositAmount.toLocaleString()} ر.س / المتبقي: {activeContractModal.remainingAmount.toLocaleString()} ر.س)</p>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-900 mb-2">البنود والشروط النظامية:</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {activeContractModal.terms.map((term, i) => (
                  <li key={i} className="leading-relaxed">{term}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                <span className="text-2xs text-emerald-800 font-medium block mb-1">توقيع وختم المورّد</span>
                <div className="w-16 h-16 mx-auto my-1 rounded-full bg-emerald-600/10 border-2 border-emerald-600 flex items-center justify-center text-emerald-800 font-medium text-xs">
                  معتمد ومختوم
                </div>
                <span className="text-xs font-medium text-slate-900 block">{activeContractModal.vendorSignature?.signedByName}</span>
                <span className="text-2xs text-slate-500 font-mono">{activeContractModal.vendorSignature?.signedAt}</span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                <span className="text-2xs text-blue-800 font-medium block mb-1">توقيع العميل</span>
                <div className="w-16 h-16 mx-auto my-1 rounded-xl bg-blue-600/10 border border-blue-400 flex items-center justify-center text-blue-800 font-medium text-xs font-mono">
                  {activeContractModal.clientSignature ? '✓ تم التوقيع' : 'بانتظار التوقيع'}
                </div>
                <span className="text-xs font-medium text-slate-900 block">{activeContractModal.clientSignature?.signedByName || 'في انتظار الاعتماد'}</span>
                <span className="text-2xs text-slate-500 font-mono">{activeContractModal.clientSignature?.signedAt || '-'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {!activeContractModal.clientSignature ? (
                <button
                  type="button"
                  onClick={() => handleSignClient(activeContractModal)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  توثيق توقيع العميل
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleShareContract(activeContractModal)}
                className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
              >
                إرسال واتساب
              </button>
              <button
                type="button"
                onClick={() => handlePrintContract(activeContractModal)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة العقد</span>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* New Interactive Quotation Modal */}
      {newQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 usil-modal-scroll">
          <form onSubmit={handleCreateQuotation} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-action" />
                إنشاء عرض سعر تفاعلي جديد
              </h3>
              <button 
                type="button"
                onClick={() => setNewQuoteModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل / الجهة</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: شركة أرامكو / د. خالد"
                  value={newQuoteData.clientName}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الجوال</label>
                <input 
                  type="tel"
                  required
                  placeholder="05xxxxxxxx"
                  value={newQuoteData.clientPhone}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">عنوان المناسبة</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: حفل تدشين الفرع الجديد والضيافة الشاملة"
                  value={newQuoteData.eventTitle}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, eventTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ المناسبة</label>
                <input 
                  type="date"
                  value={newQuoteData.eventDate}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, eventDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عدد الضيوف المتوقع</label>
                <input 
                  type="number"
                  value={newQuoteData.guestCount}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, guestCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">السعر المبدئي (ر.س)</label>
                <input 
                  type="number"
                  required
                  value={newQuoteData.itemPrice}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, itemPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">قيمة الخصم الترويجي (ر.س)</label>
                <input 
                  type="number"
                  value={newQuoteData.discount}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, discount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">الملاحظات وتفاصيل التقديم</label>
                <textarea 
                  rows={2}
                  value={newQuoteData.notes}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setNewQuoteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-action text-white text-xs font-medium cursor-pointer"
              >
                إنشاء وإرسال العرض الآن
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Gift Card Modal */}
      {newGiftCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 usil-modal-scroll">
          <form onSubmit={handleCreateGiftCard} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-sand" />
                إصدار بطاقة إهداء ضيافة
              </h3>
              <button 
                type="button"
                onClick={() => setNewGiftCardModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المهدى إليه (المستلم)</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: د. عبدالرحمن الشهري"
                  value={newCardData.recipientName}
                  onChange={(e) => setNewCardData({ ...newCardData, recipientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المُهدي</label>
                <input 
                  type="text"
                  required
                  placeholder="مثال: منسوبو الشركة"
                  value={newCardData.senderName}
                  onChange={(e) => setNewCardData({ ...newCardData, senderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">قيمة الرصيد المهدى (ر.س)</label>
                <input 
                  type="number"
                  required
                  value={newCardData.amount}
                  onChange={(e) => setNewCardData({ ...newCardData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رسالة الإهداء والتبريكات</label>
                <textarea 
                  rows={2}
                  placeholder="مبارك المنزل الجديد.. نسعد بضيافة ضيوفكم الكرام"
                  value={newCardData.message}
                  onChange={(e) => setNewCardData({ ...newCardData, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setNewGiftCardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-medium cursor-pointer"
              >
                إصدار وتفعيل البطاقة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
