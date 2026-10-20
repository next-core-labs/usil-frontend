/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { isPublicMarketplaceListing } from './utils/catalogMedia';
import { ALL_CITIES_LABEL } from './data/saudiPlaces';
import {
  saveCartToStorage,
  loadCartFromStorage,
  clearDraftBookingForm,
} from './utils/storage';
import { ServiceItem, BookingItem } from './types';
import type { VendorOwnProfile } from './contracts/vendors/vendor-profile';
import { Navbar } from './components/Navbar';
import { Storefront } from './storefront/Storefront';
const QuickEventCalculator = lazy(() =>
  import('./components/QuickEventCalculator').then((m) => ({ default: m.QuickEventCalculator })),
);
import { RegionGate } from './components/RegionGate';
import { loadSelectedRegion, saveSelectedRegion } from './utils/regionPreference';
import { applySeo, applySeoFromPath, loadRemoteSeo } from './utils/seo';
import { parseLocation, pathForProduct, type SitePage } from './utils/siteRoutes';
const VendorRegisterWizard = lazy(() =>
  import('./components/auth/VendorRegisterWizard').then((m) => ({ default: m.VendorRegisterWizard })),
);
const CourierRegisterForm = lazy(() =>
  import('./components/auth/CourierRegisterForm').then((m) => ({ default: m.CourierRegisterForm })),
);
import { type SessionUser } from './LoginScreen';
import { DashboardErrorBoundary } from './components/AppErrorBoundary';
import { DashboardChunkFallback } from './components/ui/DashboardChunkFallback';
import { useToast } from './components/ui/Toast';
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
import { canFileExternalBooking, dashboardFor, isVendorSupervisor, roleLabelAr } from './contracts/auth/roles';
const VoiceAIAssistant = lazy(() =>
  import('./components/voice/VoiceAIAssistant').then((m) => ({ default: m.VoiceAIAssistant })),
);
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { useUnreadChats } from './components/chat/useChat';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { UserProfile } from './types';
import { fetchCatalogListings, fetchMyVendorFile } from './utils/vendorWorkspace';
import { openVendorConsole } from './utils/vendorConsole';
import { fetchTrending, type TrendingService } from './utils/trendingApi';
import { clearPendingPayment } from './utils/pendingPayment';

export default function App() {
  // The store, or the admin dashboard for staff. Vendors work in the vendor console (vendor.usil.app).
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');

  // Client storefront: region, routing, catalog status. Filters live inside <Storefront />.
  const [selectedCity, setSelectedCityState] = useState(() => loadSelectedRegion() || ALL_CITIES_LABEL);
  const [hasPickedRegion, setHasPickedRegion] = useState(() => Boolean(loadSelectedRegion()));
  const [regionPickerOpen, setRegionPickerOpen] = useState(() => !loadSelectedRegion());
  const [sitePage, setSitePage] = useState<SitePage>(
    () => parseLocation(window.location.pathname, window.location.hash).sitePage,
  );
  const [vendorPublicId, setVendorPublicId] = useState<string | null>(
    () => parseLocation(window.location.pathname, window.location.hash).vendorPublicId,
  );
  const [productId, setProductId] = useState<string | null>(
    () => parseLocation(window.location.pathname, window.location.hash).productId,
  );
  const [locationKey, setLocationKey] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>([]);
  const [showPaidBanner, setShowPaidBanner] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      if (key.toLowerCase() === 'paid' && value === '1') return true;
      if (key.toLowerCase() === 'status' && value.toLowerCase() === 'paid') return true;
    }
    return false;
  });

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isVendorRegisterOpen, setIsVendorRegisterOpen] = useState(false);
  const [isCourierRegisterOpen, setIsCourierRegisterOpen] = useState(false);
  const [courierModalTab, setCourierModalTab] = useState<'apply' | 'external'>('apply');
  const [isVoiceAIOpen, setIsVoiceAIOpen] = useState(false);

  // Service comparison: two products side by side, as in the design.
  const [comparedServices, setComparedServices] = useState<ServiceItem[]>([]);

  // Authenticated User Profile (Phone/OTP Verified)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const isClientAccount = currentUser?.role === 'client';
  const clientChatUnread = useUnreadChats(isClientAccount);
  const sessionToProfile = (user: SessionUser): UserProfile => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    verified: user.emailVerified !== false || isVendorSupervisor(user.role),
    emailVerified: user.emailVerified !== false || isVendorSupervisor(user.role),
    avatar: user.avatarUrl || user.avatar,
    avatarUrl: user.avatarUrl || user.avatar,
    loyaltyTier: roleLabelAr(user.role) || (user.role === 'vendor' ? 'حساب مورّد' : 'حساب عميل'),
    walletBalance: 0,
    rating: 5,
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let paid = false;
    let moyasarId = '';
    let status = '';
    for (const [key, value] of params.entries()) {
      const k = key.toLowerCase();
      if (k === 'paid' && value === '1') paid = true;
      if (k === 'status') status = value.toLowerCase();
      if (k === 'id') moyasarId = value.trim();
    }
    if (paid || status === 'paid') setShowPaidBanner(true);
    if (!moyasarId) return;
    void fetch('/api/payments/moyasar/callback', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: moyasarId }),
    })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          status?: string;
          transactionUrl?: string | null;
        };
        if (data.status === 'paid') setShowPaidBanner(true);
        const url = String(data.transactionUrl || '');
        if (data.status === 'initiated' && url) {
          try {
            const host = new URL(url).hostname.toLowerCase();
            if (host === 'moyasar.com' || host.endsWith('.moyasar.com')) {
              window.location.assign(url);
            }
          } catch {
            /* ignore junk hosts */
          }
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        const text = await r.text();
        if (!text || text.trimStart().startsWith('<')) return null;
        try {
          return JSON.parse(text) as { user?: SessionUser };
        } catch {
          return null;
        }
      })
      .then((d) => {
        if (!d?.user) return;
        setCurrentUser(sessionToProfile(d.user));
        void fetchMyVendorFile()
          .then((file) => {
            if (file.profile) setVendorOwnProfile(file.profile as VendorOwnProfile);
          })
          .catch(() => undefined);
      })
      .catch(() => {});
  }, []);

  // Cart / Bookings state
  const [cartItems, setCartItems] = useState<BookingItem[]>([]);

  const [vendorOwnProfile, setVendorOwnProfile] = useState<VendorOwnProfile | null>(null);

  const signOutFromStore = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* offline: still forget the session locally */
    }
    setCurrentUser(null);
    setViewMode('client');
    // A shared device must not hand the next person this user's cart, picks or contact details.
    setCartItems([]);
    setComparedServices([]);
    void clearDraftBookingForm();
    clearPendingPayment();
  };

  /** Apply a location to state. The storefront reads the query string itself. */
  const applyIntent = useCallback((pathname: string, hash: string) => {
    const intent = parseLocation(pathname, hash);
    setSitePage(intent.sitePage);
    setVendorPublicId(intent.vendorPublicId);
    setProductId(intent.productId);
    if (intent.courier) setIsCourierRegisterOpen(true);
    setLocationKey((k) => k + 1);
  }, []);

  /** SPA navigation for the storefront: push (or replace) the URL, then route. */
  const navigate = useCallback(
    (path: string, opts?: { replace?: boolean; scroll?: boolean }) => {
      const url = new URL(path, window.location.origin);
      const target = url.pathname + url.search + url.hash;
      const current = window.location.pathname + window.location.search + window.location.hash;
      if (target !== current) {
        if (opts?.replace) window.history.replaceState({}, '', target);
        else window.history.pushState({}, '', target);
      }
      applyIntent(url.pathname, url.hash);
      if (opts?.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [applyIntent],
  );

  const goHome = () => {
    setIsCourierRegisterOpen(false);
    navigate('/');
  };

  const setSelectedCity = (city: string) => {
    const next = String(city || '').trim() || ALL_CITIES_LABEL;
    const changed = next !== selectedCity || !hasPickedRegion;
    setSelectedCityState(next);
    saveSelectedRegion(next);
    setHasPickedRegion(true);
    setRegionPickerOpen(false);
    if (changed) {
      toast(
        next === ALL_CITIES_LABEL
          ? 'تم اختيار كل مناطق المملكة — السوق يعرض المورّدين في كل المناطق.'
          : `تم اختيار ${next} — السوق يعرض المورّدين اللي يغطون هذه المنطقة.`,
        'success',
      );
    }
  };

  useEffect(() => {
    const applyFromLocation = () => applyIntent(window.location.pathname, window.location.hash);
    applyFromLocation();
    window.addEventListener('popstate', applyFromLocation);
    window.addEventListener('hashchange', applyFromLocation);
    return () => {
      window.removeEventListener('popstate', applyFromLocation);
      window.removeEventListener('hashchange', applyFromLocation);
    };
  }, [applyIntent]);

  // The courier form is a modal over the storefront, but it owns `/courier`.
  useEffect(() => {
    const path = (window.location.pathname.replace(/\/$/, '') || '/').toLowerCase();
    if (isCourierRegisterOpen && path !== '/courier') {
      window.history.replaceState({}, '', '/courier');
      applySeo('courier');
    } else if (!isCourierRegisterOpen && !sitePage && path === '/courier') {
      window.history.replaceState({}, '', '/');
      applySeo('home');
    }
  }, [isCourierRegisterOpen, sitePage]);

  useEffect(() => {
    void loadRemoteSeo().then(() => applySeoFromPath());
  }, []);

  const loadCatalog = useCallback(() => {
    setCatalogStatus('loading');
    // The shelf is optional: when it fails the home page pads itself from the catalog.
    fetchTrending()
      .then(setTrendingServices)
      .catch(() => setTrendingServices([]));
    fetchCatalogListings()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setVendorCatalogServices((res.data as ServiceItem[]).filter(isPublicMarketplaceListing));
        }
        setCatalogStatus('ready');
      })
      .catch(() => {
        setCatalogStatus('error');
      });
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const [vendorCatalogServices, setVendorCatalogServices] = useState<ServiceItem[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  // 1. Initial load from localforage database on mount
  useEffect(() => {
    async function loadPersistedAppData() {
      try {
        const savedCart = await loadCartFromStorage();
        if (savedCart && Array.isArray(savedCart)) {
          setCartItems(savedCart);
        }
      } catch (err) {
        console.warn('Error hydrating state from localforage:', err);
      } finally {
        setIsStorageLoaded(true);
      }
    }

    loadPersistedAppData();
  }, []);

  // 1b. A saved cart holds a snapshot of each product. Once the live catalog is in, swap in
  // the current listing (price, photos, minimum) and drop listings that are gone — otherwise
  // the server's re-pricing answers 409 on every checkout and a refresh can't fix it.
  useEffect(() => {
    if (!isStorageLoaded || catalogStatus !== 'ready') return;
    const live = new Map(vendorCatalogServices.map((service) => [String(service.id), service]));
    setCartItems((prev) => {
      let changed = false;
      const next: BookingItem[] = [];
      for (const row of prev) {
        const fresh = live.get(String(row.service.id));
        if (!fresh) {
          changed = true;
          continue;
        }
        const quantity = Math.max(row.quantity, fresh.minQuantity || 1);
        if (fresh !== row.service || quantity !== row.quantity) changed = true;
        next.push({ ...row, service: fresh, quantity });
      }
      return changed ? next : prev;
    });
  }, [vendorCatalogServices, catalogStatus, isStorageLoaded]);

  // 2. Auto-save cart items to localforage whenever cart updates
  useEffect(() => {
    if (!isStorageLoaded) return;
    void saveCartToStorage(cartItems);
  }, [cartItems, isStorageLoaded]);

  /** Vendors (and staff supervising one) work in the vendor console, a separate site. */
  const goToVendorConsole = (vendorId?: string) =>
    openVendorConsole(vendorId ? { vendorId } : currentUser?.email ? { email: currentUser.email } : undefined);

  // Add or update items in client cart
  const handleAddToCart = (
    service: ServiceItem,
    quantity = service.minQuantity || 1,
    date = '',
    time = '18:00',
    city = 'الرياض',
    notes = ''
  ) => {
    if (!isPublicMarketplaceListing(service)) return;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.service.id === service.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + Math.max(1, quantity),
          date: date || updated[existingIndex].date,
          time: time || updated[existingIndex].time,
        };
        return updated;
      }
      return [
        ...prev,
        {
          service,
          quantity,
          date,
          time,
          city,
          customNotes: notes,
        },
      ];
    });
  };

  const handleUpdateQuantity = (serviceId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.service.id === serviceId) {
            // Never below the vendor's minimum: stepping down from it removes the line instead.
            const min = Math.max(1, item.service.minQuantity || 1);
            const newQty = item.quantity + delta;
            if (newQty < min) return delta < 0 && item.quantity <= min ? null : { ...item, quantity: min };
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as BookingItem[]
    );
  };

  const handleRemoveItem = (serviceId: string) => {
    setCartItems((prev) => prev.filter((item) => item.service.id !== serviceId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Filter and Sort Services for Client View
  const marketplaceServices = useMemo(
    () => vendorCatalogServices.filter(isPublicMarketplaceListing),
    [vendorCatalogServices],
  );

  const openDashboard =
    currentUser && dashboardFor(currentUser.role) !== 'client'
      ? () => (dashboardFor(currentUser.role) === 'vendor' ? goToVendorConsole() : setViewMode('admin'))
      : undefined;

  const handleAuthSuccess = (user: SessionUser) => {
    setCurrentUser(sessionToProfile(user));
    void fetchMyVendorFile()
      .then((file) => {
        if (file.profile) setVendorOwnProfile(file.profile as VendorOwnProfile);
      })
      .catch(() => undefined);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-paper text-ink">
      {viewMode === 'client' && (sitePage === null || sitePage === 'catalog') ? (
        <RegionGate
          open={regionPickerOpen}
          required={!hasPickedRegion}
          selected={selectedCity}
          onSelect={setSelectedCity}
          onClose={() => {
            if (hasPickedRegion) setRegionPickerOpen(false);
          }}
        />
      ) : viewMode === 'client' && regionPickerOpen && hasPickedRegion ? (
        <RegionGate open selected={selectedCity} onSelect={setSelectedCity} onClose={() => setRegionPickerOpen(false)} />
      ) : null}

      {/* The admin dashboard keeps the operations app bar; the storefront draws its own header. */}
      {viewMode === 'admin' ? (
        <Navbar
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          onOpenRegionPicker={() => setRegionPickerOpen(true)}
          searchQuery=""
          onSearchChange={() => undefined}
          onGoHome={() => {
            setViewMode('client');
            goHome();
          }}
          cartCount={cartCount}
          onOpenCart={() => {
            setViewMode('client');
            navigate('/cart');
          }}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode('client')}
          onOpenVendorHub={() => goToVendorConsole()}
          currentUser={currentUser}
          onOpenAuth={(mode = 'login') => {
            setViewMode('client');
            navigate(mode === 'register' ? '/login?mode=register' : '/login');
          }}
          onOpenVoiceAI={() => setIsVoiceAIOpen(true)}
          onLogout={signOutFromStore}
          onOpenSupport={() => {
            setViewMode('client');
            navigate('/support');
          }}
        />
      ) : null}

      {currentUser?.role === 'courier' ? (
        <div className="bg-navy text-white px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium">
            جاك حجز بره المنصة؟ سجّل بيانات اللي حجز معك عشان يوصل توثّقه لك.
          </p>
          <button
            type="button"
            onClick={() => {
              setCourierModalTab('external');
              setIsCourierRegisterOpen(true);
            }}
            className="min-h-10 px-3 rounded-lg bg-action text-white text-xs font-medium"
          >
            تسجيل حجز خارجي
          </button>
        </div>
      ) : null}

      {showPaidBanner && viewMode === 'client' ? (
        <div className="sticky top-0 z-40 bg-success-bg border-b border-success-border text-success px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium">
            وصلتنا عملية الدفع عبر ميسر. تقدر تتابع حالة طلبك من «طلباتي».
          </p>
          <button
            type="button"
            onClick={() => {
              setShowPaidBanner(false);
              const url = new URL(window.location.href);
              url.searchParams.delete('paid');
              url.searchParams.delete('id');
              url.searchParams.delete('status');
              window.history.replaceState({}, '', url.pathname + url.search + url.hash);
            }}
            className="min-h-10 px-3 rounded-lg bg-success text-white text-xs font-medium"
          >
            إغلاق
          </button>
        </div>
      ) : null}

      {/* Main Mode View */}
      {viewMode === 'admin' ? (
        <DashboardErrorBoundary onReset={() => setViewMode('client')}>
          <Suspense fallback={<DashboardChunkFallback label="جارٍ فتح لوحة الإدارة…" />}>
            <AdminDashboard currentUser={currentUser} onOpenVendorHub={() => goToVendorConsole()} />
          </Suspense>
        </DashboardErrorBoundary>
      ) : (
        <Storefront
          sitePage={sitePage}
          productId={productId}
          vendorPublicId={vendorPublicId}
          locationKey={locationKey}
          navigate={navigate}
          services={marketplaceServices}
          catalogStatus={catalogStatus}
          retryCatalog={loadCatalog}
          trending={trendingServices}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          openRegionPicker={() => setRegionPickerOpen(true)}
          cart={cartItems}
          cartReady={isStorageLoaded}
          addToCart={handleAddToCart}
          updateQuantity={handleUpdateQuantity}
          removeFromCart={handleRemoveItem}
          clearCart={handleClearCart}
          compared={comparedServices}
          setCompared={setComparedServices}
          user={currentUser}
          chatUnread={clientChatUnread}
          onAuthSuccess={handleAuthSuccess}
          logout={signOutFromStore}
          openDashboard={openDashboard}
          openVoiceAI={() => setIsVoiceAIOpen(true)}
          openVendorRegister={() => setIsVendorRegisterOpen(true)}
          openCourierRegister={() => {
            setCourierModalTab('apply');
            setIsCourierRegisterOpen(true);
          }}
          vendorOwnProfile={vendorOwnProfile}
        />
      )}

      {/* Event Quote Calculator Modal (reached from the voice assistant) */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 usil-modal-scroll">
          <div
            className="fixed inset-0 bg-navy/60 backdrop-blur-xs"
            onClick={() => setIsCalculatorOpen(false)}
          />
          <div className="relative w-full max-w-4xl z-10 my-auto">
            <Suspense fallback={null}>
            <QuickEventCalculator
              services={marketplaceServices}
              onClose={() => setIsCalculatorOpen(false)}
            />
            </Suspense>
          </div>
        </div>
      )}

      {/* PWA Mobile Add to Home Screen Prompt & iOS Instructions */}
      <PWAInstallBanner />

      {/* The admin dashboard keeps the operations bottom bar on phones. */}
      {viewMode === 'admin' ? (
      <MobileBottomNav
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode('client')}
        onOpenVendorHub={() => goToVendorConsole()}
        cartCount={cartCount}
        onOpenCart={() => {
          setViewMode('client');
          navigate('/cart');
        }}
        onOpenVoiceAI={() => setIsVoiceAIOpen(true)}
        onOpenTracker={() => {
          setViewMode('client');
          navigate('/orders');
        }}
        onGoHome={() => {
          setViewMode('client');
          goHome();
        }}
        onOpenAuth={() => {
          setViewMode('client');
          navigate(currentUser ? '/account' : '/login');
        }}
        currentUser={currentUser}
        accountBadge={clientChatUnread}
      />
      ) : null}

      {isVendorRegisterOpen ? (
        <Suspense fallback={null}>
        <VendorRegisterWizard
          account={currentUser && currentUser.role === 'client' ? currentUser : null}
          onClose={() => setIsVendorRegisterOpen(false)}
          onLoggedIn={(user) => handleAuthSuccess(user)}
          onOpenCourierRegister={() => {
            setIsVendorRegisterOpen(false);
            setIsCourierRegisterOpen(true);
          }}
        />
        </Suspense>
      ) : null}

      {isCourierRegisterOpen ? (
        <Suspense fallback={null}>
        <CourierRegisterForm
          onClose={() => {
            setIsCourierRegisterOpen(false);
            setCourierModalTab('apply');
          }}
          canFileExternal={canFileExternalBooking(currentUser?.role)}
          defaultTab={courierModalTab}
        />
        </Suspense>
      ) : null}

      {/* Interactive Human-like Voice AI Assistant */}
      {isVoiceAIOpen ? (
        <Suspense fallback={null}>
          <VoiceAIAssistant
          isOpen={isVoiceAIOpen}
          onClose={() => setIsVoiceAIOpen(false)}
          onAddToCart={(srv) => {
            handleAddToCart(srv);
            setIsVoiceAIOpen(false);
            navigate('/cart');
          }}
          onOpenServiceDetails={(srv) => {
            setIsVoiceAIOpen(false);
            navigate(pathForProduct(srv.id));
          }}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          currentCity={selectedCity}
          services={marketplaceServices}
        />
        </Suspense>
      ) : null}
    </div>
  );
}
