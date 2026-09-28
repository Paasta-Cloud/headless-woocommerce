import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFavoriteIds } from '../lib/favorites.js';
import { shoppingGuide, storefrontConfig } from '../lib/storefront-config.js';

test('frontend-owned navigation covers discovery, favorites, help and account', () => {
  assert.deepEqual(storefrontConfig.navigation.map(item => item.href), ['/#products', '/favorites', '/guide', '/account']);
  assert.ok(shoppingGuide.length >= 4);
  assert.ok(shoppingGuide.every(item => item.title && item.body));
});

test('favorite ids are local, bounded integers and deduplicated', () => {
  assert.deepEqual(readFavoriteIds('[4,4,7,-1,"9",null]'), [4, 7]);
  assert.deepEqual(readFavoriteIds('not-json'), []);
  assert.deepEqual(readFavoriteIds('{"id":4}'), []);
});

test('storefront exposes sorting and frontend-owned routes without a WordPress page dependency', () => {
  const source = readFileSync('app/storefront.jsx', 'utf8');
  const favorites = readFileSync('app/favorites/page.js', 'utf8');
  const guide = readFileSync('app/guide/page.js', 'utf8');
  assert.match(source, /value="price-asc"/);
  assert.match(source, /href="\/favorites"/);
  assert.match(source, /href="\/guide"/);
  assert.doesNotMatch(favorites + guide, /wp-json|wordpress/i);
});
