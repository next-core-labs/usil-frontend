import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { InventoryItem, VendorBrandSettings } from '../../types';
import {
  Camera,
  X,
  Flashlight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Check,
  Search,
  ShoppingCart,
  QrCode,
  Zap,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  brandSettings: VendorBrandSettings;
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  onOpenAddItemWithBarcode?: (scannedBarcode: string) => void;
  onOpenRestockExpense?: (item: InventoryItem, suggestedQty: number) => void;
}

// Audio beep generator using Web Audio API
function playScanBeep(success: boolean = true) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  inventoryItems,
  brandSettings,
  onUpdateItemStock,
  onOpenAddItemWithBarcode,
  onOpenRestockExpense,
}) => {
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [continuousMode, setContinuousMode] = useState(true);
  const [manualInputCode, setManualInputCode] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-barcode-reader';
  const lastScannedTimeRef = useRef<number>(0);

  // Trigger feedback toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Lookup item by barcode or id
  const findItemByBarcode = useCallback((code: string) => {
    const cleanCode = code.trim().toLowerCase();
    return (
      inventoryItems.find(
        (item) =>
          (item.barcode && item.barcode.trim().toLowerCase() === cleanCode) ||
          item.id.toLowerCase() === cleanCode ||
          item.nameAr.toLowerCase().includes(cleanCode)
      ) || null
    );
  }, [inventoryItems]);

  // Handle successful scan
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Debounce repetitive scans of same code within 1.5 seconds unless in single-scan
      if (scannedCode === decodedText && now - lastScannedTimeRef.current < 1500) {
        return;
      }
      lastScannedTimeRef.current = now;

      setScannedCode(decodedText);
      const found = findItemByBarcode(decodedText);
      setMatchedItem(found);

      if (soundEnabled) {
        playScanBeep(!!found);
      }

      // Haptic feedback if supported on mobile
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(found ? [50, 50, 100] : [150, 100, 150]);
        } catch {
          // Ignore
        }
      }

      if (found) {
        showToast(`تم مسح: ${found.nameAr} | الرصيد الحالي: ${found.currentStock} ${found.unit}`);
      } else {
        showToast(`تمت قراءة الرمز: ${decodedText} (غير مسجل بالمستودع)`);
      }
    },
    [findItemByBarcode, scannedCode, soundEnabled, showToast]
  );

  // Initialize and start scanner
  const startScanner = useCallback(async (cameraId?: string) => {
    try {
      setCameraError(null);
      setScannerReady(false);

      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }

      // Check camera list
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز. يمكنك إدخال الباركود يدوياً أو اختيار بند تجريبي أدناه.');
        return;
      }

      setAvailableCameras(devices.map((d) => ({ id: d.id, label: d.label || `كاميرا ${d.id.substring(0, 5)}` })));

      const targetCamera = cameraId || (devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))?.id || devices[0].id);
      setSelectedCameraId(targetCamera);

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.75);
          return {
            width: Math.max(220, qrboxSize),
            height: Math.max(140, Math.floor(qrboxSize * 0.65)), // barcode horizontal rectangle
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        targetCamera,
        config,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // Frame rejected (normal)
        }
      );

      setIsScanning(true);
      setScannerReady(true);

      // Check torch capabilities
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.warn('Camera initiation failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        setCameraError('تم رفض إذن الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا في نافذة المعاينة الحالية. يمكنك استخدام البحث أو إدخال الباركود يدوياً أدناه.');
      }
      setIsScanning(false);
    }
  }, [handleDecodedText]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Lifecycle
  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM container to mount
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
      setScannedCode(null);
      setMatchedItem(null);
    }
  }, [isOpen, startScanner, stopScanner]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning) return;
    try {
      const nextTorch = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
      showToast('خاصية الفلاش غير مدعومة في هذه الكاميرا');
    }
  };

  // Switch camera
  const handleSwitchCamera = (newCamId: string) => {
    setSelectedCameraId(newCamId);
    startScanner(newCamId);
  };

  // Update Stock in real-time
  const handleApplyStockChange = (delta: number) => {
    if (!matchedItem) return;
    const current = matchedItem.currentStock;
    const nextVal = Math.max(0, current + delta);
    onUpdateItemStock(matchedItem.id, nextVal);
    
    // Update local state for immediate visual feedback
    const updated = { ...matchedItem, currentStock: nextVal };
    setMatchedItem(updated);
    
    if (delta > 0) {
      showToast(`تمت إضافة (+${delta}) لـ ${matchedItem.nameAr}. الرصيد الجديد: ${nextVal} ${matchedItem.unit}`);
    } else {
      showToast(`تم صرف (${delta}) من ${matchedItem.nameAr}. الرصيد المتبقي: ${nextVal} ${matchedItem.unit}`);
    }

    if (soundEnabled) {
      playScanBeep(true);
    }
  };

  // Set absolute stock value
  const handleSetExactStock = (exactVal: number) => {
    if (!matchedItem) return;
    const bounded = Math.max(0, exactVal);
    onUpdateItemStock(matchedItem.id, bounded);
    setMatchedItem({ ...matchedItem, currentStock: bounded });
    showToast(`تم تعديل رصيد ${matchedItem.nameAr} إلى ${bounded} ${matchedItem.unit}`);
    if (soundEnabled) playScanBeep(true);
  };

  // Manual code submission
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputCode.trim()) return;
    handleDecodedText(manualInputCode.trim());
    setManualInputCode('');
  };

  // Select demo barcode for testing without camera
  const handleSelectDemoBarcode = (item: InventoryItem) => {
    if (item.barcode) {
      handleDecodedText(item.barcode);
    } else {
      handleDecodedText(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0A1A33] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#155EEF]/20 text-[#155EEF] border border-[#155EEF]/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  قارئ الباركود ومحدث المخزون بالكاميرا
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مباشر
                </span>
              </div>
              <p className="text-xs text-slate-400">
                وجّه الكاميرا نحو باركود الصنف لتحديث الرصيد والصرف الفوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-500 border-slate-700'
              }`}
              title={soundEnabled ? 'صوت التنبيه مفعل' : 'صوت التنبيه مكتوم'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Notification Toast inside Scanner */}
        {toastMessage && (
          <div className="bg-[#155EEF] text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Camera Viewfinder Area */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video sm:aspect-[16/10] flex items-center justify-center shadow-inner">
            
            {/* The html5-qrcode video container */}
            <div
              id={scannerContainerId}
              className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            />

            {/* Custom Overlay Framing & Laser Line */}
            {isScanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Viewfinder Target Frame */}
                <div className="w-64 sm:w-80 h-36 sm:h-44 border-2 border-[#155EEF]/80 rounded-2xl relative shadow-[0_0_20px_rgba(21,94,239,0.3)] backdrop-brightness-110">
                  
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#C0A16B] rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#C0A16B] rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#C0A16B] rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#C0A16B] rounded-br-lg" />

                  {/* Animated Scanning Laser Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-[scanLaser_2s_ease-in-out_infinite] shadow-[0_0_10px_#f43f5e]" />

                  {/* Scanner Hint */}
                  <div className="absolute bottom-2 inset-x-0 text-center">
                    <span className="text-[10px] font-mono text-slate-300/80 bg-slate-950/70 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      ضع الباركود داخل الإطار
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Bar over Camera (Torch, Camera Switch, Refresh) */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      torchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/30'
                        : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}</span>
                  </button>
                )}

                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleSwitchCamera(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-medium border border-slate-700 backdrop-blur-md focus:outline-hidden"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={() => startScanner(selectedCameraId)}
                className="p-1.5 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md cursor-pointer"
                title="إعادة تشغيل الكاميرا"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Fallback Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-sm font-bold text-white">تنبيه الكاميرا</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                </div>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-4 py-2 rounded-xl bg-[#155EEF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة محاولة الاتصال بالكاميرا</span>
                </button>
              </div>
            )}
          </div>

          {/* Scanned Result / Match Details Card */}
          {matchedItem ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-emerald-500/40 shadow-lg space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      تمت مطابقة الباركود ({scannedCode})
                    </span>
                    {matchedItem.location && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        📍 {matchedItem.location}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-white">{matchedItem.nameAr}</h4>
                  {matchedItem.nameEn && (
                    <p className="text-xs font-mono text-slate-400">{matchedItem.nameEn}</p>
                  )}
                </div>

                {/* Stock Badge */}
                <div className="text-left bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] font-bold text-slate-400 block">الرصيد الفعلي الحالي</span>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {matchedItem.currentStock}{' '}
                    <span className="text-xs font-medium text-slate-400">{matchedItem.unit}</span>
                  </span>
                </div>
              </div>

              {/* Instant Stock Adjustment Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">تحديث الرصيد الفوري:</span>
                  <span className="text-[11px] text-slate-400">
                    الأمان: {matchedItem.minStockThreshold} {matchedItem.unit} | التكلفة: {matchedItem.unitCost} ر.س
                  </span>
                </div>

                {/* Quick Increment/Decrement Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* +1 Quick */}
                  <button
                    id="btn-stock-plus-1"
                    onClick={() => handleApplyStockChange(1)}
                    className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة (+1 {matchedItem.unit})</span>
                  </button>

                  {/* +10 / +50 Bulk */}
                  <button
                    id="btn-stock-plus-10"
                    onClick={() => handleApplyStockChange(matchedItem.unit === 'كوب' ? 50 : 10)}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-102"
                  >
                    <Plus className="w-4 h-4" />
                    <span>توريد (+{matchedItem.unit === 'كوب' ? 50 : 10})</span>
                  </button>

                  {/* -1 Quick Deduct */}
                  <button
                    id="btn-stock-minus-1"
                    onClick={() => handleApplyStockChange(-1)}
                    className="p-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                  >
                    <Minus className="w-4 h-4" />
                    <span>صرف (-1 {matchedItem.unit})</span>
                  </button>

                  {/* -10 Bulk Deduct */}
                  <button
                    id="btn-stock-minus-10"
                    onClick={() => handleApplyStockChange(matchedItem.unit === 'كوب' ? -50 : -10)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-102"
                  >
                    <Minus className="w-4 h-4" />
                    <span>صرف لفعالية (-{matchedItem.unit === 'كوب' ? 50 : 10})</span>
                  </button>
                </div>

                {/* Custom Exact Override */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                      placeholder="كمية مخصصة..."
                      className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-[#155EEF]"
                    />
                  </div>

                  <button
                    onClick={() => handleApplyStockChange(adjustmentAmount)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    + إضافة الكمية
                  </button>

                  <button
                    onClick={() => handleApplyStockChange(-adjustmentAmount)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    - صرف الكمية
                  </button>

                  <button
                    onClick={() => handleSetExactStock(adjustmentAmount)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold cursor-pointer transition-colors"
                    title="ضبط الرصيد تماماً لهذه القيمة"
                  >
                    تعيين كرصيد حالي
                  </button>
                </div>
              </div>

              {/* Bottom Quick Expense Trigger */}
              {onOpenRestockExpense && (
                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    هل اشتريت دفعة جديدة من المورد؟
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRestockExpense(matchedItem, 50);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#C0A16B] hover:bg-[#b0915b] text-slate-950 font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>تسجيل فاتورة شراء وقيد مصروف P&L</span>
                  </button>
                </div>
              )}
            </div>
          ) : scannedCode ? (
            /* Scanned Code NOT in Inventory */
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-amber-500/40 shadow-lg space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    باركود جديد غير مسجل في المستودع: <span className="font-mono text-amber-300">{scannedCode}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    لم يتم العثور على صنف مطابق لهذا الرمز. يمكنك تسجيله كبند مخزون جديد الآن.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => {
                    if (onOpenAddItemWithBarcode) {
                      onClose();
                      onOpenAddItemWithBarcode(scannedCode);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#155EEF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة صنف جديد بهذا الباركود</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Manual Barcode Input Box (Quick search / typing) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#155EEF]" />
                أو أدخل رقم الباركود / اسم الصنف يدوياً:
              </span>
            </div>

            <form onSubmit={handleManualCodeSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={manualInputCode}
                onChange={(e) => setManualInputCode(e.target.value)}
                placeholder="e.g. 628100234501 أو أكواب"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-hidden focus:border-[#155EEF]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 cursor-pointer"
              >
                بحث ومطابقة
              </button>
            </form>

            {/* Quick Demo Barcodes for testing inside web preview */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] text-slate-500 block">
                نماذج باركود تجريبية للفحص السريع:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {inventoryItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDemoBarcode(item)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-mono cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3 text-[#C0A16B]" />
                    <span>{item.nameAr.split(' ')[0]} ({item.barcode || item.id})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>نظام الجرد المتزامن مع المخزن وقائمة الدخل</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            إغلاق القارئ
          </button>
        </div>

      </div>
    </div>
  );
};
