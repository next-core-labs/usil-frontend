import React from 'react';
import { motion } from 'motion/react';
import {
  Store,
  LayoutDashboard,
  Clock,
  User,
  ShoppingBag,
  Users,
  Home,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface MobileBottomNavProps {
  viewMode: 'client' | 'vendor' | 'admin';
  onToggleViewMode: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenVoiceAI: () => void;
  onOpenTracker?: () => void;
  onOpenCrewPortal: () => void;
  onOpenAuth: () => void;
  onGoHome?: () => void;
  currentUser: UserProfile | null;
  onOpenVendorHub?: () => void;
  activeVendorTab?: string;
  onSelectVendorTab?: (tab: any) => void;
}

type NavItem = {
  key: string;
  /** Full accessible name. */
  label: string;
  /** Caption under the icon — kept short so it survives a 320px screen. */
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  tone?: 'default' | 'accent' | 'crew';
};

const TONE_CLASS: Record<NonNullable<NavItem['tone']>, string> = {
  default: 'text-slate-700 active:bg-slate-100',
  accent: 'text-action active:bg-blue-50',
  crew: 'text-emerald-700 active:bg-emerald-50',
};

const NavSlot: React.FC<{ item: NavItem }> = ({ item }) => {
  const Icon = item.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={item.onClick}
      aria-label={item.label}
      className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-2xl min-h-[48px] min-w-0 transition-colors cursor-pointer ${
        TONE_CLASS[item.tone || 'default']
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-2xs font-medium leading-tight truncate max-w-full">{item.short}</span>
    </motion.button>
  );
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onToggleViewMode,
  cartCount,
  onOpenCart,
  onOpenTracker,
  onOpenCrewPortal,
  onOpenAuth,
  onGoHome,
  currentUser,
  onOpenVendorHub,
}) => {
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'accounts_manager';
  const isVendor = currentUser?.role === 'vendor';
  const openVendorHub = () => {
    if (isStaff && onOpenVendorHub) {
      onOpenVendorHub();
      return;
    }
    onToggleViewMode();
  };
  // In client view the button advertises the dashboard; elsewhere, the store.
  const showsDashboard = viewMode === 'client' || (isStaff && viewMode === 'admin');

  const toggleItem: NavItem = showsDashboard
    ? { key: 'dashboard', label: 'لوحة المورد', short: 'اللوحة', icon: LayoutDashboard, onClick: openVendorHub }
    : { key: 'store', label: 'المتجر العام', short: 'المتجر', icon: Store, onClick: openVendorHub, tone: 'accent' };

  const secondaryItem: NavItem = isVendor
    ? { key: 'crew', label: 'بوابة الطاقم', short: 'الطاقم', icon: Users, onClick: onOpenCrewPortal, tone: 'crew' }
    : { key: 'track', label: 'تتبع المناسبة', short: 'تتبع', icon: Clock, onClick: () => onOpenTracker?.(), tone: 'accent' };

  // Exactly two slots per side so the cart FAB lands on the true centre line.
  const leftItems: NavItem[] = [
    toggleItem,
    { key: 'home', label: 'الرئيسية', short: 'الرئيسية', icon: Home, onClick: () => onGoHome?.() },
  ];
  const rightItems: NavItem[] = [
    secondaryItem,
    {
      key: 'account',
      label: currentUser ? 'حسابي' : 'تسجيل الدخول',
      short: currentUser ? 'حسابي' : 'دخول',
      icon: User,
      onClick: onOpenAuth,
    },
  ];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="usil-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] safe-area-pb select-none touch-manipulation pointer-events-auto"
    >
      {/* Five equal tracks: the empty middle one reserves room for the FAB, so
          the FAB sits on the bar's centre line at every screen width. */}
      <div className="relative grid grid-cols-5 items-center gap-0.5 max-w-md mx-auto">
        {leftItems.map((item) => (
          <NavSlot key={item.key} item={item} />
        ))}

        <div aria-hidden className="min-h-[48px]" />

        {rightItems.map((item) => (
          <NavSlot key={item.key} item={item} />
        ))}

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenCart}
          aria-label={cartCount > 0 ? `سلة الحجز — ${cartCount} عناصر` : 'سلة الحجز'}
          className="absolute left-1/2 -translate-x-1/2 -top-5 w-14 h-14 rounded-full bg-gradient-to-tr from-navy via-action to-[#2E90FA] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(21,94,239,0.4)] border-4 border-white active:shadow-inner cursor-pointer pointer-events-auto"
        >
          <ShoppingBag className="w-6 h-6" />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-2xs font-medium flex items-center justify-center border-2 border-white"
            >
              {cartCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
