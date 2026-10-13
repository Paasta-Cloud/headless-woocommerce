import test from 'node:test';
import assert from 'node:assert/strict';
import {pagination} from '../lib/pagination.js';

test('empty, first, last and removed last page have truthful ranges',()=>{
  assert.deepEqual(pagination({total:0}),{page:1,pages:1,total:0,from:0,to:0,numbers:[1]});
  const first=pagination({total:1758,perPage:24});
  assert.equal(first.pages,74);assert.equal(first.from,1);assert.equal(first.to,24);
  const last=pagination({page:74,total:1758,perPage:24});
  assert.equal(last.from,1753);assert.equal(last.to,1758);
  assert.equal(pagination({page:3,total:20}).page,1);
  assert.equal(pagination({page:-2,total:21,perPage:0}).page,1);
});
test('navigation stays bounded and includes the current page and both ends',()=>{
  for(const total of [1,20,21,100,1758,100000000])for(const page of [1,2,3,4,40,74,100000000]){
    const model=pagination({page,total});
    assert.ok(model.numbers.length<=5);
    assert.equal(model.numbers[0],1);assert.equal(model.numbers.at(-1),model.pages);
    assert.ok(model.numbers.includes(model.page));
    assert.ok(model.numbers.every((n,i)=>!i||n>model.numbers[i-1]));
    assert.ok(model.from<=model.to&&model.to<=total);
  }
});
