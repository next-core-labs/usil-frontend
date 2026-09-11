import React from 'react';
import { motion } from 'motion/react';
import {
  Store,
  LayoutDashboard,
  Clock,
  User,
  ShoppingBag,
  Users,
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
  currentUser: UserProfile | null;
  onOpenVendorHub?: () => void;
  activeVendorTab?: string;
  onSelectVendorTab?: (tab: any) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  onToggleViewMode,
  cartCount,
  onOpenCart,
  onOpenTracker,
  onOpenCrewPortal,
  onOpenAuth,
  currentUser,
  onOpenVendorHub,
}) => {
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'accounts_manager';
  const openVendorHub = () => {
    if (isStaff && onOpenVendorHub) {
      onOpenVendorHub();
      return;
    }
    onToggleViewMode();
  };
  const vendorLabel = viewMode === 'client' || (isStaff && viewMode === 'admin');
  return (
    <motion.div 
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="usil-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] safe-area-pb select-none touch-manipulation pointer-events-auto"
    >
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Switch Mode (Client Store <-> Vendor OS) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={openVendorHub}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] min-h-[48px] transition-colors cursor-pointer ${
            vendorLabel
              ? 'text-slate-700 active:bg-slate-100'
              : 'text-[#155EEF] font-bold active:bg-blue-50'
          }`}
        >
          {vendorLabel ? (
            <>
              <LayoutDashboard className="w-5 h-5 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold leading-tight">لوحة المورد</span>
            </>
          ) : (
            <>
              <Store className="w-5 h-5 mb-0.5 text-[#155EEF]" />
              <span className="text-[10px] font-bold leading-tight">المتجر العام</span>
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onOpenCart}
          aria-label="سلة الحجز"
          className="relative z-[2] -top-5 w-14 h-14 rounded-full bg-gradient-to-tr from-[#0A1A33] via-[#155EEF] to-[#2E90FA] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(21,94,239,0.4)] border-4 border-white active:shadow-inner cursor-pointer pointer-events-auto"
        >
          <ShoppingBag className="w-6 h-6" />
        </motion.button>

        {currentUser?.role === 'vendor' ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenCrewPortal}
            className="flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] min-h-[48px] text-slate-700 active:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Users className="w-5 h-5 mb-0.5 text-emerald-600" />
            <span className="text-[10px] font-bold leading-tight text-emerald-700">بوابة الطاقم</span>
          </motion.button>
        ) : onOpenTracker ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenTracker}
            className="flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] min-h-[48px] text-[#155EEF] active:bg-blue-50 transition-colors cursor-pointer"
          >
            <Clock className="w-5 h-5 mb-0.5 text-[#155EEF]" />
            <span className="text-[10px] font-bold leading-tight">تتبع المناسبة</span>
          </motion.button>
        ) : (
          <div className="min-w-[56px] min-h-[48px]" />
        )}

        {/* Cart (Client) or Profile (Vendor) */}
        {viewMode === 'client' ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenCart}
            className="relative flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] min-h-[48px] text-slate-700 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 mb-0.5 text-slate-700" />
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#155EEF] text-white text-[9px] font-black flex items-center justify-center shadow-xs"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-bold leading-tight">السلة</span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenAuth}
            className="flex flex-col items-center justify-center p-2 rounded-2xl min-w-[56px] min-h-[48px] text-slate-700 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <User className="w-5 h-5 mb-0.5 text-slate-700" />
            <span className="text-[10px] font-bold leading-tight">
              {currentUser ? 'حسابي' : 'دخول'}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
