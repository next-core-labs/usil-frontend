import React, { useMemo, useState } from 'react';
import { Headset, MessagesSquare, Search } from 'lucide-react';
import { CountBadge, EmptyState, ErrorState, Skeleton, cn } from '../ui';
import {
  chatApi,
  counterpartName,
  inboxStamp,
  type ChatContext,
  type ChatKind,
  type ConversationSummary,
} from '../../utils/chatApi';
import { useChatInbox } from './useChat';
import { ChatThread } from './ChatThread';

/**
 * A conversation that may not exist yet, pinned to the top of the list: the
 * vendor's thread with the Usil team, or the vendor a client just tapped
 * «راسل المورّد» on. Threads only exist once a message is sent, so the first
 * send starts it.
 */
export type PinnedChat = {
  key: string;
  kind: ChatKind;
  /** Required for a client's thread; a vendor's team thread is implied by the session. */
  vendorId?: string;
  title: string;
  subtitle?: string;
  context?: ChatContext;
  icon?: 'team';
  emptyHint?: string;
};

type Selection = { type: 'thread'; id: string } | { type: 'pinned'; key: string } | null;

function matches(row: ConversationSummary, pin: PinnedChat): boolean {
  return row.kind === pin.kind && (pin.kind === 'vendor_owner' || row.vendorId === pin.vendorId);
}

export function ChatInbox({
  viewer,
  pinned = [],
  initialPinnedKey,
  emptyTitle,
  emptyHint,
  className,
}: {
  viewer: 'client' | 'vendor';
  pinned?: PinnedChat[];
  /** Opens this pinned conversation straight away. */
  initialPinnedKey?: string;
  emptyTitle: string;
  emptyHint: string;
  className?: string;
}) {
  const { rows, status, error, refresh, retry } = useChatInbox();
  const [selection, setSelection] = useState<Selection>(
    initialPinnedKey ? { type: 'pinned', key: initialPinnedKey } : null,
  );
  const [query, setQuery] = useState('');

  const pinnedRows = pinned.map((pin) => ({ pin, row: rows.find((row) => matches(row, pin)) || null }));
  const pinnedIds = new Set(pinnedRows.map((item) => item.row?.id).filter(Boolean));
  const others = rows.filter((row) => !pinnedIds.has(row.id));

  const needle = query.trim();
  const visibleOthers = useMemo(
    () => (needle ? others.filter((row) => counterpartName(row, viewer).includes(needle)) : others),
    [others, needle, viewer],
  );

  // A pinned selection whose thread now exists is the same conversation as that thread.
  const selectedPin =
    selection?.type === 'pinned' ? pinnedRows.find((item) => item.pin.key === selection.key) || null : null;
  const selectedId =
    selection?.type === 'thread' ? selection.id : selectedPin?.row ? selectedPin.row.id : null;
  const selectedRow = selectedId ? rows.find((row) => row.id === selectedId) || null : null;
  // Opened from its row or from the pin, a pinned conversation keeps its subtitle and hint.
  const activePin = selectedPin?.pin || pinnedRows.find((item) => item.row && item.row.id === selectedId)?.pin;

  const openThread = (id: string) => setSelection({ type: 'thread', id });

  const threadPane = selection ? (
    <ChatThread
      key={selectedId || `pin:${selectedPin?.pin.key}`}
      threadId={selectedId}
      viewer={viewer}
      title={selectedRow ? counterpartName(selectedRow, viewer) : selectedPin?.pin.title || ''}
      subtitle={activePin?.subtitle}
      team={activePin?.icon === 'team'}
      context={selectedPin?.pin.context}
      emptyHint={activePin?.emptyHint}
      onBack={() => setSelection(null)}
      onStart={async (body, context) => {
        const pin = selectedPin?.pin;
        const conversation = await chatApi.start({
          vendorId: pin?.kind === 'client_vendor' ? pin.vendorId : undefined,
          body,
          context,
        });
        await refresh();
        openThread(conversation.id);
        return conversation;
      }}
      onSent={() => void refresh()}
    />
  ) : (
    <div className="hidden md:flex h-full items-center justify-center bg-paper p-6">
      <EmptyState icon={MessagesSquare} title="اختر محادثة" description="اختر محادثة من القائمة لعرض رسائلها." />
    </div>
  );

  const renderRow = (key: string, props: {
    title: string;
    preview: string;
    stamp?: string;
    unread: number;
    active: boolean;
    team?: boolean;
    onClick: () => void;
  }) => (
    <li key={key}>
      <button
        type="button"
        onClick={props.onClick}
        aria-current={props.active ? 'true' : undefined}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 min-h-16 text-start transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action',
          props.active ? 'bg-action-50' : 'hover:bg-paper',
        )}
      >
        <span
          className={cn(
            'w-10 h-10 rounded-control flex items-center justify-center font-bold shrink-0',
            props.team ? 'bg-sand-100 text-navy' : 'bg-navy text-sand',
          )}
          aria-hidden
        >
          {props.team ? <Headset className="w-5 h-5" /> : props.title.trim()[0] || 'ي'}
        </span>
        <span className="min-w-0 grow">
          <span className="flex items-center justify-between gap-2">
            <span className={cn('text-sm truncate', props.unread ? 'font-bold text-navy' : 'font-semibold text-ink')}>
              {props.title}
            </span>
            {props.stamp ? <span className="text-2xs text-muted shrink-0 tabular-nums">{props.stamp}</span> : null}
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span className={cn('text-xs truncate', props.unread ? 'text-ink-2' : 'text-ink-3')}>{props.preview}</span>
            <CountBadge count={props.unread} tone="action" label="رسائل غير مقروءة" />
          </span>
        </span>
      </button>
    </li>
  );

  const preview = (row: ConversationSummary | null, fallback: string) => {
    const last = row?.lastMessage;
    if (!last) return fallback;
    return `${last.side === viewer ? 'أنت: ' : ''}${last.body.replace(/\s+/g, ' ')}`;
  };

  const listPane = (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      {rows.length > 5 ? (
        <div className="p-2 border-b border-line">
          <label className="relative block">
            <span className="sr-only">ابحث في المحادثات</span>
            <Search className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 start-3" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم"
              className="w-full min-h-11 rounded-control border border-line bg-surface ps-9 pe-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
            />
          </label>
        </div>
      ) : null}
      <div className="grow min-h-0 overflow-y-auto">
        {status === 'loading' ? (
          <div className="p-3 space-y-3" aria-busy="true" aria-label="جارٍ تحميل المحادثات">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 shrink-0" />
                <div className="grow space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : status === 'error' ? (
          <ErrorState title="تعذر تحميل المحادثات" description={error} onRetry={retry} className="m-3" />
        ) : (
          <>
            <ul className="divide-y divide-line-soft">
              {pinnedRows.map(({ pin, row }) =>
                renderRow(`pin:${pin.key}`, {
                  title: pin.title,
                  preview: preview(row, pin.subtitle || 'ابدأ المحادثة'),
                  stamp: row?.lastMessage ? inboxStamp(row.lastMessage.createdAt) : undefined,
                  unread: row && row.id !== selectedId ? row.unread : 0,
                  active: Boolean(selection) && (row ? row.id === selectedId : selectedPin?.pin.key === pin.key),
                  team: pin.icon === 'team',
                  onClick: () => (row ? openThread(row.id) : setSelection({ type: 'pinned', key: pin.key })),
                }),
              )}
              {visibleOthers.map((row) =>
                renderRow(row.id, {
                  title: counterpartName(row, viewer),
                  preview: preview(row, ''),
                  stamp: row.lastMessage ? inboxStamp(row.lastMessage.createdAt) : undefined,
                  unread: row.id === selectedId ? 0 : row.unread,
                  active: row.id === selectedId,
                  onClick: () => openThread(row.id),
                }),
              )}
            </ul>
            {!others.length ? (
              <EmptyState icon={MessagesSquare} title={emptyTitle} description={emptyHint} className="border-0 shadow-none" />
            ) : needle && !visibleOthers.length ? (
              <p className="p-4 text-sm text-ink-3 text-center">لا توجد محادثة بهذا الاسم.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('grid md:grid-cols-[320px_1fr] h-full min-h-0 overflow-hidden', className)}>
      <div className={cn('min-h-0 md:border-e border-line', selection ? 'hidden md:block' : 'block')}>{listPane}</div>
      <div className={cn('min-h-0', selection ? 'block' : 'hidden md:block')}>{threadPane}</div>
    </div>
  );
}
