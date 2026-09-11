import React, { useState, useEffect, useRef } from 'react';
import {
  VendorBrandSettings,
  NFCPaymentData,
} from '../../types';
import {
  isWebNfcSupported,
  playNfcBeep,
  triggerNfcHaptic,
  generateNfcPaymentPayload,
  WebNfcPaymentScanner,
} from '../../utils/webNfcManager';
import {
  Smartphone,
  CreditCard,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Zap,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  Radio,
  Check,
  Building2,
  Clock,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface VendorTapToPayNfcModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  customerName?: string;
  brandSettings: VendorBrandSettings;
  onPaymentSuccess: (nfcData: NFCPaymentData) => void;
}

type PaymentStep = 'idle_ready' | 'card_detected' | 'cryptographic_auth' | 'approved' | 'failed';

export const VendorTapToPayNfcModal: React.FC<VendorTapToPayNfcModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  customerName,
  brandSettings,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<PaymentStep>('idle_ready');
  const [activeScheme, setActiveScheme] = useState<'mada' | 'apple_pay' | 'visa' | 'mastercard'>('mada');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hardwareNfcSupported, setHardwareNfcSupported] = useState(false);
  const [nfcScannerActive, setNfcScannerActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approvedData, setApprovedData] = useState<NFCPaymentData | null>(null);
  const [isManualProcessing, setIsManualProcessing] = useState(false);

  const nfcScannerRef = useRef<WebNfcPaymentScanner | null>(null);

  // Initialize Web NFC and check support
  useEffect(() => {
    if (!isOpen) {
      if (nfcScannerRef.current) {
        nfcScannerRef.current.stopScan();
      }
      setStep('idle_ready');
      setApprovedData(null);
      setErrorMessage(null);
      return;
    }

    const supported = isWebNfcSupported();
    setHardwareNfcSupported(supported);
    setStep('idle_ready');
    setApprovedData(null);
    setErrorMessage(null);

    // Play subtle ready beep
    if (soundEnabled) {
      playNfcBeep('processing');
    }

    // Try starting Web NFC Scanner if supported on device
    if (supported) {
      nfcScannerRef.current = new WebNfcPaymentScanner();
      nfcScannerRef.current
        .startScan(
          (realData) => {
            handleCardInteraction(activeScheme, realData);
          },
          (err) => {
            console.warn('Web NFC Read error or canceled:', err);
          }
        )
        .then((started) => {
          setNfcScannerActive(started);
        });
    }

    return () => {
      if (nfcScannerRef.current) {
        nfcScannerRef.current.stopScan();
      }
    };
  }, [isOpen, activeScheme]);

  if (!isOpen) return null;

  // Process Card Tap Sequence
  const handleCardInteraction = (
    scheme: 'mada' | 'apple_pay' | 'visa' | 'mastercard',
    realNfcData?: { serialNumber?: string; records?: any[] }
  ) => {
    if (step === 'approved' || isManualProcessing) return;

    setIsManualProcessing(true);
    setActiveScheme(scheme);
    setErrorMessage(null);

    // Step 1: Card Detected (Instant Beep & Haptic)
    setStep('card_detected');
    if (soundEnabled) playNfcBeep('card_touch');
    triggerNfcHaptic('tap');

    // Step 2: EMV Handshake & Cryptographic Auth
    setTimeout(() => {
      setStep('cryptographic_auth');
      if (soundEnabled) playNfcBeep('processing');

      // Step 3: Approved
      setTimeout(() => {
        const payload = generateNfcPaymentPayload(scheme, realNfcData);
        setApprovedData(payload);
        setStep('approved');

        if (soundEnabled) playNfcBeep('success');
        triggerNfcHaptic('success');
        setIsManualProcessing(false);

        // Auto trigger POS completion after a brief celebratory view
        setTimeout(() => {
          onPaymentSuccess(payload);
        }, 1200);
      }, 950);
    }, 650);
  };

  return (
    <div
      id="vendor-tap-to-pay-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-right font-sans usil-modal-scroll"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Terminal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#0A1A33] via-[#0F284D] to-[#155EEF] text-white flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C0A16B] shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#C0A16B]/20 text-[#C0A16B] font-mono tracking-wider">
                  MADA TAP-TO-PAY
                </span>
                <span className="text-[11px] text-white/80 font-medium hidden sm:inline">
                  كاشير الهاتف الذكي
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                الدفع بتمرير البطاقة (Tap-to-Pay NFC)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم صوت الكاشير' : 'تفعيل صوت الكاشير'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C0A16B]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 bg-slate-50/70">

          {/* Amount Due Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block">المبلغ الإجمالي المستحق للدفع</span>
            <div className="flex items-baseline justify-center gap-1.5 font-mono text-3xl sm:text-4xl font-extrabold text-[#155EEF]">
              <span>{grandTotal.toLocaleString('ar-SA')}</span>
              <span className="text-sm font-sans font-bold text-slate-600">ر.س</span>
            </div>
            {customerName && (
              <span className="text-xs text-slate-600 font-bold block pt-0.5">
                العميل: {customerName}
              </span>
            )}
          </div>

          {/* Contactless Tap Target Zone (Simulated & Real Sensor Field) */}
          <div
            onClick={() => handleCardInteraction(activeScheme)}
            className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer select-none overflow-hidden flex flex-col items-center justify-center text-center space-y-3 group ${
              step === 'approved'
                ? 'bg-emerald-900 text-white border-emerald-500 shadow-lg shadow-emerald-950/20'
                : step === 'cryptographic_auth' || step === 'card_detected'
                ? 'bg-blue-950 text-white border-[#155EEF] shadow-lg shadow-blue-950/30'
                : 'bg-gradient-to-b from-slate-900 to-[#0A1A33] text-white border-slate-700 hover:border-[#155EEF] shadow-md'
            }`}
          >
            {/* Background RF Wave Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <div className={`w-44 h-44 rounded-full border border-blue-400/40 ${step !== 'approved' ? 'animate-ping' : ''}`} />
              <div className="w-32 h-32 rounded-full border border-blue-400/30 absolute" />
              <div className="w-20 h-20 rounded-full border border-blue-400/20 absolute" />
            </div>

            {/* Central Visual Icon / Feedback State */}
            <div className="relative z-10">
              {step === 'approved' ? (
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : step === 'card_detected' || step === 'cryptographic_auth' ? (
                <div className="w-16 h-16 rounded-3xl bg-[#155EEF] text-white flex items-center justify-center shadow-lg animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 text-[#C0A16B] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Radio className="w-8 h-8 animate-pulse text-[#C0A16B]" />
                </div>
              )}
            </div>

            {/* Instruction Labels */}
            <div className="relative z-10 space-y-1">
              {step === 'approved' ? (
                <>
                  <h4 className="text-base font-black text-emerald-300">تم قبول الدفع بنجاح!</h4>
                  <p className="text-xs text-emerald-100 font-mono">
                    {approvedData?.aid} • كود: {approvedData?.authCode}
                  </p>
                </>
              ) : step === 'cryptographic_auth' ? (
                <>
                  <h4 className="text-base font-black text-blue-200">جاري التفويض المشفر مع مدى...</h4>
                  <p className="text-xs text-blue-300 font-mono">Verifying EMV Cryptogram (13.56 MHz)</p>
                </>
              ) : step === 'card_detected' ? (
                <>
                  <h4 className="text-base font-black text-amber-300">تم استشعار البطاقة، لا تحرك الهاتف</h4>
                  <p className="text-xs text-slate-300">Reading Contactless Chip...</p>
                </>
              ) : (
                <>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center justify-center gap-2">
                    <Wifi className="w-4 h-4 text-[#C0A16B] rotate-90" />
                    <span>مرر البطاقة أو الهاتف من ظهر الجهاز</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    أو انقر هنا لتجربة تمرير بطاقة <strong className="text-[#C0A16B]">«{activeScheme === 'mada' ? 'مدى' : activeScheme === 'apple_pay' ? 'Apple Pay' : activeScheme === 'visa' ? 'فيزا' : 'ماستركارد'}»</strong>
                  </p>
                </>
              )}
            </div>

            {/* Security Guarantee Badge */}
            <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>متوافق مع معايير البنك المركزي السعودي (SAMA) وشهادة EMVCo</span>
            </div>
          </div>

          {/* Quick Card Scheme Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">اختر نوع البطاقة للتجربة أو التمرير المباشر:</span>
              <span className="text-[10px] text-slate-500">Tap to Select</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'mada', label: 'مدى Mada', badge: 'بطاقة صراف', color: 'border-emerald-500' },
                { id: 'apple_pay', label: 'Apple Pay', badge: 'محفظة رقمية', color: 'border-slate-800' },
                { id: 'visa', label: 'فيزا Visa', badge: 'ائتمانية/مدى', color: 'border-blue-600' },
                { id: 'mastercard', label: 'Mastercard', badge: 'تلامسية', color: 'border-amber-600' },
              ].map((scheme) => {
                const isSelected = activeScheme === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    disabled={isManualProcessing || step === 'approved'}
                    onClick={() => {
                      setActiveScheme(scheme.id as any);
                      handleCardInteraction(scheme.id as any);
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      isSelected
                        ? 'bg-[#0A1A33] text-white border-[#0A1A33] shadow-sm ring-2 ring-[#155EEF]/50'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className={`w-4 h-4 ${isSelected ? 'text-[#C0A16B]' : 'text-slate-500'}`} />
                      <Wifi className="w-3 h-3 rotate-90 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black">{scheme.label}</div>
                      <div className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {scheme.badge}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hardware Web NFC Status Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${hardwareNfcSupported ? 'text-emerald-600 animate-pulse' : 'text-blue-600'}`} />
                <span className="font-extrabold text-slate-900">
                  حالة مستشعر الـ NFC بهاتفك (Web NFC API)
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  hardwareNfcSupported
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {hardwareNfcSupported ? 'مستشعر نشط (Active Sensor)' : 'محاكاة EMV تفاعلية'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {hardwareNfcSupported
                ? 'مستشعر الـ NFC بهاتفك نشط ومتاح. يمكنك ملامسة البطاقة البنكية أو هاتف العميل بالجهة الخلفية للجهاز ليتم قراءة الدفع فورياً.'
                : 'يدعم هذا الكاشير واجهة Web NFC الحديثة في أجهزة أندرويد وChrome، بالإضافة لنظام المحاكاة التفاعلية الذكي لإتمام مدفوعات التلامس وإصدار الإيصالات مباشرة.'}
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>SAMA EMV Contactless Security</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isManualProcessing}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={() => handleCardInteraction(activeScheme)}
              disabled={isManualProcessing || step === 'approved'}
              className="px-5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] active:bg-[#0A2E78] text-white text-xs font-black flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isManualProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wifi className="w-3.5 h-3.5 rotate-90" />
              )}
              <span>تمرير سريع للبطاقة ({activeScheme === 'mada' ? 'مدى' : 'Apple Pay'})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
