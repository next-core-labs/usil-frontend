import React from 'react';
import { Modal } from '../ui';
import type { ChatContext } from '../../utils/chatApi';
import { ChatInbox, type PinnedChat } from './ChatInbox';

export type ChatTarget = { vendorId: string; vendorName: string; context?: ChatContext };

/**
 * «رسائلي» for a signed-in client. Opened from the account menus with no
 * target, or from «راسل المورّد» with the vendor (and product) to talk about.
 */
export function ClientChatModal({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: () => void;
  target?: ChatTarget | null;
}) {
  const pinned: PinnedChat[] = target
    ? [
        {
          key: `vendor:${target.vendorId}`,
          kind: 'client_vendor',
          vendorId: target.vendorId,
          title: target.vendorName,
          subtitle: 'مورّد على يوصل',
          context: target.context,
          emptyHint: 'اسأل عن التوفر أو التفاصيل قبل الحجز. يصلك رد المورّد هنا.',
        },
      ]
    : [];

  return (
    <Modal open={open} onClose={onClose} title="رسائلي" description="محادثاتك مع المورّدين" size="xl">
      <ChatInbox
        // Remount per target so «راسل المورّد» always lands on that vendor.
        key={target?.vendorId || 'inbox'}
        viewer="client"
        pinned={pinned}
        initialPinnedKey={pinned[0]?.key}
        emptyTitle={target ? 'لا توجد محادثات أخرى' : 'لا توجد محادثات بعد'}
        emptyHint="راسل أي مورّد من صفحة منتجه أو ملفه، وتظهر محادثتكم هنا."
        className="-m-4 sm:-m-5 h-[min(70dvh,640px)]"
      />
    </Modal>
  );
}
