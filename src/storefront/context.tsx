import React, { createContext, useContext } from 'react';
import type { BookingItem, ServiceItem, UserProfile } from '../types';
import type { SitePage } from '../utils/siteRoutes';
import type { FulfillmentFilter } from '../data/saudiMarket';
import type { ChatTarget } from '../components/chat/ClientChatModal';
import type { SessionUser } from '../LoginScreen';
import type { TrendingService } from '../utils/trendingApi';

export type Navigate = (path: string, opts?: { replace?: boolean; scroll?: boolean }) => void;

export type CatalogFilters = {
  category: string;
  audience: string;
  query: string;
  sort: string;
  price: string;
  lane: FulfillmentFilter;
};

export type StorefrontValue = {
  /* routing */
  sitePage: SitePage;
  productId: string | null;
  vendorPublicId: string | null;
  pathname: string;
  search: URLSearchParams;
  navigate: Navigate;
  goHome: () => void;
  goCatalog: (opts?: Partial<CatalogFilters>) => void;
  goProduct: (id: string) => void;

  /* catalog */
  services: ServiceItem[];
  catalogStatus: 'loading' | 'ready' | 'error';
  retryCatalog: () => void;
  /** «ترند هالأسبوع» from the API, ranked; empty while loading or when it failed. */
  trending: TrendingService[];
  filters: CatalogFilters;
  setFilters: (patch: Partial<CatalogFilters>) => void;
  clearFilters: () => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  openRegionPicker: () => void;

  /* cart */
  cart: BookingItem[];
  addToCart: (service: ServiceItem, quantity?: number, date?: string, time?: string, city?: string, notes?: string) => void;
  updateQuantity: (serviceId: string, delta: number) => void;
  removeFromCart: (serviceId: string) => void;
  clearCart: () => void;

  /* compare (two items, as in the design) */
  compared: ServiceItem[];
  toggleCompare: (service: ServiceItem) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  /* account */
  user: UserProfile | null;
  chatUnread: number;
  canMessageVendors: boolean;
  messageVendor: (target: ChatTarget) => void;
  chatTarget: ChatTarget | null;
  clearChatTarget: () => void;
  onAuthSuccess: (user: SessionUser) => void;
  logout: () => void | Promise<void>;
  openDashboard?: () => void;
  openCrewPortal?: () => void;
  openVoiceAI: () => void;
  openVendorRegister: () => void;
  openCourierRegister: () => void;
  vendorOwnProfile: import('../contracts/vendors/vendor-profile').VendorOwnProfile | null;
};

const StorefrontContext = createContext<StorefrontValue | null>(null);

export const StorefrontProvider = StorefrontContext.Provider;

export function useStorefront(): StorefrontValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) throw new Error('useStorefront must be used inside <StorefrontProvider>');
  return ctx;
}
