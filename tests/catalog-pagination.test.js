import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {getProducts,getCategories,getHomeProducts} from '../lib/store.js';
import {catalogFilters,catalogHref} from '../lib/catalog-query.js';

async function fixture(run,category) {
  const requests=[];
  const server=createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.searchParams.get('rest_route')==='/paasta-cache/v1/revision'){res.writeHead(404).end();return;}
    requests.push(url);
    res.setHeader('content-type','application/json');
    res.setHeader('x-wp-total','1758');res.setHeader('x-wp-totalpages','74');
    res.end(JSON.stringify([{id:Number(url.searchParams.get('page')||1),name:'کالا',prices:{price:'100',currency_code:'IRT'}}]));
  });
  await new Promise(resolve=>server.listen(0,resolve));
  const previous={url:process.env.WOOCOMMERCE_URL,category:process.env.WOOCOMMERCE_CATEGORY_ID};
  process.env.WOOCOMMERCE_URL=`http://localhost:${server.address().port}`;
  if(category===undefined)delete process.env.WOOCOMMERCE_CATEGORY_ID;else process.env.WOOCOMMERCE_CATEGORY_ID=category;
  try {await run(requests);} finally {
    for(const [key,value] of [['WOOCOMMERCE_URL',previous.url],['WOOCOMMERCE_CATEGORY_ID',previous.category]]){
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
    await new Promise(resolve=>server.close(resolve));
  }
}
test('large catalogue reads one bounded page instead of rejecting or downloading all 1758 products',()=>fixture(async requests=>{
  const result=await getProducts();
  assert.equal(result.error,'');assert.equal(result.total,1758);assert.equal(result.totalPages,74);
  assert.equal(result.page,1);assert.equal(requests.length,1);assert.equal(requests[0].searchParams.get('per_page'),'24');
}));
test('later pages, search, prices, stock and sorting reach WooCommerce rather than filtering a local sample',()=>fixture(async requests=>{
  const result=await getProducts({page:74,query:'کیف',min:'10.25',max:'40',minorUnit:2,stock:true,sort:'cheap',category:9});
  assert.equal(result.error,'');assert.equal(result.page,74);
  const query=requests[0].searchParams;
  for(const [key,value] of Object.entries({page:'74',search:'کیف',min_price:'1025',max_price:'4000','stock_status[]':'instock',orderby:'price',order:'asc',category:'7,9',category_operator:'and'}))assert.equal(query.get(key),value,key);
},'7'));
test('malformed category configuration fails explicitly without silently widening the selected catalogue',()=>fixture(async requests=>{
  const result=await getProducts();assert.match(result.error,/دسته‌بندی/);assert.equal(requests.length,0);assert.deepEqual(result.products,[]);
},'undefined'));
test('page and batch size are bounded independently of total catalogue size',()=>fixture(async requests=>{
  const result=await getProducts({page:-3,perPage:100000});assert.equal(result.error,'');
  assert.equal(requests[0].searchParams.get('page'),'1');assert.equal(requests[0].searchParams.get('per_page'),'100');
}));
test('an empty manual selection does not become an unrestricted catalogue query',()=>fixture(async requests=>{
  const result=await getProducts({include:[]});assert.equal(result.error,'');assert.equal(result.total,0);assert.equal(requests.length,0);
}));
test('page links preserve committed search, stock, amounts, currency precision and sorting',()=>{
  const filters=catalogFilters({q:'كيف',stock:'1',min:'10.25',max:'40',minor:'2',sort:'cheap',page:'74'});
  const url=new URL(catalogHref('/category/9',filters,73),'https://front.example');
  assert.equal(url.pathname,'/category/9');assert.equal(url.searchParams.get('q'),'کیف');
  for(const [key,value] of Object.entries({stock:'1',min:'10.25',max:'40',minor:'2',sort:'cheap',page:'73'}))assert.equal(url.searchParams.get(key),value);
  assert.equal(catalogFilters({page:['1','2'],minor:'1.5',q:['unsafe']}).page,1);
  assert.equal(catalogFilters({minor:'1.5'}).minorUnit,0);
});
test('home sections and complete taxonomy do not depend on the first product page, disabled sections make no requests',async()=>{
  const originalFetch=global.fetch,previous={url:process.env.WOOCOMMERCE_URL,category:process.env.WOOCOMMERCE_CATEGORY_ID},requests=[];
  process.env.WOOCOMMERCE_URL='http://localhost:19371';delete process.env.WOOCOMMERCE_CATEGORY_ID;
  global.fetch=async input=>{
    const url=new URL(input),route=url.searchParams.get('rest_route');
    if(route==='/paasta-cache/v1/revision')return new Response('',{status:404});
    requests.push(url);
    if(route.endsWith('/categories'))return Response.json([{id:99,name:'دستهٔ مستقل',count:1200,image:{src:'https://example.test/category.jpg'}}]);
    const id=Number(url.searchParams.get('include')||url.searchParams.get('category')||1);
    return Response.json([{id,name:'نمونه',categories:[{id:99,name:'دستهٔ مستقل'}]}],{headers:{'x-wp-total':'1200','x-wp-totalpages':'50'}});
  };
  try {
    const design={sections:[{enabled:true,type:'products',source:'category',categoryId:99,limit:8,sort:'cheap'},{enabled:true,type:'products',source:'manual',productIds:[1758],limit:4},{enabled:false,type:'products',source:'category',categoryId:123,limit:100},{enabled:true,type:'categories',presentation:'showcase',categoryIds:[99],limit:1}]};
    const result=await getHomeProducts(design);
    assert.equal(result.error,'');assert.equal(result.categories[0].count,1200);
    assert.equal(result.sectionStores[0].products[0].id,99);assert.equal(result.sectionStores[1].products[0].id,1758);
    assert.equal(result.sectionStores[3].products[0].id,99);
    assert.equal(requests.length,5);assert.ok(requests.every(url=>url.searchParams.get('category')!=='123'));
    assert.equal(requests.find(url=>url.searchParams.get('category')==='99').searchParams.get('per_page'),'8');
    assert.equal((await getCategories()).categories[0].id,99);
  }finally{global.fetch=originalFetch;for(const [key,value] of [['WOOCOMMERCE_URL',previous.url],['WOOCOMMERCE_CATEGORY_ID',previous.category]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
