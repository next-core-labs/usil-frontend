import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Headset, MessagesSquare, SendHorizontal, Tag, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton, cn } from '../ui';
import {
  ChatApiError,
  dayLabel,
  MAX_CHAT_BODY,
  messageTime,
  senderLabel,
  type ChatContext,
  type ChatSide,
  type Conversation,
} from '../../utils/chatApi';
import { useChatThread } from './useChat';

/** The arrow points the way RTL text flows. */
function SendIcon({ className }: { className?: string }) {
  return <SendHorizontal className={cn(className, '-scale-x-100')} aria-hidden />;
}

export type ChatThreadProps = {
  /** null while the pair has no thread yet; the first send starts it via `onStart`. */
  threadId: string | null;
  viewer: ChatSide;
  title: string;
  subtitle?: string;
  /** The Usil team thread shows the support mark instead of an initial, as in the list. */
  team?: boolean;
  /** Shown on narrow screens, where the thread replaces the list. */
  onBack?: () => void;
  onStart?: (body: string, context?: ChatContext) => Promise<Conversation>;
  /** After any successful send, so the inbox can re-sort. */
  onSent?: () => void;
  /** What the client came to ask about; rides on the next message sent. */
  context?: ChatContext;
  emptyTitle?: string;
  emptyHint?: string;
};

export function ChatThread({
  threadId,
  viewer,
  title,
  subtitle,
  team = false,
  onBack,
  onStart,
  onSent,
  context,
  emptyTitle = 'ابدأ المحادثة',
  emptyHint = 'اكتب رسالتك وسيصلك الرد هنا.',
}: ChatThreadProps) {
  const { conversation, status, error, send, retry } = useChatThread(threadId, viewer);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [pendingContext, setPendingContext] = useState<ChatContext | undefined>(context);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setPendingContext(context), [context?.id, context?.type]);

  const messages = conversation?.messages || [];
  const lastId = messages[messages.length - 1]?.id;

  // Follow new messages to the bottom.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastId]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError('');
    try {
      if (threadId) await send(body, pendingContext);
      else if (onStart) await onStart(body, pendingContext);
      setDraft('');
      setPendingContext(undefined);
      onSent?.();
    } catch (err) {
      // The draft stays so nothing the user typed is lost.
      setSendError(err instanceof ChatApiError ? err.message : 'تعذر إرسال الرسالة. حاول مرة أخرى.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <section className="flex flex-col h-full min-h-0 bg-surface" aria-label={`محادثة مع ${title}`}>
      <header className="flex items-center gap-2 px-3 sm:px-4 h-16 border-b border-line shrink-0">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="رجوع إلى المحادثات" className="md:hidden -ms-1">
            <ArrowRight className="w-5 h-5" aria-hidden />
          </Button>
        ) : null}
        <span
          className={cn(
            'w-10 h-10 rounded-control flex items-center justify-center font-bold shrink-0',
            team ? 'bg-sand-100 text-navy' : 'bg-navy text-sand',
          )}
          aria-hidden
        >
          {team ? <Headset className="w-5 h-5" /> : title.trim()[0] || 'ي'}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-navy truncate">{title}</h3>
          {subtitle ? <p className="text-2xs text-ink-3 truncate">{subtitle}</p> : null}
        </div>
      </header>

      <div
        ref={listRef}
        className="grow min-h-0 overflow-y-auto px-3 sm:px-4 py-4 bg-paper"
        aria-live="polite"
        aria-busy={status === 'loading'}
      >
        {status === 'loading' ? (
          <div className="space-y-3" aria-label="جارٍ تحميل الرسائل">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-12 w-1/2 ms-auto" />
            <Skeleton className="h-16 w-3/5" />
          </div>
        ) : status === 'error' ? (
          <ErrorState title="تعذر تحميل المحادثة" description={error} onRetry={retry} />
        ) : !messages.length ? (
          <EmptyState icon={MessagesSquare} title={emptyTitle} description={emptyHint} className="h-full" />
        ) : (
          <ol className="space-y-2">
            {messages.map((message, index) => {
              const mine = message.side === viewer;
              const day = dayLabel(message.createdAt);
              const showDay = index === 0 || dayLabel(messages[index - 1].createdAt) !== day;
              const showName = !mine && (index === 0 || messages[index - 1].side !== message.side || showDay);
              return (
                <li key={message.id}>
                  {showDay ? (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-1 rounded-full bg-surface border border-line text-2xs text-ink-3">{day}</span>
                    </div>
                  ) : null}
                  <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] sm:max-w-[70%] rounded-card px-3 py-2 shadow-e1',
                        mine ? 'bg-navy text-white rounded-se-sm' : 'bg-surface text-ink border border-line rounded-ss-sm',
                      )}
                    >
                      {showName && conversation ? (
                        <p className="text-2xs font-bold text-action mb-0.5">{senderLabel(message, conversation)}</p>
                      ) : null}
                      {message.context ? (
                        <p
                          className={cn(
                            'flex items-center gap-1 text-2xs mb-1',
                            mine ? 'text-white/70' : 'text-ink-3',
                          )}
                        >
                          <Tag className="w-3 h-3 shrink-0" aria-hidden />
                          <span className="truncate">بخصوص: {message.context.title || message.context.id}</span>
                        </p>
                      ) : null}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
                      <p
                        className={cn('text-2xs mt-1 tabular-nums', mine ? 'text-white/60 text-start' : 'text-muted text-end')}
                      >
                        <span className="sr-only">{mine ? 'أرسلتها' : 'وصلت'} </span>
                        {messageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form
        className="border-t border-line p-2 sm:p-3 shrink-0 usil-safe-bottom"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {pendingContext ? (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-control bg-action-50 border border-action-100 text-xs text-ink-2 w-fit max-w-full">
            <Tag className="w-3.5 h-3.5 text-action shrink-0" aria-hidden />
            <span className="truncate">بخصوص: {pendingContext.title}</span>
            <button
              type="button"
              onClick={() => setPendingContext(undefined)}
              className="w-6 h-6 rounded-full hover:bg-action-100 flex items-center justify-center shrink-0"
              aria-label="إزالة الموضوع"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        ) : null}
        {sendError ? (
          <p className="text-xs text-danger mb-2 px-1" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor={`chat-input-${threadId || 'new'}`} className="sr-only">
            اكتب رسالتك
          </label>
          <textarea
            id={`chat-input-${threadId || 'new'}`}
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHAT_BODY))}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_CHAT_BODY}
            enterKeyHint="send"
            placeholder="اكتب رسالتك…"
            disabled={status === 'error'}
            className="grow min-h-11 max-h-32 resize-none rounded-control border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:border-action disabled:bg-line-soft field-sizing-content"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon"
            loading={sending}
            disabled={!draft.trim() || sending || status === 'error'}
            aria-label="إرسال"
            icon={SendIcon}
          />
        </div>
        {draft.length > MAX_CHAT_BODY - 200 ? (
          <p className="text-2xs text-ink-3 mt-1 px-1 tabular-nums">
            {draft.length} / {MAX_CHAT_BODY}
          </p>
        ) : null}
      </form>
    </section>
  );
}
