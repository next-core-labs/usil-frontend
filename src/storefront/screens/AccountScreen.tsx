import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  MessageCircle,
  Heart,
  Globe,
  Headset,
  LogOut,
  LayoutDashboard,
  Users,
  Mic,
  MailCheck,
  MapPin,
  User,
} from 'lucide-react';
import { roleLabelAr } from '../../contracts/auth/roles';
import { VendorOwnFileCard } from '../../components/vendor/VendorOwnFileCard';
import { ALL_CITIES_LABEL } from '../../data/saudiPlaces';
import { cn } from '../../components/ui/cn';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { ChevronForward } from '../primitives';
import { ProductCard } from '../ProductCard';
import { useFavorites } from '../favorites';
import { formatCount } from '../money';

/** Account page: navy profile card, two honest tiles (orders, unread), menu list, favourites. */
export function AccountScreen() {
  const { t, ar, toggle } = useLang();
  const sf = useStorefront();
  const fav = useFavorites();
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    if (!sf.user) return;
    fetch('/api/bookings', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrderCount(d && Array.isArray(d.data) ? d.data.length : null))
      .catch(() => setOrderCount(null));
  }, [sf.user]);

  const favItems = sf.services.filter((s) => fav.has(s.id));

  if (!sf.user) {
    return (
      <main className="max-w-[900px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        <div className="bg-navy text-white rounded-card p-[clamp(20px,3vw,28px)] flex items-center gap-[18px] flex-wrap">
          <span className="w-16 h-16 rounded-card bg-action grid place-items-center">
            <User className="w-7 h-7" aria-hidden />
          </span>
          <div className="flex-1 min-w-[180px]">
            <div className="text-[22px] font-bold tracking-[-0.02em]">{t.accGuestTitle}</div>
            <div className="text-sm text-on-navy-muted mt-1">{t.accGuestSub}</div>
          </div>
          <button type="button" onClick={() => sf.navigate('/login')} className="h-11 px-4 rounded-control bg-surface text-navy text-sm font-semibold">
            {t.accGuestBtn}
          </button>
        </div>
        {favItems.length ? <Favorites items={favItems} /> : null}
      </main>
    );
  }

  const user = sf.user;
  const initial = (user.name || 'ي').trim()[0] || 'ي';
  const roleLabel = ar ? roleLabelAr(user.role) : user.role;

  const menu: Array<{ label: string; Icon: React.ComponentType<{ className?: string }>; go: () => void; badge?: number }> = [
    { label: t.mOrders, Icon: ClipboardList, go: () => sf.navigate('/orders') },
    ...(user.role === 'client' ? [{ label: t.mChats, Icon: MessageCircle, go: () => sf.navigate('/chat'), badge: sf.chatUnread }] : []),
    { label: t.mFav, Icon: Heart, go: () => document.getElementById('sf-favorites')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: `${t.mRegion}: ${sf.selectedCity === ALL_CITIES_LABEL || !sf.selectedCity ? t.allRegions : sf.selectedCity}`, Icon: MapPin, go: sf.openRegionPicker },
    { label: `${t.mLang}: ${ar ? 'English' : 'العربية'}`, Icon: Globe, go: toggle },
    { label: t.mSupport, Icon: Headset, go: () => sf.navigate('/support') },
    ...(sf.openDashboard ? [{ label: t.mDashboard, Icon: LayoutDashboard, go: sf.openDashboard }] : []),
    ...(sf.openCrewPortal ? [{ label: t.mCrew, Icon: Users, go: sf.openCrewPortal }] : []),
    { label: t.mVoice, Icon: Mic, go: sf.openVoiceAI },
  ];

  return (
    <main className="max-w-[900px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
      <div className="bg-navy text-white rounded-card p-[clamp(20px,3vw,28px)] flex items-center gap-[18px] flex-wrap">
        {user.avatarUrl || user.avatar ? (
          <img src={user.avatarUrl || user.avatar} alt="" className="w-16 h-16 rounded-card object-cover bg-action" />
        ) : (
          <span className="w-16 h-16 rounded-card bg-action grid place-items-center text-[26px] font-bold" aria-hidden>
            {initial}
          </span>
        )}
        <div className="flex-1 min-w-[180px]">
          <div className="text-[22px] font-bold tracking-[-0.02em]">{user.name}</div>
          <div dir="ltr" className="text-sm text-on-navy-muted mt-1 text-start tnum">
            {user.phone}
            {user.email ? ` · ${user.email}` : ''}
          </div>
          <div className="text-xs text-on-navy-muted mt-0.5">{roleLabel}</div>
        </div>
        {user.emailVerified === false ? (
          <button type="button" onClick={() => sf.navigate('/login?mode=verify')} className="h-10 px-4 rounded-control bg-warning-bg text-warning text-sm font-semibold inline-flex items-center gap-1.5">
            <MailCheck className="w-4 h-4" aria-hidden />
            {t.mVerify}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3 mt-3">
        <button type="button" onClick={() => sf.navigate('/orders')} className="bg-surface border border-line rounded-card p-[18px] flex items-center gap-3.5 text-start hover:border-action transition-colors">
          <span className="w-11 h-11 rounded-xl bg-tint-blue text-action grid place-items-center">
            <ClipboardList className="w-[22px] h-[22px]" aria-hidden />
          </span>
          <div>
            <div className="text-xs text-ink-3">{t.tileOrders}</div>
            <div className="text-xl font-bold tracking-[-0.02em] tnum">{orderCount === null ? '—' : formatCount(orderCount)}</div>
          </div>
        </button>
        <button type="button" onClick={() => sf.navigate(user.role === 'client' ? '/chat' : '/account')} className="bg-surface border border-line rounded-card p-[18px] flex items-center gap-3.5 text-start hover:border-action transition-colors">
          <span className="w-11 h-11 rounded-xl bg-tint-blue text-action grid place-items-center">
            <MessageCircle className="w-[22px] h-[22px]" aria-hidden />
          </span>
          <div>
            <div className="text-xs text-ink-3">{t.tileChats}</div>
            <div className="text-xl font-bold tracking-[-0.02em] tnum">{formatCount(sf.chatUnread)}</div>
          </div>
        </button>
        <div className="bg-surface border border-line rounded-card p-[18px] flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-tint-blue text-action grid place-items-center">
            <Heart className="w-[22px] h-[22px]" aria-hidden />
          </span>
          <div>
            <div className="text-xs text-ink-3">{t.tileFav}</div>
            <div className="text-xl font-bold tracking-[-0.02em] tnum">{formatCount(fav.ids.length)}</div>
          </div>
        </div>
      </div>

      {sf.vendorOwnProfile ? (
        <div className="mt-3">
          <VendorOwnFileCard profile={sf.vendorOwnProfile} compact />
        </div>
      ) : null}

      <div className="bg-surface border border-line rounded-card mt-3 overflow-hidden">
        {menu.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={m.go}
            className="w-full flex items-center gap-3.5 px-[18px] py-4 border-b border-line-soft text-navy text-[15px] font-medium text-start transition-colors hover:bg-paper min-h-0"
          >
            <span className="w-9 h-9 rounded-control bg-paper text-action grid place-items-center shrink-0">
              <m.Icon className="w-[18px] h-[18px]" aria-hidden />
            </span>
            <span className="flex-1 min-w-0 truncate">{m.label}</span>
            {m.badge ? <span className="min-w-5 h-5 px-1.5 rounded-full bg-action text-white text-[11px] font-bold grid place-items-center tnum">{m.badge}</span> : null}
            <ChevronForward className="w-4 h-4 text-ink-3" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => void sf.logout()}
          className="w-full flex items-center gap-3.5 px-[18px] py-4 text-danger text-[15px] font-medium text-start transition-colors hover:bg-paper min-h-0"
        >
          <span className="w-9 h-9 rounded-control bg-danger-bg grid place-items-center shrink-0">
            <LogOut className="w-[18px] h-[18px]" aria-hidden />
          </span>
          {t.mLogout}
        </button>
      </div>

      <Favorites items={favItems} />
    </main>
  );
}

function Favorites({ items }: { items: import('../../types').ServiceItem[] }) {
  const { t } = useLang();
  const sf = useStorefront();
  const fav = useFavorites();
  return (
    <section id="sf-favorites" className="mt-8 scroll-mt-24">
      <h2 className="text-[clamp(20px,2.6vw,26px)] font-bold tracking-[-0.03em] mb-3.5">{t.mFav}</h2>
      {items.length === 0 ? (
        <div className="py-10 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <div className="text-base font-bold">{t.favEmpty}</div>
          <div className="text-sm text-ink-3 mt-1">{t.favEmptySub}</div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-3.5">
          {items.map((s) => (
            <ProductCard
              key={s.id}
              service={s}
              onOpen={(x) => sf.goProduct(x.id)}
              favorite
              onToggleFavorite={fav.toggle}
              compared={sf.compared.some((c) => c.id === s.id)}
              onToggleCompare={sf.toggleCompare}
              className="h-full"
            />
          ))}
        </div>
      )}
    </section>
  );
}
