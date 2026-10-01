import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  counterpartName,
  dayLabel,
  mergeMessages,
  senderLabel,
  USIL_TEAM_LABEL,
  type ChatMessage,
  type ConversationSummary,
} from './chatApi.ts';

function message(seq: number, side: ChatMessage['side'] = 'client'): ChatMessage {
  return {
    id: `msg-${seq}`,
    seq,
    side,
    senderId: 'usr',
    senderName: 'مرسل',
    body: `رسالة ${seq}`,
    createdAt: new Date(2026, 8, 30, 10, seq).toISOString(),
  };
}

const clientThread: ConversationSummary = {
  id: 'chat-1',
  kind: 'client_vendor',
  vendorId: 'usr-vendor',
  vendorName: 'قهوة الضيافة',
  clientId: 'usr-client',
  clientName: 'نواف',
  createdAt: '',
  updatedAt: '',
  lastMessage: null,
  unread: 0,
};

const teamThread: ConversationSummary = { ...clientThread, id: 'chat-2', kind: 'vendor_owner', clientId: undefined, clientName: undefined };

describe('mergeMessages', () => {
  it('appends new messages in thread order and drops ones already held', () => {
    const merged = mergeMessages([message(1), message(3)], [message(3), message(2), message(4)]);
    assert.deepEqual(merged.map((m) => m.seq), [1, 2, 3, 4]);
  });

  it('returns the same array when nothing is new, so React can skip a render', () => {
    const current = [message(1)];
    assert.equal(mergeMessages(current, []), current);
    assert.equal(mergeMessages(current, [message(1)]), current);
  });
});

describe('chat labels', () => {
  it('names the other party from each side', () => {
    assert.equal(counterpartName(clientThread, 'client'), 'قهوة الضيافة');
    assert.equal(counterpartName(clientThread, 'vendor'), 'نواف');
    assert.equal(counterpartName(teamThread, 'vendor'), USIL_TEAM_LABEL);
    assert.equal(counterpartName(teamThread, 'owner'), 'قهوة الضيافة');
  });

  it('signs owner messages as the team, never as the admin', () => {
    assert.equal(senderLabel({ ...message(1, 'owner'), senderName: 'مالك يوصل' }, teamThread), USIL_TEAM_LABEL);
    assert.equal(senderLabel(message(1, 'vendor'), clientThread), 'قهوة الضيافة');
    assert.equal(senderLabel(message(1, 'client'), clientThread), 'نواف');
  });

  it('labels today and yesterday by name', () => {
    const now = new Date(2026, 8, 30, 12);
    assert.equal(dayLabel(new Date(2026, 8, 30, 1).toISOString(), now), 'اليوم');
    assert.equal(dayLabel(new Date(2026, 8, 29, 23).toISOString(), now), 'أمس');
    assert.notEqual(dayLabel(new Date(2026, 8, 20).toISOString(), now), 'أمس');
  });
});
