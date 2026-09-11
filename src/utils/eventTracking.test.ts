import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clientHasLiveEvent, eventIsLive, parseEventEnd } from './eventTracking.ts';

describe('eventTracking', () => {
  const now = new Date('2026-08-30T12:00:00');

  it('parses an event end from date and time', () => {
    const end = parseEventEnd('2026-09-05', '23:30');
    assert.equal(end?.getFullYear(), 2026);
    assert.equal(end?.getMonth(), 8);
    assert.equal(end?.getDate(), 5);
    assert.equal(end?.getHours(), 23);
    assert.equal(end?.getMinutes(), 30);
  });

  it('treats a completed or past event as finished', () => {
    assert.equal(eventIsLive('2026-09-05', '23:00', 'completed', now), false);
    assert.equal(eventIsLive('2026-08-20', '23:00', 'confirmed', now), false);
    assert.equal(eventIsLive('2026-09-05', '18:00', 'preparing', now), true);
  });

  it('shows tracking only for a client with a live booking', () => {
    assert.equal(
      clientHasLiveEvent({
        role: 'client',
        phone: '0501111111',
        trackings: [{ clientPhone: '0501111111', eventDate: '2026-09-12', eventTime: '23:30', status: 'preparing' }],
        now,
      }),
      true,
    );
    assert.equal(
      clientHasLiveEvent({
        role: 'client',
        phone: '0501111111',
        trackings: [{ clientPhone: '0501111111', eventDate: '2026-08-01', eventTime: '20:00', status: 'preparing' }],
        now,
      }),
      false,
    );
    assert.equal(
      clientHasLiveEvent({
        role: null,
        phone: '0501111111',
        trackings: [{ clientPhone: '0501111111', eventDate: '2026-09-12', eventTime: '23:30' }],
        now,
      }),
      false,
    );
  });
});
