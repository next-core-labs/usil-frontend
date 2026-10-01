import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { USIL_TEAM_LABEL } from '../../utils/chatApi';
import { ChatInbox, type PinnedChat } from '../chat/ChatInbox';

// Always on top, even before the first message: a vendor should never have to
// hunt for how to reach the platform.
const TEAM_THREAD: PinnedChat = {
  key: 'usil-team',
  kind: 'vendor_owner',
  title: USIL_TEAM_LABEL,
  subtitle: 'الدعم والاستفسارات عن حسابك',
  icon: 'team',
  emptyHint: 'اكتب سؤالك عن الحساب أو المنتجات أو الدفعات، ويرد عليك فريق يوصل هنا.',
};

/** The vendor back office «المحادثات» tab: clients who wrote in, plus the Usil team. */
export function VendorChatDesk() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
          <MessagesSquare className="w-5 h-5 text-action" aria-hidden />
          المحادثات
        </h2>
        <p className="text-sm text-ink-3 mt-1">
          رسائل العملاء الذين راسلوك من صفحات منتجاتك، ومحادثتك مع فريق يوصل.
        </p>
      </div>
      <div className="rounded-panel border border-line bg-surface shadow-e1 overflow-hidden h-[calc(100dvh-14rem)] min-h-[420px]">
        <ChatInbox
          viewer="vendor"
          pinned={[TEAM_THREAD]}
          emptyTitle="لا توجد رسائل من العملاء بعد"
          emptyHint="عندما يراسلك عميل من صفحة منتج أو من ملفك، تظهر محادثته هنا."
        />
      </div>
    </div>
  );
}
