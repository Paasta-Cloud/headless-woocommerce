import test from 'node:test';
import assert from 'node:assert/strict';
import {responsiveImage} from '../lib/responsive-image.js';

test('responsive siblings exist only for our bounded, precomputed WebP files',()=>{
  const prefix='https://site.ir/wp-content/uploads/paasta-optimized/0123456789abcdef01234567/image-';
  const result=responsiveImage(prefix+'1536w.webp','640px');
  assert.equal(result.sizes,'640px');
  assert.equal(result.srcSet.split(', ').length,7);
  assert.ok(result.srcSet.endsWith(prefix+'1536w.webp 1536w'));
  assert.ok(!result.srcSet.includes('1920w'));
  assert.equal(responsiveImage(prefix+'100w.webp').srcSet,prefix+'100w.webp 100w');
  for(const value of [undefined,'https://site.ir/photo.png',prefix+'99999w.webp',prefix+'320w.webp?private=1','http://site.ir/image.webp'])assert.deepEqual(responsiveImage(value),{});
});
