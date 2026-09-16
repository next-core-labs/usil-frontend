/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { CATEGORIES } from './data/services';
import { FilterChips } from './components/ui/FilterChips';
import { Button } from './components/ui/Button';
import { CardGridSkeleton, EmptyState, ErrorState } from './components/ui/States';
import { isPublicMarketplaceListing } from './utils/catalogMedia';
import { cityFilterMatches, ALL_CITIES_LABEL } from './data/saudiPlaces';
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
} from './types';
import type { VendorListing } from './contracts/vendors/vendor-listings';
import type { VendorOwnProfile } from './contracts/vendors/vendor-profile';
import {
  DEFAULT_VENDOR_BRAND_SETTINGS,
} from './data/vendorData';
import { Navbar } from './components/Navbar';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { ServiceCard } from './components/ServiceCard';
import { ServiceDetailModal } from './components/ServiceDetailModal';
const QuickEventCalculator = lazy(() =>
  import('./components/QuickEventCalculator').then((m) => ({ default: m.QuickEventCalculator })),
);
import { BookingDrawer } from './components/BookingDrawer';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfUse } from './components/legal/TermsOfUse';
import { RefundPolicy } from './components/legal/RefundPolicy';
import { SupportPage } from './components/legal/SupportPage';
import { AboutPage } from './components/legal/AboutPage';
import { PaymentCancelledPage, PaymentSuccessPage } from './components/PaymentStatusPage';
import { NotFoundPage } from './components/legal/NotFoundPage';
import { StoreDealsRail } from './components/market/StoreDealsRail';
import { HowUsilWorks } from './components/market/HowUsilWorks';
import { RegionGate } from './components/RegionGate';
import { loadSelectedRegion, saveSelectedRegion } from './utils/regionPreference';
import { applySeo, applySeoFromPath, loadRemoteSeo } from './utils/seo';
import { parseLocation, type SitePage } from './utils/siteRoutes';
const VendorHub = lazy(() =>
  import('./components/vendor/VendorHub').then((m) => ({ default: m.VendorHub })),
);
import { VendorOwnFileCard } from './components/vendor/VendorOwnFileCard';
import { VendorPublicPage } from './components/vendor/VendorPublicPage';
const VendorRegisterWizard = lazy(() =>
  import('./components/auth/VendorRegisterWizard').then((m) => ({ default: m.VendorRegisterWizard })),
);
const CourierRegisterForm = lazy(() =>
  import('./components/auth/CourierRegisterForm').then((m) => ({ default: m.CourierRegisterForm })),
);
import { LoginScreen, type SessionUser } from './LoginScreen';
import { DashboardErrorBoundary } from './components/AppErrorBoundary';
import { DashboardChunkFallback } from './components/ui/DashboardChunkFallback';
import { useToast } from './components/ui/Toast';
import { CityDemandForm } from './components/CityDemandForm';
import { VendorHubPicker } from './components/admin/VendorHubPicker';
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
import { canFileExternalBooking, canUseVendorHub, dashboardFor, isVendorSupervisor, roleLabelAr } from './contracts/auth/roles';
import { pickDefaultVendorHub, type VendorHubRow } from './contracts/vendors/vendor-hubs';
const VoiceAIAssistant = lazy(() =>
  import('./components/voice/VoiceAIAssistant').then((m) => ({ default: m.VoiceAIAssistant })),
);
const ClientOrderTrackingModal = lazy(() =>
  import('./components/client/ClientOrderTrackingModal').then((m) => ({ default: m.ClientOrderTrackingModal })),
);
const ServiceComparisonModal = lazy(() =>
  import('./components/client/ServiceComparisonModal').then((m) => ({ default: m.ServiceComparisonModal })),
);
import { ServiceComparisonFloatingBar } from './components/client/ServiceComparisonFloatingBar';
const CrewFieldPortalModal = lazy(() =>
  import('./components/crew/CrewFieldPortalModal').then((m) => ({ default: m.CrewFieldPortalModal })),
);
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { MessageCircle, RotateCcw, Mic, CheckCircle, PackageSearch } from 'lucide-react';
import {
  categoryForSearchQuery,
  isHospitalitySearchQuery,
  serviceMatchesSearch,
  serviceMatchesPriceRange,
  serviceMatchesFulfillment,
  FulfillmentFilter,
  AUDIENCE_OPTIONS,
  PRICE_RANGES,
  FULFILLMENT_FILTER_CHIPS,
} from './data/saudiMarket';
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
import { clientHasLiveEvent } from './utils/eventTracking';

export default function App() {
  // Mode View State: 'client' (Marketplace) or 'vendor' (Vendor Operating System Hub)
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'client' | 'vendor' | 'admin'>('client');

  // Client Marketplace States
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCityState] = useState(() => loadSelectedRegion() || ALL_CITIES_LABEL);
  const [hasPickedRegion, setHasPickedRegion] = useState(() => Boolean(loadSelectedRegion()));
  const [regionPickerOpen, setRegionPickerOpen] = useState(() => !loadSelectedRegion());
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [sitePage, setSitePage] = useState<SitePage>(
    () => parseLocation(window.location.pathname, window.location.hash).sitePage,
  );
  const [vendorPublicId, setVendorPublicId] = useState<string | null>(
    () => parseLocation(window.location.pathname, window.location.hash).vendorPublicId,
  );
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentFilter>('all');
  const [showPaidBanner, setShowPaidBanner] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      if (key.toLowerCase() === 'paid' && value === '1') return true;
      if (key.toLowerCase() === 'status' && value.toLowerCase() === 'paid') return true;
    }
    return false;
  });

  const [activeDetailService, setActiveDetailService] = useState<ServiceItem | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register' | 'verify'>('login');
  const [isVendorRegisterOpen, setIsVendorRegisterOpen] = useState(false);
  const [isCourierRegisterOpen, setIsCourierRegisterOpen] = useState(false);
  const [courierModalTab, setCourierModalTab] = useState<'apply' | 'external'>('apply');
  const [isVoiceAIOpen, setIsVoiceAIOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isCrewPortalOpen, setIsCrewPortalOpen] = useState(false);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string>('');

  // Service Comparison state
  const [comparedServices, setComparedServices] = useState<ServiceItem[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Authenticated User Profile (Phone/OTP Verified)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [supervisingVendor, setSupervisingVendor] = useState<VendorHubRow | null>(null);
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
  const [whatsappThreads, setWhatsappThreads] = useState<WhatsAppThread[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [payouts, setPayouts] = useState<FinancialPayout[]>([]);

  // New Vendor White-Label, POS, Tracking & Accounting States
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [posSales, setPosSales] = useState<POSSaleRecord[]>([]);
  const [brandSettings, setBrandSettings] = useState<VendorBrandSettings>(DEFAULT_VENDOR_BRAND_SETTINGS);
  const [orderTrackings, setOrderTrackings] = useState<ClientOrderTracking[]>([]);
  const [vendorOwnProfile, setVendorOwnProfile] = useState<VendorOwnProfile | null>(null);

  const goHome = (opts?: { category?: string; query?: string }) => {
    setSitePage(null);
    setVendorPublicId(null);
    setIsCourierRegisterOpen(false);
    if (opts?.category) setSelectedCategory(opts.category);
    else if (!opts) setSelectedCategory('all');
    if (opts?.query !== undefined) setSearchQuery(opts.query);
    else if (!opts) setSearchQuery('');
    const next = opts?.category === 'hospitality' ? '/hospitality' : '/';
    if (window.location.pathname !== next) {
      window.history.pushState({}, '', next);
    }
    applySeo(opts?.category === 'hospitality' ? 'hospitality' : 'home');
  };

  const setSelectedCity = (city: string) => {
    const next = String(city || '').trim() || ALL_CITIES_LABEL;
    setSelectedCityState(next);
    saveSelectedRegion(next);
    setHasPickedRegion(true);
    setRegionPickerOpen(false);
  };

  useEffect(() => {
    const applyFromLocation = () => {
      const intent = parseLocation(window.location.pathname, window.location.hash);
      setSitePage(intent.sitePage);
      setVendorPublicId(intent.vendorPublicId);
      if (intent.hospitality) setSelectedCategory('hospitality');
      if (intent.courier) setIsCourierRegisterOpen(true);
    };
    applyFromLocation();
    window.addEventListener('popstate', applyFromLocation);
    window.addEventListener('hashchange', applyFromLocation);
    return () => {
      window.removeEventListener('popstate', applyFromLocation);
      window.removeEventListener('hashchange', applyFromLocation);
    };
  }, []);

  useEffect(() => {
    const path = (window.location.pathname.replace(/\/$/, '') || '/').toLowerCase();
    if (sitePage === 'privacy' && path !== '/privacy') {
      window.history.replaceState({}, '', '/privacy');
    } else if (sitePage === 'terms' && path !== '/terms') {
      window.history.replaceState({}, '', '/terms');
    } else if (sitePage === 'refund' && path !== '/refund' && path !== '/cancellation') {
      window.history.replaceState({}, '', '/refund');
    } else if (sitePage === 'support' && path !== '/support') {
      window.history.replaceState({}, '', '/support');
    } else if (sitePage === 'about' && path !== '/about') {
      window.history.replaceState({}, '', '/about');
    } else if (sitePage === 'payment-success' && path !== '/payment/success') {
      window.history.replaceState({}, '', '/payment/success' + window.location.search);
    } else if (sitePage === 'payment-cancelled' && path !== '/payment/cancelled') {
      window.history.replaceState({}, '', '/payment/cancelled');
    } else if (sitePage === 'vendor-file') {
      applySeo('home');
      return;
    } else if (sitePage === 'notfound') {
      applySeo('home');
      return;
    } else if (!sitePage && selectedCategory === 'hospitality' && path !== '/hospitality') {
      window.history.replaceState({}, '', '/hospitality');
    } else if (!sitePage && selectedCategory !== 'hospitality' && path === '/hospitality') {
      window.history.replaceState({}, '', '/');
    } else if (isCourierRegisterOpen && path !== '/courier') {
      window.history.replaceState({}, '', '/courier');
    } else if (!isCourierRegisterOpen && !sitePage && path === '/courier') {
      window.history.replaceState({}, '', '/');
    }
    if (isCourierRegisterOpen) applySeo('courier');
    else applySeo(sitePage || (selectedCategory === 'hospitality' ? 'hospitality' : 'home'));
  }, [sitePage, selectedCategory, isCourierRegisterOpen]);

  useEffect(() => {
    void loadRemoteSeo().then(() => applySeoFromPath());
  }, []);

  useEffect(() => {
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

  const showEventTracker = useMemo(
    () =>
      clientHasLiveEvent({
        role: currentUser?.role,
        phone: currentUser?.phone,
        trackings: orderTrackings,
        bookings: vendorBookings,
      }),
    [currentUser, orderTrackings, vendorBookings],
  );

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
        setAuthDefaultMode('login');
        setIsAuthOpen(true);
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
          quantity: updated[existingIndex].quantity + 1,
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

  // Service Comparison Action Handlers
  const COMPARE_LIMIT = 4;

  /* The limit check reads current state rather than living inside the updater:
     a state updater must stay pure, and under StrictMode it runs twice, which
     fired the old alert() twice. */
  /* Everything currently narrowing the grid, in one place, so the chips row
     and the filter panel's counter always agree. */
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; value: string; onClear: () => void }[] = [];
    if (selectedCategory !== 'all') {
      list.push({
        key: 'category',
        label: 'القسم',
        value: CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory,
        onClear: () => setSelectedCategory('all'),
      });
    }
    if (selectedCity && selectedCity !== ALL_CITIES_LABEL) {
      list.push({
        key: 'city',
        label: 'المدينة',
        value: selectedCity,
        onClear: () => setSelectedCity(ALL_CITIES_LABEL),
      });
    }
    if (selectedAudience !== 'all') {
      list.push({
        key: 'audience',
        label: 'الجمهور',
        value: AUDIENCE_OPTIONS.find((o) => o.id === selectedAudience)?.label || selectedAudience,
        onClear: () => setSelectedAudience('all'),
      });
    }
    if (priceRange !== 'all') {
      list.push({
        key: 'price',
        label: 'السعر',
        value: PRICE_RANGES.find((r) => r.id === priceRange)?.label || priceRange,
        onClear: () => setPriceRange('all'),
      });
    }
    if (selectedFulfillment !== 'all') {
      list.push({
        key: 'lane',
        label: 'مسار التوريد',
        value:
          FULFILLMENT_FILTER_CHIPS.find((c) => c.id === selectedFulfillment)?.chip ||
          selectedFulfillment,
        onClear: () => setSelectedFulfillment('all'),
      });
    }
    if (searchQuery.trim()) {
      list.push({
        key: 'query',
        label: 'البحث',
        value: searchQuery.trim(),
        onClear: () => setSearchQuery(''),
      });
    }
    return list;
  }, [
    selectedCategory,
    selectedCity,
    selectedAudience,
    priceRange,
    selectedFulfillment,
    searchQuery,
  ]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedCity(ALL_CITIES_LABEL);
    setSelectedAudience('all');
    setPriceRange('all');
    setSelectedFulfillment('all');
    setSearchQuery('');
  };

  const handleToggleCompare = (service: ServiceItem) => {
    const exists = comparedServices.some((s) => s.id === service.id);
    if (exists) {
      setComparedServices((prev) => prev.filter((s) => s.id !== service.id));
      return;
    }
    if (comparedServices.length >= COMPARE_LIMIT) {
      toast(`تقدر تقارن ${COMPARE_LIMIT} منتجات كحد أقصى. احذف واحداً لإضافة غيره.`, 'warning');
      return;
    }
    setComparedServices((prev) => [...prev, service]);
  };

  const handleRemoveFromCompare = (serviceId: string) => {
    setComparedServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const handleClearAllCompare = () => {
    setComparedServices([]);
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
    createVendorBooking(newBooking as unknown as Record<string, unknown>, superviseId).catch(() => {
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
    createBlockedDate(newBlock as unknown as Record<string, unknown>, superviseId).catch(() => {
      setVendorSync('error');
    });
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    deleteBlockedDate(id, superviseId).catch(() => {
      setVendorSync('error');
    });
  };

  const handleSendMessage = (
    threadId: string,
    text: string,
    attachmentType?: WhatsAppMessage['attachmentType'],
    attachmentData?: any
  ) => {
    const newMessage: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      sender: 'vendor',
      senderName: `${brandSettings.brandName} (أنت)`,
      text,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      attachmentType,
      attachmentData,
    };

    setWhatsappThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
            messages: [...thread.messages, newMessage],
          };
        }
        return thread;
      })
    );
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

  // Handle Instant Online Booking & Auto-generate Tracking & ZATCA Invoice
  const handleCompleteOnlineBooking = (bookingDetails: {
    customerName: string;
    customerPhone: string;
    eventDate: string;
    eventCity: string;
    notes: string;
    paymentMethod: 'moyasar';
    totalAmount: number;
  }) => {
    const bookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingCode = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: VendorBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber: bookingCode,
      serviceId: cartItems[0]?.service.id || 'srv-custom',
      serviceTitle: cartItems[0]?.service.title || 'باقة ضيافة متكاملة',
      customerName: bookingDetails.customerName,
      customerPhone: bookingDetails.customerPhone,
      date: bookingDetails.eventDate,
      startTime: '18:00',
      endTime: '23:30',
      city: bookingDetails.eventCity,
      venueName: `مقر المناسبة - ${bookingDetails.eventCity}`,
      guestCount: 50,
      totalAmount: bookingDetails.totalAmount,
      depositAmount: bookingDetails.totalAmount,
      remainingAmount: 0,
      status: 'confirmed',
      source: 'platform',
      notes: bookingDetails.notes || 'طلب مثبّت في يوصل — دفع إلكتروني عبر ميسر',
      createdAt: new Date().toISOString(),
    };

    const newTracking: ClientOrderTracking = {
      id: `trk-${Date.now()}`,
      trackingCode,
      bookingNumber: bookingCode,
      clientName: bookingDetails.customerName,
      clientPhone: bookingDetails.customerPhone,
      serviceTitle: newBooking.serviceTitle,
      eventDate: bookingDetails.eventDate,
      eventTime: '18:00',
      venueName: `مقر المناسبة - ${bookingDetails.eventCity}`,
      city: bookingDetails.eventCity,
      guestCount: 50,
      totalAmount: bookingDetails.totalAmount,
      depositPaid: bookingDetails.totalAmount,
      remainingBalance: 0,
      status: 'preparing',
      source: 'mithyaf',
      isWhiteLabel: false,
      timeline: [
        {
          id: 'step-1',
          title: 'تأكيد الطلب — دفع إلكتروني',
          timestamp: 'الآن',
          isCompleted: true,
          isCurrent: false,
          description: 'الدفع عبر ميسر (مدى / آبل باي / STC Pay). ما نعتبره مدفوع إلا بعد تأكيد ميسر.',
        },
        {
          id: 'step-2',
          title: 'تجهيز مؤن القهوة والدلال والعتاد',
          timestamp: 'قبل المناسبة بساعتين',
          isCompleted: false,
          isCurrent: true,
          description: 'جاري فرز دلال الرسلان وفناجيل السيراميك وتجهيز البن الخولاني الفاخر.',
        },
        {
          id: 'step-3',
          title: 'انطلاق الطاقم بالزي السعودي الموحد',
          timestamp: 'قبل الموعد بـ 60 دقيقة',
          isCompleted: false,
          isCurrent: false,
          description: 'سيصل المباشرون والمشرف الميداني لتنسيق طاولات الضيافة وتجهيز المباخر.',
        },
        {
          id: 'step-4',
          title: 'بدء استقبال الضيوف والتقديم الملكي',
          timestamp: '18:00',
          isCompleted: false,
          isCurrent: false,
          description: 'بدء صب القهوة والبخور وتوزيع التمور الفاخرة طوال فترة المناسبة.',
        },
      ],
      assignedSupervisor: {
        name: 'مشرف يوصل',
        phone: '',
        role: 'مشرف ضيافة',
        avatar: '/uploads/avatar-supervisor.svg',
      },
    };

    setVendorBookings((prev) => [newBooking, ...prev]);
    setOrderTrackings((prev) => [newTracking, ...prev]);
    setActiveTrackingCode(trackingCode);
  };

  // Filter and Sort Services for Client View
  const marketplaceServices = useMemo(
    () => vendorCatalogServices.filter(isPublicMarketplaceListing),
    [vendorCatalogServices],
  );

  const filteredServices = useMemo(() => {
    return marketplaceServices.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // City filter: region covers its governorates/villages, plus exact names and aliases
      if (!cityFilterMatches(item.cities, selectedCity)) {
        return false;
      }
      // Audience: رجال / نساء / عائلي / شركات
      if (selectedAudience !== 'all') {
        const a = item.audience || 'family';
        const matchesExact = a === selectedAudience;
        const familyFitsMenWomen =
          a === 'family' && (selectedAudience === 'women' || selectedAudience === 'men');
        if (!matchesExact && !familyFitsMenWomen) {
          return false;
        }
      }
      // Search query: title, category, tags, occasions, description, aliases
      if (searchQuery.trim() !== '' && !serviceMatchesSearch(item, searchQuery)) {
        return false;
      }
      if (!serviceMatchesPriceRange(item.price, priceRange)) {
        return false;
      }
      if (!serviceMatchesFulfillment(item, selectedFulfillment)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      // Default: popular
      return b.reviewsCount - a.reviewsCount;
    });
  }, [marketplaceServices, selectedCategory, selectedCity, selectedAudience, searchQuery, sortBy, priceRange, selectedFulfillment]);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-paper text-ink">
      {viewMode === 'client' && !sitePage ? (
        <RegionGate
          open={regionPickerOpen}
          required={!hasPickedRegion}
          selected={selectedCity}
          onSelect={setSelectedCity}
          onClose={() => {
            if (hasPickedRegion) setRegionPickerOpen(false);
          }}
        />
      ) : null}
      {/* Top Universal Navbar — hidden inside Vendor Studio */}
      {viewMode !== 'vendor' ? (
      <Navbar
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        onOpenRegionPicker={() => setRegionPickerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(query) => {
          goHome({ query });
          const mapped = categoryForSearchQuery(query);
          if (mapped) setSelectedCategory(mapped);
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => {
          goHome({ category: catId, query: '' });
          document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onGoHome={() => goHome()}
        onOpenAbout={() => setSitePage('about')}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenCrewPortal={currentUser?.role === 'vendor' ? () => setIsCrewPortalOpen(true) : undefined}
        onOpenTracker={showEventTracker ? () => setIsTrackerOpen(true) : undefined}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        compareCount={comparedServices.length}
        viewMode={viewMode}
        onToggleViewMode={() => {
          if (!currentUser || currentUser.role === 'client') {
            setAuthDefaultMode('login');
            setIsAuthOpen(true);
            return;
          }
          const home = dashboardFor(currentUser.role);
          setViewMode((prev) => (prev === 'client' ? home : 'client'));
        }}
        onOpenVendorHub={() => void openVendorHub()}
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthDefaultMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenVendorRegister={() => setIsVendorRegisterOpen(true)}
        selectedFulfillment={selectedFulfillment}
        onSelectFulfillment={setSelectedFulfillment}
        onOpenSupport={() => setSitePage('support')}
        onOpenPrivacy={() => setSitePage('privacy')}
        onOpenTerms={() => setSitePage('terms')}
        onOpenVoiceAI={() => setIsVoiceAIOpen(true)}
        onLogout={async () => {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          setCurrentUser(null);
          setSupervisingVendor(null);
          setViewMode('client');
          try {
            sessionStorage.removeItem('usil_supervise_vendor');
          } catch {
            /* ignore */
          }
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
        <div className="sticky top-0 z-40 bg-emerald-50 border-b border-emerald-200 text-emerald-950 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium">
            تم استلام طلبك. إذا دفعت عبر ميسر، نراجع التحويل ونثبّت الحجز. تقدر تتابع من حسابك.
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
            className="min-h-10 px-3 rounded-lg bg-emerald-700 text-white text-xs font-medium"
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
          onSendMessage={handleSendMessage}
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
      ) : sitePage ? (
        <>
          <main className="usil-main-pad flex-1 pb-32 md:pb-8">
            {sitePage === 'privacy' ? (
              <PrivacyPolicy onBack={() => goHome()} />
            ) : sitePage === 'terms' ? (
              <TermsOfUse onBack={() => goHome()} />
            ) : sitePage === 'refund' ? (
              <RefundPolicy onBack={() => goHome()} />
            ) : sitePage === 'support' ? (
              <SupportPage
                onBack={() => goHome()}
                onSelectCity={(city) => {
                  setSelectedCity(city);
                  goHome();
                  document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            ) : sitePage === 'about' ? (
              <AboutPage onBack={() => goHome()} />
            ) : sitePage === 'vendor-file' && vendorPublicId ? (
              <VendorPublicPage
                vendorId={vendorPublicId}
                onOpenListing={(service) => {
                  setActiveDetailService(service);
                }}
              />
            ) : sitePage === 'payment-success' ? (
              <PaymentSuccessPage onBack={() => goHome()} />
            ) : sitePage === 'payment-cancelled' ? (
              <PaymentCancelledPage onBack={() => goHome()} />
            ) : (
              <NotFoundPage
                onBack={() => goHome()}
                onSearch={(query) => {
                  goHome({ query });
                  const mapped = categoryForSearchQuery(query);
                  if (mapped) setSelectedCategory(mapped);
                }}
                onSelectCategory={(catId) => goHome({ category: catId, query: '' })}
              />
            )}
          </main>
          <Footer
            onSelectCategory={(catId) => goHome({ category: catId, query: '' })}
            onSelectCity={(city) => {
              setSelectedCity(city);
              goHome();
            }}
            onPickPackage={(category, audience, query) => {
              setSelectedAudience(audience);
              goHome({ category, query });
            }}
            onPickSeason={(query) => {
              const mapped = categoryForSearchQuery(query);
              goHome({ category: mapped || 'all', query });
            }}
            onSelectFulfillment={(lane) => {
              setSelectedFulfillment(lane);
              goHome();
            }}
            onAbout={() => setSitePage('about')}
            onPrivacy={() => setSitePage('privacy')}
            onTerms={() => setSitePage('terms')}
            onRefund={() => setSitePage('refund')}
            onSupport={() => setSitePage('support')}
          />
        </>
      ) : (
        <>
          <main className="usil-main-pad container mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-6 flex-1 pb-32 md:pb-6">
            <StoreDealsRail
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onPickPackage={(category, audience, query) => {
                setSelectedCategory(category);
                setSelectedAudience(audience);
                setSearchQuery(query);
                document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <div className="mt-4">
              <HowUsilWorks />
            </div>
            <section
              id="services-section"
              /* --usil-header-h is published by Navbar; the mobile app bar is
                 ~270px tall, far past the old 11rem guess, so smooth-scrolling
                 here used to land the heading underneath it. */
              className="mt-5 scroll-mt-[calc(var(--usil-header-h,11rem)+0.75rem)]"
            >
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="lg:w-56 xl:w-60 shrink-0">
              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalServicesCount={filteredServices.length}
                selectedAudience={selectedAudience}
                onSelectAudience={setSelectedAudience}
                selectedPrice={priceRange}
                onSelectPrice={setPriceRange}
                selectedFulfillment={selectedFulfillment}
                onSelectFulfillment={setSelectedFulfillment}
                activeFilterCount={activeFilters.length}
              />
              </div>
              <div className="flex-1 min-w-0 space-y-4">
              {vendorOwnProfile && currentUser && viewMode === 'client' ? (
                <VendorOwnFileCard profile={vendorOwnProfile} compact />
              ) : null}
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3 text-right">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-navy truncate">
                      {CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'كل المنتجات'}
                    </h1>
                    <p className="text-xs text-ink-3 mt-1">
                      <span className="tnum font-semibold text-ink-2">
                        {filteredServices.length}
                      </span>{' '}
                      نتيجة · السعر والصورة من المورّد
                    </p>
                  </div>
                </div>
                <FilterChips
                  filters={activeFilters}
                  onClearAll={clearAllFilters}
                  resultCount={filteredServices.length}
                />
              </div>

              {/* Service Cards Grid */}
              {catalogStatus === 'loading' ? (
                <CardGridSkeleton count={9} />
              ) : catalogStatus === 'error' ? (
                <ErrorState
                  title="تعذر تحميل كتالوج المورّدين"
                  description="حدّث الصفحة أو تواصل مع الدعم إن استمر الانقطاع. لم نختلق مورّدين وهميين لتعبئة السوق."
                  onRetry={() => window.location.reload()}
                />
              ) : filteredServices.length === 0 ? (
                <EmptyState
                  icon={PackageSearch}
                  title={
                    marketplaceServices.length === 0
                      ? 'ما فيه منتج في السوق بعد'
                      : activeFilters.length > 0
                        ? 'ما لقينا منتجاً بهذي الفلاتر'
                        : 'ما لقينا منتجاً مطابقاً'
                  }
                  description={
                    marketplaceServices.length === 0
                      ? 'السوق يعرض منتجات المورّدين المعتمدين فقط — ما نعرض صوراً ولا أسعاراً وهمية. اترك طلبك وبنوصلك أول ما يتوفر مورّد في منطقتك.'
                      : 'جرّب توسيع نطاق البحث، أو اترك طلبك وبنجهّز لك مورّداً مناسباً.'
                  }
                  action={
                    activeFilters.length > 0 ? (
                      <Button variant="primary" icon={RotateCcw} onClick={clearAllFilters}>
                        مسح كل الفلاتر
                      </Button>
                    ) : undefined
                  }
                  secondaryAction={
                    <Button
                      variant="secondary"
                      onClick={() => setSitePage('support')}
                    >
                      راسل الدعم
                    </Button>
                  }
                >
                  <div className="max-w-md mx-auto text-right">
                    <CityDemandForm
                      city={selectedCity}
                      onCityChange={setSelectedCity}
                      defaultOccasion={
                        selectedCategory === 'hospitality'
                          ? 'ضيافة وقهوة'
                          : selectedCategory === 'buffet'
                            ? 'بوفيه ومأكولات'
                            : selectedCategory === 'photography'
                              ? 'تصوير وتوثيق'
                              : selectedCategory === 'halls'
                                ? 'قاعة أو استراحة'
                                : selectedCategory === 'condolence'
                                  ? 'عزاء'
                                  : 'عرس'
                      }
                    />
                  </div>
                </EmptyState>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onOpenDetails={(s) => setActiveDetailService(s)}
                      onAddToCart={(s) => handleAddToCart(s)}
                      isInCart={cartItems.some((item) => item.service.id === service.id)}
                      onToggleCompare={handleToggleCompare}
                      isCompared={comparedServices.some((s) => s.id === service.id)}
                    />
                  ))}
                </div>
              )}
              </div>
              </div>
            </section>
          </main>

          {/* Service Comparison Floating Dock Bar (Client Mode) */}
          <ServiceComparisonFloatingBar
            comparedServices={comparedServices}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onRemoveService={handleRemoveFromCompare}
            onClearAll={handleClearAllCompare}
          />

          {/* Footer */}
          <Footer
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setSearchQuery('');
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectCity={(city) => {
              setSelectedCity(city);
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onPickPackage={(category, audience, query) => {
              setSelectedCategory(category);
              setSelectedAudience(audience);
              setSearchQuery(query);
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onPickSeason={(query) => {
              setSearchQuery(query);
              const mapped = categoryForSearchQuery(query);
              if (mapped) setSelectedCategory(mapped);
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onSelectFulfillment={(lane) => {
              setSelectedFulfillment(lane);
              document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onPrivacy={() => setSitePage('privacy')}
            onTerms={() => setSitePage('terms')}
            onRefund={() => setSitePage('refund')}
            onSupport={() => setSitePage('support')}
            onAbout={() => setSitePage('about')}
          />

          {/* Service Detail Modal */}
          <ServiceDetailModal
            service={activeDetailService}
            onClose={() => setActiveDetailService(null)}
            onAddToCart={(service, qty, date, time, city, notes) => {
              handleAddToCart(service, qty, date, time, city, notes);
            }}
            isInCart={
              activeDetailService
                ? cartItems.some((item) => item.service.id === activeDetailService.id)
                : false
            }
            onToggleCompare={handleToggleCompare}
            isCompared={
              activeDetailService
                ? comparedServices.some((s) => s.id === activeDetailService.id)
                : false
            }
          />

          {/* Event Quote Calculator Modal */}
          {isCalculatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 usil-modal-scroll">
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
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

          {/* Booking / Cart Drawer */}
          <BookingDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCompleteOnlineBooking={(details) => {
              handleCompleteOnlineBooking(details);
              setIsCartOpen(false);
              setIsTrackerOpen(true);
            }}
          />

          <div className="hidden md:flex fixed bottom-6 left-6 z-30 items-center gap-3">
            <a
              href="/support"
              onClick={(e) => {
                e.preventDefault();
                setSitePage('support');
              }}
              className="h-12 px-4 rounded-full bg-action hover:bg-action-hover text-white flex items-center gap-2.5 shadow-lg transition-transform active:scale-95"
              title="دعم يوصل"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <MessageCircle className="w-4 h-4 text-sand" />
              <span className="text-xs font-medium">دعم يوصل</span>
            </a>
          </div>
        </>
      )}

      {/* Client Order Live Tracking Modal */}
      {isTrackerOpen ? (
        <Suspense fallback={null}>
          <ClientOrderTrackingModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          trackings={orderTrackings}
          brandSettings={brandSettings}
          initialTrackingCode={activeTrackingCode}
        />
        </Suspense>
      ) : null}

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
        {autoSaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-navy/95 backdrop-blur-md text-white border border-sand/40 shadow-2xl pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-right font-sans">
              <span className="text-xs font-medium text-slate-100">{autoSaveNotification.message}</span>
              <span className="text-2xs text-sand font-semibold bg-sand/10 px-1.5 py-0.5 rounded-md border border-sand/20">
                IndexedDB
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice AI Concierge Button (Desktop only) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsVoiceAIOpen(true)}
          className="h-13 px-4 sm:px-5 rounded-full bg-gradient-to-r from-navy via-[#0F284D] to-action text-white flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95 border-2 border-white/20 group cursor-pointer"
          title="تحدث صوتياً مع وكيل يوصل الذكي"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sand">
              <Mic className="w-4 h-4 text-sand group-hover:scale-110 transition-transform" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-navy absolute -top-0.5 -right-0.5 animate-ping" />
          </div>
          <div className="text-right">
            <span className="text-xs font-medium block leading-tight">الوكيل الصوتي الذكي</span>
            <span className="text-2xs text-sand font-medium">تحدث لتجهيز مناسبتك ⚡</span>
          </div>
        </button>
      </div>

      {/* PWA Mobile Add to Home Screen Prompt & iOS Instructions */}
      <PWAInstallBanner />

      {/* Modern Mobile Bottom App Navigation Bar (PWA & Mobile Native Experience) */}
      {viewMode !== 'vendor' ? (
      <MobileBottomNav
        viewMode={viewMode}
        onToggleViewMode={() => {
          if (!currentUser || currentUser.role === 'client') {
            setIsAuthOpen(true);
            return;
          }
          const home = dashboardFor(currentUser.role);
          setViewMode((prev) => (prev === 'client' ? home : 'client'));
        }}
        onOpenVendorHub={() => void openVendorHub()}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenVoiceAI={() => setIsVoiceAIOpen(true)}
        // Always reachable from the bar: the modal takes a tracking code, so it
        // is useful even before this device has a live event of its own.
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenCrewPortal={() => setIsCrewPortalOpen(true)}
        onGoHome={() => {
          goHome();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => {
          setAuthDefaultMode('login');
          setIsAuthOpen(true);
        }}
        currentUser={currentUser}
      />
      ) : null}

      {/* Phone/Email OTP Authentication Modal */}
      {vendorPickerOpen ? (
        <VendorHubPicker
          hubs={vendorHubs}
          loading={vendorHubsLoading}
          error={vendorHubsError}
          onClose={() => setVendorPickerOpen(false)}
          onSelect={enterVendorHub}
        />
      ) : null}

      {isAuthOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/40 backdrop-blur-sm usil-safe-overlay">
          <LoginScreen
            defaultMode={authDefaultMode}
            verifyPrefill={
              currentUser
                ? { email: currentUser.email, phone: currentUser.phone }
                : undefined
            }
            onClose={() => setIsAuthOpen(false)}
            onOpenVendorRegister={() => {
              setIsAuthOpen(false);
              setIsVendorRegisterOpen(true);
            }}
            onOpenCourierRegister={() => {
              setIsAuthOpen(false);
              setIsCourierRegisterOpen(true);
            }}
            onSuccess={(user) => {
              setCurrentUser(sessionToProfile(user));
              void fetchMyVendorFile()
                .then((file) => {
                  if (file.profile) setVendorOwnProfile(file.profile as VendorOwnProfile);
                })
                .catch(() => undefined);
              setIsAuthOpen(false);
            }}
          />
        </div>
      ) : null}

      {isVendorRegisterOpen ? (
        <Suspense fallback={null}>
        <VendorRegisterWizard
          onClose={() => setIsVendorRegisterOpen(false)}
          onLoggedIn={(user) => {
            setCurrentUser(sessionToProfile(user));
            void fetchMyVendorFile()
              .then((file) => {
                if (file.profile) setVendorOwnProfile(file.profile as VendorOwnProfile);
              })
              .catch(() => undefined);
          }}
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
            setIsCartOpen(true);
          }}
          onOpenServiceDetails={(srv) => setActiveDetailService(srv)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          currentCity={selectedCity}
          services={marketplaceServices}
        />
        </Suspense>
      ) : null}

      {/* Hospitality Services Technical Comparison Modal */}
      {isCompareModalOpen ? (
        <Suspense fallback={null}>
          <ServiceComparisonModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          comparedServices={comparedServices}
          allServices={marketplaceServices}
          onRemoveFromCompare={handleRemoveFromCompare}
          onAddToCompare={handleToggleCompare}
          onAddToCart={(service) => {
            handleAddToCart(service);
          }}
          onOpenDetails={(service) => {
            setIsCompareModalOpen(false);
            setActiveDetailService(service);
          }}
          cartItemIds={cartItems.map((item) => item.service.id)}
          onClearAll={handleClearAllCompare}
        />
        </Suspense>
      ) : null}

    </div>
  );
}
