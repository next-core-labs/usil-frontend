import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, Check } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      setIsInstalled(true);
      return;
    }
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before in this session
    const isDismissed = sessionStorage.getItem('usil_pwa_dismissed');
    if (isDismissed) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // Show for iOS after 3 seconds
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Capture standard PWA install prompt for Android/Chrome/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('usil_pwa_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating Modern PWA Install Banner */}
      <aside 
        aria-label="تثبيت تطبيق يوصل"
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] md:top-3 md:bottom-auto left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-30 bg-navy text-white p-3.5 rounded-2xl shadow-2xl border border-sand/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-action to-[#2E90FA] p-0.5 flex-shrink-0 shadow-md">
            <img 
              src="/icons/icon-192.png" 
              alt="يوصل" 
              className="w-full h-full object-cover rounded-[10px]"
              onError={(e) => {
                // Fallback to SVG if png not loaded
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-white">تطبيق يوصل · Usil</span>
              <span className="px-1.5 py-0.5 text-2xs font-medium bg-sand/20 text-sand rounded-full border border-sand/30">
                PWA للجوال
              </span>
            </div>
            <p className="text-2xs text-slate-300 truncate mt-0.5">
              ثبّت التطبيق على شاشة جوالك لتصفح أسرع وإشعارات الحجوزات
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-gradient-to-r from-action to-[#2E90FA] text-white text-xs font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="إغلاق" aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Step-by-Step Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 usil-safe-bottom">
          <div className="bg-navy border border-slate-700 w-full max-w-sm rounded-3xl p-5 text-white shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sand" />
                <h3 className="font-bold text-sm">تثبيت التطبيق على آيفون (iOS)</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 py-4 text-xs text-slate-200">
              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-action text-white font-medium flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-bold">اضغط على زر المشاركة (Share)</p>
                  <p className="text-2xs text-slate-400 mt-0.5">موجود في أسفل متصفح Safari <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /></p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-action text-white font-medium flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-bold">اختر "إضافة إلى الصفحة الرئيسية"</p>
                  <p className="text-2xs text-slate-400 mt-0.5">مرر للأسفل واضغط <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> "Add to Home Screen"</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-action text-white font-medium flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-bold">اضغط "إضافة (Add)" في الأعلى</p>
                  <p className="text-2xs text-slate-400 mt-0.5">سيظهر تطبيق يوصل مباشرة بين تطبيقات هاتفك!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-white text-navy font-medium text-xs rounded-xl hover:bg-slate-100 transition-colors"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
