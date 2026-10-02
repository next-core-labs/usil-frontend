import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BookingItem, ServiceItem, UserProfile } from '../types';
import type { TrendingService } from '../utils/trendingApi';
import type { SessionUser } from '../LoginScreen';
import type { VendorOwnProfile } from '../contracts/vendors/vendor-profile';
import type { ChatTarget } from '../components/chat/ClientChatModal';
import type { SitePage } from '../utils/siteRoutes';
import { pathForProduct } from '../utils/siteRoutes';
import { applySeo } from '../utils/seo';
import { categoryForSearchQuery, type FulfillmentFilter, FULFILLMENT_IDS } from '../data/saudiMarket';
import { CATEGORIES } from '../data/services';
import { PrivacyPolicy } from '../components/legal/PrivacyPolicy';
import { TermsOfUse } from '../components/legal/TermsOfUse';
import { RefundPolicy } from '../components/legal/RefundPolicy';
import { SupportPage } from '../components/legal/SupportPage';
import { AboutPage } from '../components/legal/AboutPage';
import { NotFoundPage } from '../components/legal/NotFoundPage';
import { PaymentCancelledPage, PaymentSuccessPage } from '../components/PaymentStatusPage';
import { VendorPublicPage } from '../components/vendor/VendorPublicPage';
import { useToast } from '../components/ui/Toast';
import { StorefrontProvider, type CatalogFilters, type Navigate, type StorefrontValue } from './context';
import { useLang } from './lang';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { MobileTabs } from './MobileTabs';
import { CompareBar } from './CompareBar';
import { WhatsAppFab } from './WhatsAppFab';
import { HomeScreen } from './screens/HomeScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { CompareScreen } from './screens/CompareScreen';
import { ProductScreen } from './screens/ProductScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { AccountScreen } from './screens/AccountScreen';
import { ChatScreen } from './screens/ChatScreen';
import { LoginPage } from './screens/LoginPage';
import { RequestScreen } from './screens/RequestScreen';
import { ProvidersScreen } from './screens/ProvidersScreen';

export type StorefrontProps = {
  sitePage: SitePage;
  productId: string | null;
  vendorPublicId: string | null;
  /** Bumped on every navigation so query-string changes re-render. */
  locationKey: number;
  navigate: Navigate;

  services: ServiceItem[];
  catalogStatus: 'loading' | 'ready' | 'error';
  retryCatalog: () => void;
  trending: TrendingService[];
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  openRegionPicker: () => void;

  cart: BookingItem[];
  addToCart: StorefrontValue['addToCart'];
  updateQuantity: (serviceId: string, delta: number) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;

  compared: ServiceItem[];
  setCompared: React.Dispatch<React.SetStateAction<ServiceItem[]>>;

  user: UserProfile | null;
  chatUnread: number;
  onAuthSuccess: (user: SessionUser) => void;
  logout: () => void | Promise<void>;
  openDashboard?: () => void;
  openCrewPortal?: () => void;
  openVoiceAI: () => void;
  openVendorRegister: () => void;
  openCourierRegister: () => void;
  vendorOwnProfile: VendorOwnProfile | null;
};

const DEFAULT_FILTERS: CatalogFilters = { category: 'all', audience: 'all', query: '', sort: 'popular', price: 'all', lane: 'all' };
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
const PENDING_CHAT_KEY = 'usil_pending_chat';

function readFiltersFromSearch(search: URLSearchParams, hospitality: boolean): Partial<CatalogFilters> {
  const patch: Partial<CatalogFilters> = {};
  const cat = search.get('cat');
  if (cat && CATEGORY_IDS.has(cat)) patch.category = cat;
  if (hospitality) patch.category = 'hospitality';
  const q = search.get('q');
  if (q !== null) patch.query = q;
  const aud = search.get('aud');
  if (aud && ['all', 'women', 'men', 'family', 'corporate'].includes(aud)) patch.audience = aud;
  const price = search.get('price');
  if (price) patch.price = price;
  const lane = search.get('lane');
  if (lane && (lane === 'all' || (FULFILLMENT_IDS as string[]).includes(lane))) patch.lane = lane as FulfillmentFilter;
  const sort = search.get('sort');
  if (sort && ['popular', 'rating', 'price-asc', 'price-desc'].includes(sort)) patch.sort = sort;
  return patch;
}

function searchFromFilters(f: CatalogFilters): string {
  const p = new URLSearchParams();
  if (f.category !== 'all') p.set('cat', f.category);
  if (f.query.trim()) p.set('q', f.query.trim());
  if (f.audience !== 'all') p.set('aud', f.audience);
  if (f.price !== 'all') p.set('price', f.price);
  if (f.lane !== 'all') p.set('lane', f.lane);
  if (f.sort !== 'popular') p.set('sort', f.sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/**
 * The client storefront from the redesign: one shell (header, tabs, compare
 * bar, support button, footer) around twelve routed screens plus the legal,
 * payment and vendor pages.
 */
export function Storefront(props: StorefrontProps) {
  const { navigate, sitePage, locationKey } = props;
  const { toast } = useToast();
  const { L } = useLang();
  const pathname = window.location.pathname;
  const search = useMemo(() => new URLSearchParams(window.location.search), [locationKey, pathname]);
  const hospitality = pathname.replace(/\/$/, '').toLowerCase() === '/hospitality';

  const [filters, setFiltersState] = useState<CatalogFilters>(() => ({ ...DEFAULT_FILTERS, ...readFiltersFromSearch(new URLSearchParams(window.location.search), hospitality) }));
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const skipUrlSync = useRef(false);

  // URL → filters (deep links, back/forward).
  useEffect(() => {
    if (sitePage !== 'catalog') return;
    const patch = readFiltersFromSearch(search, hospitality);
    skipUrlSync.current = true;
    setFiltersState((prev) => ({ ...DEFAULT_FILTERS, ...prev, ...patch, query: patch.query ?? (hospitality ? '' : prev.query) }));
  }, [locationKey, sitePage, hospitality, search]);

  // filters → URL while on the catalog (replace, so back leaves the page).
  useEffect(() => {
    if (sitePage !== 'catalog') return;
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const next = (hospitality && filters.category === 'hospitality' ? '/hospitality' : '/catalog') + searchFromFilters(filters);
    if (window.location.pathname + window.location.search !== next) window.history.replaceState({}, '', next);
  }, [filters, sitePage, hospitality]);

  const setFilters = useCallback((patch: Partial<CatalogFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...patch };
      // A free-text search that names a category also narrows to it, as before.
      if (patch.query !== undefined && patch.category === undefined) {
        const mapped = categoryForSearchQuery(patch.query);
        if (mapped && CATEGORY_IDS.has(mapped)) next.category = mapped;
      }
      return next;
    });
  }, []);
  const clearFilters = useCallback(() => setFiltersState({ ...DEFAULT_FILTERS }), []);

  const goHome = useCallback(() => navigate('/'), [navigate]);
  const goCatalog = useCallback(
    (opts?: Partial<CatalogFilters>) => {
      const next = { ...filters, ...(opts || {}) };
      if (opts) setFiltersState(next);
      navigate((next.category === 'hospitality' && !next.query ? '/hospitality' : '/catalog') + searchFromFilters(next));
    },
    [filters, navigate],
  );
  const goProduct = useCallback((id: string) => navigate(pathForProduct(id)), [navigate]);

  // Scroll to top and apply SEO on every screen change.
  useEffect(() => {
    const key =
      sitePage === null
        ? 'home'
        : sitePage === 'catalog'
          ? hospitality
            ? 'hospitality'
            : 'catalog'
          : sitePage === 'vendor-file' || sitePage === 'notfound' || sitePage === 'product'
            ? 'home'
            : sitePage;
    applySeo(key, pathname);
  }, [sitePage, pathname, hospitality, locationKey]);

  /* ───── chat hand-off ───── */
  const canMessageVendors = !props.user || props.user.role === 'client';
  const messageVendor = useCallback(
    (target: ChatTarget) => {
      if (!props.user) {
        try {
          sessionStorage.setItem(PENDING_CHAT_KEY, JSON.stringify(target));
        } catch {
          /* ignore */
        }
        toast(L('سجّل دخولك لتراسل المورّد.', 'Sign in to message the provider.'), 'info');
        navigate('/login?next=/chat');
        return;
      }
      if (props.user.role !== 'client') return;
      setChatTarget(target);
      navigate('/chat');
    },
    [props.user, navigate, toast, L],
  );
  useEffect(() => {
    if (!props.user || props.user.role !== 'client') return;
    try {
      const raw = sessionStorage.getItem(PENDING_CHAT_KEY);
      if (raw) {
        sessionStorage.removeItem(PENDING_CHAT_KEY);
        setChatTarget(JSON.parse(raw) as ChatTarget);
      }
    } catch {
      /* ignore */
    }
  }, [props.user?.id]);
  useEffect(() => {
    if (!props.user) setChatTarget(null);
  }, [props.user]);

  /* ───── compare: two items, newest replaces oldest ───── */
  const toggleCompare = useCallback(
    (service: ServiceItem) => {
      props.setCompared((prev) => {
        if (prev.some((s) => s.id === service.id)) return prev.filter((s) => s.id !== service.id);
        return [...prev.slice(-1), service];
      });
    },
    [props.setCompared],
  );
  const removeFromCompare = useCallback((id: string) => props.setCompared((prev) => prev.filter((s) => s.id !== id)), [props.setCompared]);
  const clearCompare = useCallback(() => props.setCompared([]), [props.setCompared]);

  const addToCart: StorefrontValue['addToCart'] = useCallback(
    (service, quantity, date, time, city, notes) => {
      props.addToCart(service, quantity, date, time, city, notes);
      toast(L('تمت الإضافة للسلة', 'Added to cart'), 'success');
    },
    [props.addToCart, toast, L],
  );

  const value: StorefrontValue = {
    sitePage,
    productId: props.productId,
    vendorPublicId: props.vendorPublicId,
    pathname,
    search,
    navigate,
    goHome,
    goCatalog,
    goProduct,
    services: props.services,
    catalogStatus: props.catalogStatus,
    retryCatalog: props.retryCatalog,
    trending: props.trending,
    filters,
    setFilters,
    clearFilters,
    selectedCity: props.selectedCity,
    setSelectedCity: props.setSelectedCity,
    openRegionPicker: props.openRegionPicker,
    cart: props.cart,
    addToCart,
    updateQuantity: props.updateQuantity,
    removeFromCart: props.removeFromCart,
    clearCart: props.clearCart,
    compared: props.compared,
    toggleCompare,
    removeFromCompare,
    clearCompare,
    user: props.user,
    chatUnread: props.chatUnread,
    canMessageVendors,
    messageVendor,
    chatTarget,
    clearChatTarget: () => setChatTarget(null),
    onAuthSuccess: props.onAuthSuccess,
    logout: props.logout,
    openDashboard: props.openDashboard,
    openCrewPortal: props.openCrewPortal,
    openVoiceAI: props.openVoiceAI,
    openVendorRegister: props.openVendorRegister,
    openCourierRegister: props.openCourierRegister,
    vendorOwnProfile: props.vendorOwnProfile,
  };

  const screen = (() => {
    switch (sitePage) {
      case null:
        return <HomeScreen />;
      case 'catalog':
        return <CatalogScreen />;
      case 'compare':
        return <CompareScreen />;
      case 'product':
        return <ProductScreen />;
      case 'cart':
        return <CartScreen />;
      case 'checkout':
        return <CheckoutScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'account':
        return <AccountScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'login':
        return <LoginPage />;
      case 'request':
        return <RequestScreen />;
      case 'providers':
        return <ProvidersScreen />;
      case 'privacy':
        return <LegalFrame><PrivacyPolicy onBack={goHome} /></LegalFrame>;
      case 'terms':
        return <LegalFrame><TermsOfUse onBack={goHome} /></LegalFrame>;
      case 'refund':
        return <LegalFrame><RefundPolicy onBack={goHome} /></LegalFrame>;
      case 'support':
        return (
          <LegalFrame>
            <SupportPage
              onBack={goHome}
              onSelectCity={(city) => {
                props.setSelectedCity(city);
                goCatalog();
              }}
            />
          </LegalFrame>
        );
      case 'about':
        return <LegalFrame><AboutPage onBack={goHome} /></LegalFrame>;
      case 'vendor-file':
        return props.vendorPublicId ? (
          <VendorPublicPage
            vendorId={props.vendorPublicId}
            onOpenListing={(service) => goProduct(service.id)}
            onMessageVendor={canMessageVendors ? (vendor) => messageVendor(vendor) : undefined}
          />
        ) : null;
      case 'payment-success':
        return <PaymentSuccessPage onBack={goHome} onOrders={() => navigate('/orders')} />;
      case 'payment-cancelled':
        return <PaymentCancelledPage onBack={goHome} onCart={() => navigate('/cart')} />;
      default:
        return (
          <LegalFrame>
            <NotFoundPage
              onBack={goHome}
              onSearch={(query) => goCatalog({ query, category: 'all' })}
              onSelectCategory={(catId) => goCatalog({ category: catId, query: '' })}
            />
          </LegalFrame>
        );
    }
  })();

  return (
    <StorefrontProvider value={value}>
      <div className="min-h-screen flex flex-col bg-paper text-navy">
        <SiteHeader />
        <div className="flex-1">{screen}</div>
        {sitePage !== 'chat' && sitePage !== 'login' ? <SiteFooter /> : null}
        <CompareBar />
        <MobileTabs />
        <WhatsAppFab />
      </div>
    </StorefrontProvider>
  );
}

function LegalFrame({ children }: { children: React.ReactNode }) {
  return <div className="sf-wrap pt-6 pb-10">{children}</div>;
}
