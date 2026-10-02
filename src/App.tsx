/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { isPublicMarketplaceListing } from './utils/catalogMedia';
import { ALL_CITIES_LABEL } from './data/saudiPlaces';
import {
  saveCartToStorage,
  loadCartFromStorage,
  saveBookingsToStorage,
  saveOrderTrackingsToStorage,
  loadOrderTrackingsFromStorage,
  saveInventoryToStorage,
} from './utils/storage';
import {
  ServiceItem,
  BookingItem,
  VendorBooking,
  BlockedDate,
  WhatsAppThread,
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
} from './types';
import type { VendorListing } from './contracts/vendors/vendor-listings';
import type { VendorOwnProfile } from './contracts/vendors/vendor-profile';
import {
  DEFAULT_VENDOR_BRAND_SETTINGS,
} from './data/vendorData';
import { Navbar } from './components/Navbar';
import { Storefront } from './storefront/Storefront';
const QuickEventCalculator = lazy(() =>
  import('./components/QuickEventCalculator').then((m) => ({ default: m.QuickEventCalculator })),
);
import { RegionGate } from './components/RegionGate';
import { loadSelectedRegion, saveSelectedRegion } from './utils/regionPreference';
import { applySeo, applySeoFromPath, loadRemoteSeo } from './utils/seo';
import { parseLocation, pathForProduct, type SitePage } from './utils/siteRoutes';
const VendorHub = lazy(() =>
  import('./components/vendor/VendorHub').then((m) => ({ default: m.VendorHub })),
);
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
import { VendorHubPicker } from './components/admin/VendorHubPicker';
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
import { canFileExternalBooking, canUseVendorHub, dashboardFor, isVendorSupervisor, roleLabelAr } from './contracts/auth/roles';
import { pickDefaultVendorHub, type VendorHubRow } from './contracts/vendors/vendor-hubs';
const VoiceAIAssistant = lazy(() =>
  import('./components/voice/VoiceAIAssistant').then((m) => ({ default: m.VoiceAIAssistant })),
);
const CrewFieldPortalModal = lazy(() =>
  import('./components/crew/CrewFieldPortalModal').then((m) => ({ default: m.CrewFieldPortalModal })),
);
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { useUnreadChats } from './components/chat/useChat';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';
import {
  fetchVendorWorkspace,
  saveVendorWorkspace,
  createVendorBooking,
  createBlockedDate,
  deleteBlockedDate,
  workspaceFromServer,
  fetchCatalogListings,
  createVendorListing,
  updateVendorListing,
  deleteVendorListing,
  fetchVendorHubs,
  fetchMyVendorFile,
} from './utils/vendorWorkspace';
import { fetchTrending, type TrendingService } from './utils/trendingApi';

export default function App() {
  // Mode View State: 'client' (Marketplace) or 'vendor' (Vendor Operating System Hub)
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'client' | 'vendor' | 'admin'>('client');

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
  const [isCrewPortalOpen, setIsCrewPortalOpen] = useState(false);

  // Service comparison: two products side by side, as in the design.
  const [comparedServices, setComparedServices] = useState<ServiceItem[]>([]);

  // Authenticated User Profile (Phone/OTP Verified)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [supervisingVendor, setSupervisingVendor] = useState<VendorHubRow | null>(null);
  const isClientAccount = currentUser?.role === 'client';
  const clientChatUnread = useUnreadChats(isClientAccount);
  const [vendorPickerOpen, setVendorPickerOpen] = useState(false);
  const [vendorHubs, setVendorHubs] = useState<VendorHubRow[]>([]);
  const [vendorHubsError, setVendorHubsError] = useState<string | null>(null);
  const [vendorHubsLoading, setVendorHubsLoading] = useState(false);

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
            if (file.profile) {
              setVendorOwnProfile(file.profile as VendorOwnProfile);
              setBrandSettings((prev) => ({
                ...prev,
                brandName: file.profile.projectName || prev.brandName,
                phone: file.profile.phone || prev.phone,
                email: file.profile.email || prev.email,
                logoUrl: file.profile.logoUrl || prev.logoUrl,
                fulfillment: file.profile.fulfillment || prev.fulfillment,
              }));
            }
          })
          .catch(() => undefined);
      })
      .catch(() => {});
  }, []);

  // Cart / Bookings state
  const [cartItems, setCartItems] = useState<BookingItem[]>([]);

  // Vendor OS Central Data States
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  // Legacy simulated chat threads; still read by the backup export and widget grid.
  const [whatsappThreads] = useState<WhatsAppThread[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [payouts, setPayouts] = useState<FinancialPayout[]>([]);

  // New Vendor White-Label, POS, Tracking & Accounting States
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [posSales, setPosSales] = useState<POSSaleRecord[]>([]);
  const [brandSettings, setBrandSettings] = useState<VendorBrandSettings>(DEFAULT_VENDOR_BRAND_SETTINGS);
  const [orderTrackings, setOrderTrackings] = useState<ClientOrderTracking[]>([]);
  const [vendorOwnProfile, setVendorOwnProfile] = useState<VendorOwnProfile | null>(null);

  const signOutFromStore = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
    setSupervisingVendor(null);
    setViewMode('client');
    try {
      sessionStorage.removeItem('usil_supervise_vendor');
    } catch {
      /* ignore */
    }
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

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [receivables, setReceivables] = useState<ReceivableDebt[]>([]);
  const [crewPayroll, setCrewPayroll] = useState<CrewPayrollEntry[]>([]);
  const [consolidatedVouchers, setConsolidatedVouchers] = useState<ConsolidatedCrewPaymentVoucher[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [vendorContracts, setVendorContracts] = useState<SmartServiceContract[]>([]);
  const [vendorListings, setVendorListings] = useState<VendorListing[]>([]);
  const [vendorCatalogServices, setVendorCatalogServices] = useState<ServiceItem[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [autoSaveNotification, setAutoSaveNotification] = useState<{ message: string; timestamp: number } | null>(null);
  const [vendorSync, setVendorSync] = useState<'idle' | 'loading' | 'synced' | 'error'>('idle');
  const vendorReadyRef = useRef(false);
  const vendorStateRef = useRef({
    bookings: vendorBookings,
    blockedDates,
    inventoryItems,
    contracts: vendorContracts,
    listings: vendorListings,
  });
  vendorStateRef.current = {
    bookings: vendorBookings,
    blockedDates,
    inventoryItems,
    contracts: vendorContracts,
    listings: vendorListings,
  };

  // Helper to show transient auto-save notification
  const triggerAutoSaveToast = (msg: string) => {
    setAutoSaveNotification({ message: msg, timestamp: Date.now() });
  };

  // Auto-dismiss notification after 2.8s
  useEffect(() => {
    if (!autoSaveNotification) return;
    const timer = setTimeout(() => {
      setAutoSaveNotification(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [autoSaveNotification]);

  // 1. Initial load from localforage database on mount
  useEffect(() => {
    async function loadPersistedAppData() {
      try {
        const [savedCart, savedTrackings] = await Promise.all([
          loadCartFromStorage(),
          loadOrderTrackingsFromStorage(),
        ]);

        if (savedCart && Array.isArray(savedCart)) {
          setCartItems(savedCart);
        }
        if (savedTrackings && Array.isArray(savedTrackings) && savedTrackings.length > 0) {
          setOrderTrackings(savedTrackings);
        }
      } catch (err) {
        console.warn('Error hydrating state from localforage:', err);
      } finally {
        setIsStorageLoaded(true);
      }
    }

    loadPersistedAppData();
  }, []);

  // 2. Auto-save cart items to localforage whenever cart updates
  useEffect(() => {
    if (!isStorageLoaded) return;
    saveCartToStorage(cartItems).then(() => {
      if (cartItems.length > 0) {
        triggerAutoSaveToast(`تم حفظ السلة (${cartItems.length} عناصر) تلقائياً في المتصفح`);
      }
    });
  }, [cartItems, isStorageLoaded]);

  // 3. Auto-save bookings to localforage whenever bookings update
  useEffect(() => {
    if (!isStorageLoaded) return;
    saveBookingsToStorage(vendorBookings);
  }, [vendorBookings, isStorageLoaded]);

  // 4. Auto-save order trackings to localforage whenever trackings update
  useEffect(() => {
    if (!isStorageLoaded) return;
    saveOrderTrackingsToStorage(orderTrackings);
  }, [orderTrackings, isStorageLoaded]);

  // 5. Auto-save inventory to localforage whenever inventory updates
  useEffect(() => {
    if (!isStorageLoaded) return;
    saveInventoryToStorage(inventoryItems);
  }, [inventoryItems, isStorageLoaded]);

  // 6. Hydrate vendor workspace from the server after login
  useEffect(() => {
    const canUseVendorApi = canUseVendorHub(currentUser?.role);
    if (!canUseVendorApi || !isStorageLoaded || viewMode !== 'vendor') {
      vendorReadyRef.current = false;
      if (viewMode !== 'vendor') setVendorSync('idle');
      return;
    }

    let cancelled = false;
    vendorReadyRef.current = false;
    setVendorSync('loading');

    const superviseId = isVendorSupervisor(currentUser?.role) ? supervisingVendor?.vendorId : undefined;

    fetchVendorWorkspace(superviseId)
      .then((res) => {
        if (cancelled) return;
        const next = workspaceFromServer(res.data || {});
        setVendorBookings(next.bookings as VendorBooking[]);
        setBlockedDates(next.blockedDates as BlockedDate[]);
        setInventoryItems(next.inventoryItems as InventoryItem[]);
        setVendorContracts(next.contracts as SmartServiceContract[]);
        setVendorListings(next.listings as VendorListing[]);
        const profile = (res.data as { profile?: VendorOwnProfile })?.profile;
        if (profile?.projectName) {
          setVendorOwnProfile((prev) => ({
            vendorId: supervisingVendor?.vendorId || currentUser?.id || prev?.vendorId || '',
            status: 'approved',
            projectName: profile.projectName,
            personName: profile.personName || currentUser?.name || '',
            projectType: profile.projectType || prev?.projectType || '',
            logoUrl: profile.logoUrl,
            email: profile.email || currentUser?.email || '',
            phone: profile.phone || currentUser?.phone || '',
            fulfillment: profile.fulfillment || [],
            listingCount: (next.listings as VendorListing[]).length,
            socials: prev?.socials,
          }));
          setBrandSettings((prev) => ({
            ...prev,
            brandName: profile.projectName || prev.brandName,
            phone: profile.phone || prev.phone,
            email: profile.email || prev.email,
            logoUrl: profile.logoUrl || prev.logoUrl,
          }));
        }
      })
      .then(() => {
        if (cancelled) return;
        vendorReadyRef.current = true;
        setVendorSync('synced');
        triggerAutoSaveToast('تم مزامنة مساحة المورّد مع السيرفر');
      })
      .catch(() => {
        if (cancelled) return;
        vendorReadyRef.current = false;
        setVendorSync('error');
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, isStorageLoaded, supervisingVendor?.vendorId, viewMode]);

  // 7. Persist vendor workspace to the server after local edits
  useEffect(() => {
    if (!vendorReadyRef.current) return;
    if (!canUseVendorHub(currentUser?.role)) return;
    const timer = setTimeout(() => {
      saveVendorWorkspace({
        bookings: vendorBookings,
        blockedDates,
        inventoryItems,
        contracts: vendorContracts,
        listings: vendorListings,
      }, isVendorSupervisor(currentUser?.role) ? supervisingVendor?.vendorId : undefined)
        .then(() => setVendorSync('synced'))
        .catch(() => setVendorSync('error'));
    }, 700);
    return () => clearTimeout(timer);
  }, [vendorBookings, blockedDates, inventoryItems, vendorContracts, vendorListings, currentUser, supervisingVendor?.vendorId]);

  const superviseId = isVendorSupervisor(currentUser?.role) ? supervisingVendor?.vendorId : undefined;

  const enterVendorHub = (hub: VendorHubRow) => {
    vendorReadyRef.current = false;
    setVendorSync('loading');
    setSupervisingVendor(hub);
    setVendorPickerOpen(false);
    setViewMode('vendor');
    try {
      sessionStorage.setItem('usil_supervise_vendor', JSON.stringify(hub));
    } catch {
      /* ignore */
    }
  };

  const loadVendorHubs = async (): Promise<VendorHubRow[]> => {
    setVendorHubsLoading(true);
    setVendorHubsError(null);
    try {
      const res = await fetchVendorHubs();
      const rows = Array.isArray(res.data) ? (res.data as VendorHubRow[]) : [];
      setVendorHubs(rows);
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تحميل حسابات الموردين.';
      setVendorHubsError(message);
      return [];
    } finally {
      setVendorHubsLoading(false);
    }
  };

  const openVendorHub = async (preferred?: VendorHubRow | null) => {
    if (!currentUser || !isVendorSupervisor(currentUser.role)) {
      if (!currentUser || currentUser.role === 'client') {
        navigate('/login');
        return;
      }
      setViewMode('vendor');
      return;
    }
    if (preferred) {
      enterVendorHub(preferred);
      return;
    }
    const rows = await loadVendorHubs();
    const own = pickDefaultVendorHub(rows, currentUser);
    if (own) {
      enterVendorHub(own);
      return;
    }
    setVendorPickerOpen(true);
  };

  const returnToAdmin = () => {
    setViewMode('admin');
    setVendorPickerOpen(false);
  };

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
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
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

  // Vendor OS Action Handlers
  const handleVendorAddBooking = (bookingData: Omit<VendorBooking, 'id' | 'bookingNumber' | 'createdAt'>) => {
    const newBooking: VendorBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingNumber: `MTH-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
    };
    setVendorBookings((prev) => [newBooking, ...prev]);
    // The server owns the id, number, remainder and validation (past or blocked
    // dates, foreign listings), so swap the optimistic row for its answer.
    createVendorBooking(newBooking as unknown as Record<string, unknown>, superviseId)
      .then((res) => {
        const saved = res.booking as Partial<VendorBooking> | undefined;
        if (!saved?.id) return;
        setVendorBookings((prev) => prev.map((row) => (row.id === newBooking.id ? { ...row, ...saved } as VendorBooking : row)));
      })
      .catch((error: Error) => {
        setVendorBookings((prev) => prev.filter((row) => row.id !== newBooking.id));
        triggerAutoSaveToast(error.message || 'تعذر إنشاء الحجز');
        setVendorSync('error');
      });
  };

  const handleAddBlockedDate = (date: string, reason: string, type: BlockedDate['type']) => {
    const newBlock: BlockedDate = {
      id: `blk-${Date.now()}`,
      date,
      reason,
      type,
    };
    setBlockedDates((prev) => [...prev, newBlock]);
    // The server assigns the id (and returns the existing row for a date that is already closed).
    createBlockedDate(newBlock as unknown as Record<string, unknown>, superviseId)
      .then((res) => {
        const saved = res.blockedDate as BlockedDate | undefined;
        if (!saved?.id) return;
        setBlockedDates((prev) => {
          const others = prev.filter((row) => row.id !== newBlock.id && row.id !== saved.id);
          return [...others, saved];
        });
      })
      .catch((error: Error) => {
        setBlockedDates((prev) => prev.filter((row) => row.id !== newBlock.id));
        triggerAutoSaveToast(error.message || 'تعذر إغلاق التاريخ');
        setVendorSync('error');
      });
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    deleteBlockedDate(id, superviseId).catch(() => {
      setVendorSync('error');
    });
  };

  const handleAddInvoice = (newInvoice: VendorInvoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const handleAddCrewMember = (newCrew: CrewMember) => {
    setCrewMembers((prev) => [...prev, newCrew]);
  };

  const handleUpdateCrewStatus = (crewId: string, newStatus: CrewMember['status']) => {
    setCrewMembers((prev) =>
      prev.map((c) => (c.id === crewId ? { ...c, status: newStatus } : c))
    );
  };

  const handleRequestPayout = (amount: number, iban: string) => {
    const newPayout: FinancialPayout = {
      id: `pay-${Date.now()}`,
      reference: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      amount,
      feeDeducted: 0,
      netAmount: amount,
      status: 'processing',
      date: new Date().toISOString().split('T')[0],
      requestedAt: new Date().toISOString().split('T')[0],
      description: 'طلب تحويل أرباح محفظة الضمان إلى الحساب البنكي',
      bankAccount: iban.slice(0, 4) + '••••' + iban.slice(-4),
      bankName: brandSettings.bankName || 'مصرف الراجحي',
      ibanMasked: iban.slice(0, 4) + '••••' + iban.slice(-4),
    };
    setPayouts((prev) => [newPayout, ...prev]);
  };

  const handleAddPOSSale = (sale: POSSaleRecord) => {
    setPosSales((prev) => [sale, ...prev]);
  };

  const handleUpdateBrandSettings = (newSettings: VendorBrandSettings) => {
    setBrandSettings(newSettings);
  };

  const handleUpdateTrackingStep = (trackingId: string, stepId: string, isCompleted: boolean) => {
    setOrderTrackings((prev) =>
      prev.map((trk) => {
        if (trk.id !== trackingId) return trk;
        const updatedTimeline = trk.timeline.map((step) => {
          if (step.id === stepId) {
            return {
              ...step,
              isCompleted,
              timestamp: isCompleted
                ? new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                : step.timestamp,
            };
          }
          return step;
        });
        return { ...trk, timeline: updatedTimeline };
      })
    );
  };

  // Accounting System Action Handlers
  const handleAddExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'voucherNumber'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      voucherNumber: `PV-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  /**
   * `depositPaid` is the running total collected against the debt, so a new
   * payment adds to it and the remainder is re-derived from `totalAmount`.
   * A fully settled debt becomes `collected` — the only settled status the
   * `ReceivableDebt` union defines.
   */
  const handleRecordReceivablePayment = (debtId: string, amount: number, _method: string) => {
    setReceivables((prev) =>
      prev.map((debt) => {
        if (debt.id !== debtId) return debt;
        const collectedSoFar = debt.depositPaid + amount;
        const remainingAmount = Math.max(0, debt.totalAmount - collectedSoFar);

        return {
          ...debt,
          depositPaid: collectedSoFar,
          remainingAmount,
          status: remainingAmount === 0 ? ('collected' as const) : debt.status,
        };
      })
    );
  };

  const handleSendReceivableReminder = (debtId: string, phone: string, message: string) => {
    const today = new Date().toISOString().split('T')[0];
    setReceivables((prev) =>
      prev.map((debt) => {
        if (debt.id !== debtId) return debt;
        return {
          ...debt,
          lastReminderSentAt: today,
          remindersCount: debt.remindersCount + 1,
        };
      })
    );
  };

  const handleAddPayrollEntry = (entryData: Omit<CrewPayrollEntry, 'id'>) => {
    const newEntry: CrewPayrollEntry = {
      ...entryData,
      id: `pyr-${Date.now()}`,
    };
    setCrewPayroll((prev) => [newEntry, ...prev]);
  };

  const handleMarkPayrollPaid = (id: string, method: 'bank_transfer' | 'cash') => {
    const today = new Date().toISOString().split('T')[0];
    setCrewPayroll((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          paymentStatus: 'paid' as const,
          paidAt: today,
          paymentMethod: method,
        };
      })
    );
  };

  const handleBatchMarkPayrollPaid = (
    ids: string[],
    voucherNumber: string,
    method: 'bank_transfer' | 'cash' | 'mada'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setCrewPayroll((prev) =>
      prev.map((entry) => {
        if (ids.includes(entry.id)) {
          return {
            ...entry,
            paymentStatus: 'paid' as const,
            paidAt: today,
            paymentMethod: method === 'cash' ? 'cash' : 'bank_transfer',
            consolidatedVoucherNumber: voucherNumber,
          };
        }
        return entry;
      })
    );
  };

  const handleAddConsolidatedVoucher = (
    voucher: ConsolidatedCrewPaymentVoucher,
    autoCreateExpense: boolean
  ) => {
    setConsolidatedVouchers((prev) => [voucher, ...prev]);

    // Mark all included payroll entries as paid and link to the voucherNumber
    setCrewPayroll((prev) =>
      prev.map((entry) => {
        if (voucher.payrollEntryIds.includes(entry.id)) {
          return {
            ...entry,
            paymentStatus: 'paid' as const,
            paidAt: voucher.paidDate,
            paymentMethod: voucher.paymentMethod === 'cash' ? 'cash' : 'bank_transfer',
            consolidatedVoucherNumber: voucher.voucherNumber,
          };
        }
        return entry;
      })
    );

    // If autoCreateExpense is selected, record an expense in P&L
    if (autoCreateExpense) {
      const newExpense: ExpenseRecord = {
        id: `exp-${Date.now()}`,
        voucherNumber: `PV-${Math.floor(10000 + Math.random() * 90000)}`,
        title: `مسير أجور معتمد: ${voucher.title}`,
        category: 'crew_wages',
        amount: voucher.totalConsolidatedAmount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: voucher.totalConsolidatedAmount,
        date: voucher.paidDate,
        paidTo: `طاقم العمل الميداني (${voucher.totalCrewCount} أفراد)`,
        paymentMethod: voucher.paymentMethod === 'cash' ? 'cash' : 'bank_transfer',
        receiptImageUrl: undefined,
        notes: `مرتبط بسند الصرف الموحد رقم ${voucher.voucherNumber}. إجمالي الساعات: ${voucher.totalHours} ساعة.`,
      };
      setExpenses((prev) => [newExpense, ...prev]);
    }
  };

  const handleAddWorkLog = (crewId: string, log: CrewWorkHourLog) => {
    setCrewMembers((prev) =>
      prev.map((member) => {
        if (member.id !== crewId) return member;
        const currentLogs = member.workLogs || [];
        const totalH = (member.totalLoggedHours || 0) + log.regularHours + log.overtimeHours;
        return {
          ...member,
          totalLoggedHours: totalH,
          workLogs: [log, ...currentLogs],
        };
      })
    );
  };

  const handleAutoCalculatePayrollFromHours = () => {
    let createdCount = 0;
    const newPayrollEntries: CrewPayrollEntry[] = [];

    const updatedCrewMembers = crewMembers.map((member) => {
      const currentLogs = member.workLogs || [];
      const unprocessed = currentLogs.filter((l) => l.status === 'unprocessed');

      if (unprocessed.length === 0) {
        // If no unprocessed logs exist, simulate a shift from assigned bookings
        const sampleBooking = vendorBookings[createdCount % vendorBookings.length];
        if (sampleBooking && createdCount < 2) {
          const rate = member.hourlyRate || 65;
          const regH = 5;
          const otH = 1;
          const totalEarned = regH * rate + otH * (rate * 1.5);
          newPayrollEntries.push({
            id: `pyr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            crewId: member.id,
            crewName: member.name,
            role: member.role,
            bookingId: sampleBooking.id,
            eventTitle: `${sampleBooking.serviceTitle} (${sampleBooking.customerName})`,
            eventDate: sampleBooking.date,
            regularHours: regH,
            overtimeHours: otH,
            hourlyRate: rate,
            earnedAmount: totalEarned,
            bonusAmount: 0,
            deductionAmount: 0,
            netPayout: totalEarned,
            paymentStatus: 'pending',
            bankIban: member.bankIban,
          });
          createdCount++;
        }
        return member;
      }

      const updatedLogs = currentLogs.map((log) => {
        if (log.status === 'unprocessed') {
          const rate = log.hourlyRate || member.hourlyRate || 65;
          const total = log.regularHours * rate + log.overtimeHours * (log.overtimeRate || rate * 1.5);
          newPayrollEntries.push({
            id: `pyr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            crewId: member.id,
            crewName: member.name,
            role: member.role,
            bookingId: log.bookingId || '',
            eventTitle: log.eventTitle,
            eventDate: log.eventDate,
            regularHours: log.regularHours,
            overtimeHours: log.overtimeHours,
            hourlyRate: rate,
            earnedAmount: total,
            bonusAmount: 0,
            deductionAmount: 0,
            netPayout: total,
            paymentStatus: 'pending',
            bankIban: member.bankIban,
          });
          createdCount++;
          return { ...log, status: 'processed_in_payroll' as const };
        }
        return log;
      });

      return { ...member, workLogs: updatedLogs };
    });

    if (newPayrollEntries.length > 0) {
      setCrewPayroll((prev) => [...newPayrollEntries, ...prev]);
      setCrewMembers(updatedCrewMembers);
    }
  };

  // Inventory Management Handlers
  const handleUpdateInventoryItemStock = (itemId: string, newStock: number) => {
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const boundedStock = Math.max(0, newStock);
        return {
          ...item,
          currentStock: boundedStock,
          lastRestockedAt: boundedStock > item.currentStock ? new Date().toISOString() : item.lastRestockedAt,
        };
      })
    );
  };

  const handleAddInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setInventoryItems((prev) => [newItem, ...prev]);
    triggerAutoSaveToast(`تمت إضافة بند المخزون "${newItem.nameAr}" بنجاح`);
  };

  const handleEditInventoryItem = (updatedItem: InventoryItem) => {
    setInventoryItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    triggerAutoSaveToast(`تم تحديث بند المخزون "${updatedItem.nameAr}"`);
  };

  const handleDeleteInventoryItem = (itemId: string) => {
    const target = inventoryItems.find((i) => i.id === itemId);
    setInventoryItems((prev) => prev.filter((item) => item.id !== itemId));
    if (target) {
      triggerAutoSaveToast(`تم حذف "${target.nameAr}" من المخزون`);
    }
  };

  const refreshVendorCatalog = () => {
    fetchCatalogListings()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setVendorCatalogServices((res.data as ServiceItem[]).filter(isPublicMarketplaceListing));
        }
      })
      .catch(() => undefined);
  };

  const handleAddListing = (item: Omit<VendorListing, 'id' | 'vendorId' | 'createdAt' | 'updatedAt'>) => {
    createVendorListing({
      ...item,
      vendorName: item.vendorName || supervisingVendor?.name || currentUser?.name,
    }, superviseId)
      .then((res) => {
        if (res.listing) {
          setVendorListings((prev) => [res.listing as VendorListing, ...prev.filter((row) => row.id !== res.listing.id)]);
        }
        refreshVendorCatalog();
        triggerAutoSaveToast(`تم تسجيل المنتج «${item.title}» بمسار يوصل`);
      })
      .catch((error: Error) => {
        triggerAutoSaveToast(error.message || 'تعذر حفظ المنتج');
      });
  };

  const handleEditListing = (item: VendorListing) => {
    updateVendorListing(item.id, item, superviseId)
      .then((res) => {
        const saved = (res.listing || item) as VendorListing;
        setVendorListings((prev) => prev.map((row) => (row.id === item.id ? saved : row)));
        refreshVendorCatalog();
        triggerAutoSaveToast(`تم تحديث مسار يوصل لـ «${item.title}»`);
      })
      .catch((error: Error) => {
        triggerAutoSaveToast(error.message || 'تعذر تعديل المنتج');
      });
  };

  const handleDeleteListing = (id: string) => {
    const target = vendorListings.find((item) => item.id === id);
    deleteVendorListing(id, superviseId)
      .then(() => {
        setVendorListings((prev) => prev.filter((item) => item.id !== id));
        refreshVendorCatalog();
        if (target) triggerAutoSaveToast(`تم حذف «${target.title}»`);
      })
      .catch((error: Error) => {
        triggerAutoSaveToast(error.message || 'تعذر حذف المنتج');
      });
  };

  const handleRecordRestockExpense = (
    item: InventoryItem,
    quantityAdded: number,
    totalCost: number,
    supplierName: string,
    notes?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Update stock
    setInventoryItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          currentStock: i.currentStock + quantityAdded,
          lastRestockedAt: new Date().toISOString(),
          unitCost: quantityAdded > 0 ? Math.round((totalCost / quantityAdded) * 100) / 100 : i.unitCost,
          supplierName: supplierName || i.supplierName,
        };
      })
    );

    // 2. Automatically record in P&L Expense ledger
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      voucherNumber: `PV-INV-${Math.floor(10000 + Math.random() * 90000)}`,
      title: `شراء وتوريد مخزون: ${item.nameAr} (${quantityAdded} ${item.unit})`,
      category: 'inventory_supplies',
      amount: totalCost,
      taxRate: 0.15,
      taxAmount: Math.round(totalCost * 0.15 * 100) / 100,
      totalAmount: Math.round(totalCost * 1.15 * 100) / 100,
      date: today,
      paidTo: supplierName || item.supplierName || 'مورّد مستلزمات الضيافة',
      paymentMethod: 'bank_transfer',
      notes: notes || `توريد كمية إضافية بالمستودع (+${quantityAdded} ${item.unit}) لسد احتياج المناسبات والفعاليات القادمة.`,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    triggerAutoSaveToast(`تم تحديث رصيد ${item.nameAr} وقيد مصروف شراء بمبلغ ${totalCost} ر.س`);
  };

  // Filter and Sort Services for Client View
  const marketplaceServices = useMemo(
    () => vendorCatalogServices.filter(isPublicMarketplaceListing),
    [vendorCatalogServices],
  );

  const openDashboard =
    currentUser && dashboardFor(currentUser.role) !== 'client'
      ? () => setViewMode(dashboardFor(currentUser.role))
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
          onOpenVendorHub={() => void openVendorHub()}
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
            تم استلام طلبك. إذا دفعت عبر ميسر، نراجع التحويل ونثبّت الحجز. تقدر تتابع من «طلباتي».
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
            <AdminDashboard currentUser={currentUser} onOpenVendorHub={() => void openVendorHub()} />
          </Suspense>
        </DashboardErrorBoundary>
      ) : viewMode === 'vendor' ? (
        <DashboardErrorBoundary onReset={() => setViewMode('client')}>
          <Suspense fallback={<DashboardChunkFallback label="جارٍ فتح مساحة المورّد…" />}>
          <VendorHub
          bookings={vendorBookings}
          blockedDates={blockedDates}
          threads={whatsappThreads}
          crewMembers={crewMembers}
          invoices={invoices}
          payouts={payouts}
          posItems={posItems}
          salesRecords={posSales}
          brandSettings={brandSettings}
          trackings={orderTrackings}
          expenses={expenses}
          receivables={receivables}
          payrollEntries={crewPayroll}
          consolidatedVouchers={consolidatedVouchers}
          inventoryItems={inventoryItems}
          onAddBooking={handleVendorAddBooking}
          onAddBlockedDate={handleAddBlockedDate}
          onRemoveBlockedDate={handleRemoveBlockedDate}
          onAddInvoice={handleAddInvoice}
          onAddCrewMember={handleAddCrewMember}
          onUpdateCrewStatus={handleUpdateCrewStatus}
          onAddWorkLog={handleAddWorkLog}
          onRequestPayout={handleRequestPayout}
          onAddPOSSale={handleAddPOSSale}
          onUpdateBrandSettings={handleUpdateBrandSettings}
          onUpdateTrackingStep={handleUpdateTrackingStep}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onRecordReceivablePayment={handleRecordReceivablePayment}
          onSendReceivableReminder={handleSendReceivableReminder}
          onAddPayrollEntry={handleAddPayrollEntry}
          onMarkPayrollPaid={handleMarkPayrollPaid}
          onBatchMarkPayrollPaid={handleBatchMarkPayrollPaid}
          onAddConsolidatedVoucher={handleAddConsolidatedVoucher}
          onAutoCalculatePayrollFromHours={handleAutoCalculatePayrollFromHours}
          onUpdateItemStock={handleUpdateInventoryItemStock}
          onAddInventoryItem={handleAddInventoryItem}
          onEditInventoryItem={handleEditInventoryItem}
          onDeleteInventoryItem={handleDeleteInventoryItem}
          listings={vendorListings}
          ownProfile={vendorOwnProfile}
          onAddListing={handleAddListing}
          onEditListing={handleEditListing}
          onDeleteListing={handleDeleteListing}
          onRecordRestockExpense={handleRecordRestockExpense}
          workspaceSync={vendorSync}
          contracts={vendorContracts}
          onContractsChange={setVendorContracts}
          onNotify={triggerAutoSaveToast}
          supervisorBanner={
            isVendorSupervisor(currentUser?.role) && supervisingVendor
              ? `تدخل كمدير حسابات — حساب المورّد: ${supervisingVendor.projectName || supervisingVendor.name}`
              : null
          }
          onReturnToAdmin={isVendorSupervisor(currentUser?.role) ? returnToAdmin : undefined}
          onChangeSupervisedVendor={
            isVendorSupervisor(currentUser?.role)
              ? () => {
                  setVendorPickerOpen(true);
                  void loadVendorHubs();
                }
              : undefined
          }
          onSwitchToClientMode={() => setViewMode('client')}
          onLogout={async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            setCurrentUser(null);
            setSupervisingVendor(null);
            setViewMode('client');
            setVendorSync('idle');
            vendorReadyRef.current = false;
            try {
              sessionStorage.removeItem('usil_supervise_vendor');
            } catch {
              /* ignore */
            }
          }}
        />
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
          openCrewPortal={currentUser?.role === 'vendor' ? () => setIsCrewPortalOpen(true) : undefined}
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

      {/* Crew Field Portal & GPS Attendance Modal */}
      {isCrewPortalOpen ? (
        <Suspense fallback={null}>
          <CrewFieldPortalModal
          isOpen={isCrewPortalOpen}
          onClose={() => setIsCrewPortalOpen(false)}
          crewMembers={crewMembers}
          bookings={vendorBookings}
          onAddWorkLog={handleAddWorkLog}
          onUpdateCrewStatus={handleUpdateCrewStatus}
        />
        </Suspense>
      ) : null}

      {/* Auto-Save Notification Toast (LocalForage Engine) */}
      <AnimatePresence>
        {autoSaveNotification && viewMode !== 'client' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-navy/95 backdrop-blur-md text-white border border-white/15 shadow-2xl pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 border border-success/30">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-right font-sans">
              <span className="text-xs font-medium text-white">{autoSaveNotification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Mobile Add to Home Screen Prompt & iOS Instructions */}
      <PWAInstallBanner />

      {/* The admin dashboard keeps the operations bottom bar on phones. */}
      {viewMode === 'admin' ? (
      <MobileBottomNav
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode('client')}
        onOpenVendorHub={() => void openVendorHub()}
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
        onOpenCrewPortal={() => setIsCrewPortalOpen(true)}
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

      {vendorPickerOpen ? (
        <VendorHubPicker
          hubs={vendorHubs}
          loading={vendorHubsLoading}
          error={vendorHubsError}
          onClose={() => setVendorPickerOpen(false)}
          onSelect={enterVendorHub}
        />
      ) : null}

      {isVendorRegisterOpen ? (
        <Suspense fallback={null}>
        <VendorRegisterWizard
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
