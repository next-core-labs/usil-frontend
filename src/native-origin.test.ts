import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_ORIGIN, toRemoteUrl } from './native-origin.ts';

test('rewrites the API-owned root-relative prefixes', () => {
  assert.equal(toRemoteUrl('/api/auth/me'), `${API_ORIGIN}/api/auth/me`);
  assert.equal(toRemoteUrl('/uploads/listing-a.jpg'), `${API_ORIGIN}/uploads/listing-a.jpg`);
  assert.equal(toRemoteUrl('/api/v1/track/ABC?x=1'), `${API_ORIGIN}/api/v1/track/ABC?x=1`);
});

test('leaves bundled app assets alone', () => {
  assert.equal(toRemoteUrl('/assets/index-DVY.js'), '/assets/index-DVY.js');
  assert.equal(toRemoteUrl('/manifest.json'), '/manifest.json');
  assert.equal(toRemoteUrl('/'), '/');
});

test('leaves absolute and data URLs alone', () => {
  assert.equal(toRemoteUrl(`${API_ORIGIN}/api/auth/me`), `${API_ORIGIN}/api/auth/me`);
  assert.equal(toRemoteUrl('https://other.example/api/x'), 'https://other.example/api/x');
  assert.equal(toRemoteUrl('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
});

test('does not rewrite paths that merely contain the prefix', () => {
  assert.equal(toRemoteUrl('/vendor/api/list'), '/vendor/api/list');
  assert.equal(toRemoteUrl('/apifoo/x'), '/apifoo/x');
});
