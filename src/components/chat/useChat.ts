import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chatApi,
  ChatApiError,
  CHAT_READ_EVENT,
  INBOX_POLL_MS,
  mergeMessages,
  THREAD_POLL_MS,
  UNREAD_POLL_MS,
  type ChatContext,
  type ChatMessage,
  type ChatSide,
  type Conversation,
  type ConversationSummary,
} from '../../utils/chatApi';

/**
 * Run `task` now and every `intervalMs` while the page is visible. A hidden
 * tab (or a backgrounded native app) stops polling, and coming back runs it at
 * once so the screen is never a full interval stale.
 */
function useVisiblePoll(task: () => void | Promise<void>, intervalMs: number, enabled: boolean) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (!document.hidden) void taskRef.current();
    };
    run();
    const timer = window.setInterval(run, intervalMs);
    document.addEventListener('visibilitychange', run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
    };
  }, [intervalMs, enabled]);
}

export type LoadStatus = 'loading' | 'ready' | 'error';

function errorText(error: unknown): string {
  return error instanceof ChatApiError ? error.message : 'تعذر تحميل المحادثات.';
}

/** The viewer's conversations, newest activity first. */
export function useChatInbox(enabled = true) {
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setRows(await chatApi.list());
      setStatus('ready');
      setError('');
    } catch (err) {
      // A failed background poll keeps the list on screen; only a first load shows the error.
      setStatus((prev) => (prev === 'ready' ? prev : 'error'));
      setError(errorText(err));
    }
  }, []);

  useVisiblePoll(refresh, INBOX_POLL_MS, enabled);

  const retry = useCallback(() => {
    setStatus('loading');
    void refresh();
  }, [refresh]);

  return { rows, status, error, refresh, retry };
}

/** Total unread messages across the viewer's threads, for nav badges. */
export function useUnreadChats(enabled: boolean) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    try {
      setCount(await chatApi.unread());
    } catch {
      /* a badge is not worth an error; keep the last count */
    }
  }, []);
  useVisiblePoll(load, UNREAD_POLL_MS, enabled);
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const onRead = () => void load();
    window.addEventListener(CHAT_READ_EVENT, onRead);
    return () => window.removeEventListener(CHAT_READ_EVENT, onRead);
  }, [enabled, load]);
  return count;
}

/**
 * One open thread. Polls for messages after the last one held, and marks the
 * thread read whenever the other side's messages are on screen.
 */
export function useChatThread(threadId: string | null, viewer: ChatSide) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState('');
  const lastIdRef = useRef<string | undefined>(undefined);
  const lastReadSeqRef = useRef(0);

  useEffect(() => {
    setConversation(null);
    setStatus(threadId ? 'loading' : 'ready');
    setError('');
    lastIdRef.current = undefined;
    lastReadSeqRef.current = 0;
  }, [threadId]);

  const markReadIfNeeded = useCallback(
    (id: string, messages: ChatMessage[]) => {
      const latestIncoming = [...messages].reverse().find((message) => message.side !== viewer);
      if (!latestIncoming || latestIncoming.seq <= lastReadSeqRef.current || document.hidden) return;
      lastReadSeqRef.current = latestIncoming.seq;
      chatApi.markRead(id).catch(() => {
        lastReadSeqRef.current = 0;
      });
    },
    [viewer],
  );

  const apply = useCallback(
    (id: string, next: Conversation, incremental: boolean) => {
      setConversation((prev) => {
        if (!prev || prev.id !== id || !incremental) return next;
        return { ...next, messages: mergeMessages(prev.messages, next.messages) };
      });
      const last = next.messages[next.messages.length - 1];
      if (last) lastIdRef.current = last.id;
      markReadIfNeeded(id, next.messages);
    },
    [markReadIfNeeded],
  );

  const poll = useCallback(async () => {
    if (!threadId) return;
    const after = lastIdRef.current;
    try {
      const next = await chatApi.get(threadId, after);
      apply(threadId, next, Boolean(after));
      setStatus('ready');
      setError('');
    } catch (err) {
      setStatus((prev) => (prev === 'ready' ? prev : 'error'));
      setError(errorText(err));
    }
  }, [threadId, apply]);

  useVisiblePoll(poll, THREAD_POLL_MS, Boolean(threadId));

  const send = useCallback(
    async (body: string, context?: ChatContext) => {
      if (!threadId) throw new ChatApiError('المحادثة غير موجودة.', 404);
      const message = await chatApi.send(threadId, body, context);
      setConversation((prev) =>
        prev && prev.id === threadId ? { ...prev, messages: mergeMessages(prev.messages, [message]) } : prev,
      );
      // The poll cursor stays put: a reply that landed just before this message
      // would be skipped by `after=<this id>`. The next poll re-sends ours and
      // mergeMessages drops the duplicate.
    },
    [threadId],
  );

  const retry = useCallback(() => {
    setStatus('loading');
    lastIdRef.current = undefined;
    void poll();
  }, [poll]);

  return { conversation, status, error, send, retry };
}
