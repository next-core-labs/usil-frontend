import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatInbox, type PinnedChat } from '../../components/chat/ChatInbox';
import { useLang } from '../lang';
import { useStorefront } from '../context';
import { useIsMobile } from '../primitives';

/**
 * «المحادثات» for a signed-in client: the real inbox + thread components inside
 * the design's framed panel (full-bleed on phones).
 */
export function ChatScreen() {
  const { t } = useLang();
  const sf = useStorefront();
  const mobile = useIsMobile();

  if (!sf.user || sf.user.role !== 'client') {
    const guest = !sf.user;
    return (
      <main className="max-w-[900px] mx-auto px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.03em]">{t.chatTitle}</h1>
        <div className="mt-6 py-14 px-6 text-center bg-surface border border-dashed border-navy-300 rounded-card">
          <span className="inline-grid place-items-center w-16 h-16 rounded-card bg-tint-blue text-action">
            <MessageCircle className="w-7 h-7" aria-hidden />
          </span>
          <div className="text-xl font-bold mt-[18px]">{guest ? t.chatGuest : t.chatNotClient}</div>
          <div className="text-sm text-ink-3 mt-1.5">{guest ? t.chatGuestSub : t.chatNotClientSub}</div>
          {guest ? (
            <button type="button" onClick={() => sf.navigate('/login?next=/chat')} className="mt-[22px] h-12 px-6 rounded-xl bg-action text-white text-[15px] font-semibold">
              {t.signIn}
            </button>
          ) : sf.openDashboard ? (
            <button type="button" onClick={sf.openDashboard} className="mt-[22px] h-12 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold">
              {t.mDashboard}
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  const target = sf.chatTarget;
  const pinned: PinnedChat[] = target
    ? [
        {
          key: `vendor:${target.vendorId}`,
          kind: 'client_vendor',
          vendorId: target.vendorId,
          title: target.vendorName,
          subtitle: t.pendingVendor,
          context: target.context,
          emptyHint: t.chatPh,
        },
      ]
    : [];

  return (
    <main className={mobile ? '' : 'sf-wrap pt-6 pb-10'}>
      <div
        className="bg-surface border border-line overflow-hidden"
        style={{
          borderRadius: mobile ? 0 : 20,
          height: mobile ? 'calc(100dvh - 68px - 78px)' : 'min(720px, calc(100dvh - 140px))',
        }}
      >
        <ChatInbox
          key={target?.vendorId || 'inbox'}
          viewer="client"
          pinned={pinned}
          initialPinnedKey={pinned[0]?.key}
          emptyTitle={target ? t.chatTitle : t.chatTitle}
          emptyHint={t.chatGuestSub}
          className="h-full"
        />
      </div>
    </main>
  );
}
