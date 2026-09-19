import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameAccountOrigin } from '../lib/account-origin.js';

test('account mutations require a same-site browser origin', () => {
  assert.equal(sameAccountOrigin(new Request('https://shop.example/api/account')), false);
  assert.equal(sameAccountOrigin(new Request('https://shop.example/api/account', { headers: { origin: 'https://evil.example' } })), false);
  assert.equal(sameAccountOrigin(new Request('https://shop.example/api/account', { headers: { origin: 'https://shop.example' } })), true);
});

test('account origin follows the trusted public proxy host and scheme', () => {
  const headers = { origin: 'https://shop.example', host: 'shop.example', 'x-forwarded-proto': 'https' };
  assert.equal(sameAccountOrigin(new Request('http://internal:3000/api/account', { headers })), true);
  assert.equal(sameAccountOrigin(new Request('http://internal:3000/api/account', { headers: { ...headers, origin: 'http://shop.example' } })), false);
});
