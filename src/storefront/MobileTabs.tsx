import React from 'react';
import { Home, LayoutGrid, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { cn } from '../components/ui/cn';
import { useLang } from './lang';
import { useStorefront } from './context';

/** Five-tab bottom bar from the design: home, services, cart, orders, account. */
export function MobileTabs() {
  const { t } = useLang();
  const sf = useStorefront();
  const page = sf.sitePage;
  const cartCount = sf.cart.reduce((sum, item) => sum + item.quantity, 0);

  const tabs = [
    { id: 'home', label: t.tabHome, icon: Home, active: page === null, go: sf.goHome, badge: 0 },
    { id: 'catalog', label: t.tabCatalog, icon: LayoutGrid, active: page === 'catalog' || page === 'product' || page === 'compare', go: () => sf.goCatalog(), badge: 0 },
    { id: 'cart', label: t.tabCart, icon: ShoppingBag, active: page === 'cart' || page === 'checkout', go: () => sf.navigate('/cart'), badge: cartCount },
    { id: 'orders', label: t.tabOrders, icon: ClipboardList, active: page === 'orders', go: () => sf.navigate('/orders'), badge: 0 },
    { id: 'account', label: t.tabAccount, icon: User, active: page === 'account' || page === 'login' || page === 'chat', go: () => sf.navigate(sf.user ? '/account' : '/login'), badge: sf.chatUnread },
  ];

  return (
    <nav
      className="usil-bottom-nav md:hidden sticky bottom-0 z-[60] bg-surface border-t border-line grid grid-cols-5 px-1.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]"
      aria-label={t.menu}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <a
            key={tab.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              tab.go();
            }}
            aria-current={tab.active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-[3px] py-1.5 min-h-12 no-underline text-[11px] font-semibold',
              tab.active ? 'text-action' : 'text-ink-3',
            )}
          >
            <span
              className={cn(
                'relative flex px-3.5 py-[3px] rounded-lg text-[22px]',
                tab.active ? 'bg-action-200' : 'bg-transparent',
              )}
            >
              <Icon className="w-[22px] h-[22px]" aria-hidden />
              {tab.badge > 0 ? (
                <span className="absolute -top-1 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-action text-white text-[10px] font-bold grid place-items-center border-2 border-surface tnum">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              ) : null}
            </span>
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
