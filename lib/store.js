import {publicVersionedRead} from './public-revision.js';
import {wordpressRestUrl} from './wordpress-rest.js';
import {filterProducts,catalogCategories} from './catalog.js';
import {catalogFilters} from './catalog-query.js';
export const demoProducts = [
  { id: 1, name: 'چراغ مطالعه آرا', category: 'خانه و زندگی', price: 890000, unit: 'تومان', image: '', label: 'آرا', tone: 'sand', description: 'نوری آرام برای میز کار و مطالعه.', type: 'simple' },
  { id: 2, name: 'ماگ سرامیکی رُستا', category: 'خانه و زندگی', price: 420000, unit: 'تومان', image: '', label: 'رُستا', tone: 'clay', description: 'یک همراه ساده برای لحظه‌های روزمره.', type: 'simple' },
  { id: 3, name: 'هدفون بی‌سیم موج', category: 'دیجیتال', price: 2490000, unit: 'تومان', image: '', label: 'موج', tone: 'stone', description: 'طراحی سبک و بی‌حاشیه برای شنیدن روزانه.', type: 'simple' },
  { id: 4, name: 'دفتر نقطه‌ای روز', category: 'لوازم تحریر', price: 185000, unit: 'تومان', image: '', label: 'روز', tone: 'olive', description: 'فضایی برای یادداشت‌ها و ایده‌های تازه.', type: 'simple' },
  { id: 5, name: 'اسپیکر رومیزی نوا', category: 'دیجیتال', price: 1790000, unit: 'تومان', image: '', label: 'نوا', tone: 'blue', description: 'صدای دلخواه، در اندازه‌ای جمع‌وجور.', type: 'simple' },
  { id: 6, name: 'گلدان سفالی لاله', category: 'خانه و زندگی', price: 365000, unit: 'تومان', image: '', label: 'لاله', tone: 'rose', description: 'یک جزئیات گرم برای گوشهٔ خانه.', type: 'simple' },
];

export function formatPrice(value) {
  return new Intl.NumberFormat('fa-IR').format(value) + ' تومان';
}

export function storeOrigin() {
  const configured = process.env.WOOCOMMERCE_URL?.trim();
  if (!configured || configured === 'demo') return null;
  const url = new URL(configured);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('WooCommerce origin must use HTTPS');
  }
  return url.origin;
}

function priceUnit(currency) {
  const code = String(currency || '').toUpperCase();
  return code === 'IRR' ? 'ریال' : code === 'IRT' || code === 'TOMAN' ? 'تومان' : code;
}

export function normalizeProduct(item) {
  const amount = Number(item?.prices?.price);
  const minor = Number(item?.prices?.currency_minor_unit ?? 0);
  const type = item?.type === 'variable' ? 'variable' : 'simple';
  const outOfStock = item?.is_in_stock === false;
  const categories = (item.categories || []).filter(category => String(category.id) !== process.env.WOOCOMMERCE_CATEGORY_ID?.trim());
  // Variation attributes usable for picking a variant: label plus its possible terms.
  const options = (Array.isArray(item?.attributes) ? item.attributes : [])
    .filter(attribute => attribute?.has_variations && typeof attribute.name === 'string' && attribute.name.trim())
    .map(attribute => ({
      name: attribute.name.trim(),
      terms: (Array.isArray(attribute.terms) ? attribute.terms : [])
        .filter(term => term && typeof term.slug === 'string' && term.slug)
        .map(term => ({ name: String(term.name || term.slug), slug: term.slug, default: term.default === true })),
    }))
    .filter(attribute => attribute.terms.length > 0);
  // Embedded variation references: id plus the exact attribute pairs Woo expects back.
  const variations = (Array.isArray(item?.variations) ? item.variations : [])
    .filter(variation => variation && Number.isSafeInteger(variation.id) && variation.id > 0)
    .map(variation => ({
      id: variation.id,
      attributes: (Array.isArray(variation.attributes) ? variation.attributes : [])
        .filter(attribute => attribute && typeof attribute.name === 'string' && attribute.name.trim())
        .map(attribute => ({ name: attribute.name.trim(), value: String(attribute.value ?? '') })),
    }));
  return {
    id: item.id,
    name: item.name,
    category: categories[0]?.name || 'سایر',
    categories: categories.map(category => category.name),
    categoryRefs: categories.map(({id,name,slug}) => ({id,name,slug})),
    images: (item.images || []).map(image => ({src:image.src,alt:image.alt || item.name})),
    sku: item.sku || '',
    specifications: (item.attributes || []).map(attribute => ({name:attribute.name, value:(attribute.terms || []).map(term => term.name).join('، ')})).filter(attribute => attribute.name && attribute.value),
    price: Number.isFinite(amount) ? amount / 10 ** minor : 0,
    regularPrice: Number.isFinite(Number(item?.prices?.regular_price)) ? Number(item.prices.regular_price) / 10 ** minor : 0,
    unit: priceUnit(item?.prices?.currency_code),
    minorUnit: minor,
    image: item.images?.[0]?.src || '',
    thumbnail: item.images?.[0]?.thumbnail || item.images?.[0]?.src || '',
    imageSrcSet: item.images?.[0]?.srcset || '',
    label: item.name?.slice(0, 2) || 'کالا',
    tone: 'stone',
    description: item.description || item.summary || '',
    type,
    outOfStock,
    options,
    variations,
    // purchasable means "addable as-is"; variable products need a selected variation first.
    purchasable: item.is_purchasable !== false && !outOfStock && type !== 'variable',
  };
}

export function normalizeVariation(item) {
  const amount = Number(item?.prices?.price);
  const minor = Number(item?.prices?.currency_minor_unit ?? 0);
  return {
    id: item?.id,
    price: Number.isFinite(amount) ? amount / 10 ** minor : 0,
    unit: priceUnit(item?.prices?.currency_code),
    inStock: item?.is_in_stock !== false && item?.is_purchasable !== false,
  };
}

function catalogueCategory() {
  const category=process.env.WOOCOMMERCE_CATEGORY_ID?.trim();
  if(category&&!/^[1-9]\d*$/.test(category))throw Error('Invalid catalogue category');
  return category||'';
}
export async function getProducts(options={}) {
  const filters=catalogFilters({page:String(options.page||1),q:options.query,stock:options.stock?'1':'',min:options.min,max:options.max,sort:options.sort,minor:String(options.minorUnit||0)});
  const page=filters.page;
  const perPage=Number.isSafeInteger(options.perPage)&&options.perPage>0?Math.min(options.perPage,100):24;
  const empty={products:[],page,perPage,total:0,totalPages:0,filters};
  try {
    const origin = storeOrigin();
    const include=options.include;
    if(include!==undefined&&(!Array.isArray(include)||include.length>100||include.some(id=>!Number.isSafeInteger(id)||id<=0)))throw Error('Invalid product selection');
    if(include?.length===0)return {...empty,mode:origin?'live':'demo',error:''};
    const category=catalogueCategory();
    if (!origin) {
      const selected=options.category?catalogCategories(demoProducts).find(c=>c.id===Number(options.category)):null;
      const all=filterProducts(demoProducts.filter(p=>!include||include.includes(p.id)),{...filters,category:selected});
      return {...empty,products:all.slice((page-1)*perPage,page*perPage),total:all.length,totalPages:Math.ceil(all.length/perPage),mode:'demo',error:''};
    }
    const params = new URLSearchParams({per_page:String(perPage),page:String(page),orderby:filters.sort==='newest'?'date':'price',order:filters.sort==='cheap'?'asc':'desc'});
    if(options.category!==undefined&&(!Number.isSafeInteger(Number(options.category))||Number(options.category)<=0))throw Error('Invalid category');
    const categories=[...new Set([category,options.category&&String(options.category)].filter(Boolean))];
    if(categories.length){params.set('category',categories.join(','));params.set('category_operator','and');}
    if(include)params.set('include',include.join(','));
    if(filters.query)params.set('search',filters.query);
    if(filters.stock)params.set('stock_status[]','instock');
    for(const key of ['min','max'])if(filters[key]!==''){
      const amount=Math.round(Number(filters[key])*10**filters.minorUnit);
      if(!Number.isSafeInteger(amount))throw Error('Invalid price range');
      params.set(`${key}_price`,String(amount));
    }
    const url=wordpressRestUrl(origin,`/wc/store/v1/products?${params}`);
    const data=await publicVersionedRead(origin,url,async()=>{
      const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error(`WooCommerce response: ${response.status}`);
      const items=await response.json();
      if(!Array.isArray(items))throw Error('Invalid catalogue response');
      const total=Number(response.headers.get('x-wp-total')??items.length);
      const totalPages=Number(response.headers.get('x-wp-totalpages')??(items.length?1:0));
      if(!Number.isSafeInteger(total)||total<0||!Number.isSafeInteger(totalPages)||totalPages<0)throw Error('Invalid catalogue totals');
      return {items,total,totalPages};
    });
    return {...empty,products:data.items.map(normalizeProduct),total:data.total,totalPages:data.totalPages,mode:'live',error:''};
  } catch (cause) {
    return {...empty,mode:'live',error:cause.message==='Invalid catalogue category'?'تنظیم دسته‌بندی فروشگاه معتبر نیست. مدیر فروشگاه باید این تنظیم را بررسی کند؛ داده‌ای تغییر نکرده است.':'دریافت محصولات ممکن نشد. داده‌ای تغییر نکرده است؛ نشانی و وضعیت ووکامرس را بررسی و صفحه را تازه کنید.'};
  }
}

export async function getCategories() {
  try {
    const origin=storeOrigin();
    if(!origin)return {categories:catalogCategories(demoProducts),error:''};
    const category=catalogueCategory(),items=[];
    let pages=1;
    for(let page=1;page<=pages;page++){
      const url=wordpressRestUrl(origin,`/wc/store/v1/products/categories?per_page=100&page=${page}`);
      const data=await publicVersionedRead(origin,url,async()=>{
        const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw Error('Categories unavailable');
        return {items:await response.json(),pages:Number(response.headers.get('x-wp-totalpages')||1)};
      });
      // Bound taxonomy traversal independently; product pages have no catalogue-size ceiling.
      if(!Array.isArray(data.items)||!Number.isSafeInteger(data.pages)||data.pages<0||data.pages>50)throw Error('Invalid categories');
      pages=data.pages;items.push(...data.items);
    }
    return {categories:items.filter(c=>Number.isSafeInteger(c.id)&&c.id>0&&String(c.id)!==category&&c.count>0).map(c=>({id:c.id,name:c.name,slug:c.slug,count:c.count,image:c.image?.thumbnail||c.image?.src||''})),error:''};
  }catch{return {categories:[],error:'دسته‌بندی‌های فروشگاه دریافت نشدند. دوباره تلاش کنید.'};}
}

export async function getHomeProducts(design) {
  const [base,categories]=await Promise.all([getProducts(),getCategories()]);
  const requests=new Map(),sectionStores=[],jobs=[];
  design.sections.forEach((section,index)=>{
    if(!section.enabled)return;
    if(section.type==='categories'&&section.presentation==='showcase'){
      for(const category of categories.categories.filter(c=>!section.categoryIds.length||section.categoryIds.includes(c.id)).slice(0,section.limit||12))jobs.push({index,options:{category:category.id,perPage:4}});
    }else if(section.type==='products'||section.featuredProduct){
      const options={perPage:section.limit||12,sort:section.sort||'newest'};
      if(section.source==='manual'||section.type==='hero'&&section.productIds?.length)options.include=(section.productIds||[]).slice(0,100);
      if(section.source==='category')options.category=section.categoryId;
      jobs.push({index,options});
    }
  });
  for(let start=0;start<jobs.length;start+=4){
    await Promise.all(jobs.slice(start,start+4).map(async({index,options})=>{
      const key=JSON.stringify(options);
      if(!requests.has(key))requests.set(key,getProducts(options));
      const result=await requests.get(key),previous=sectionStores[index];
      sectionStores[index]=previous?{...result,error:previous.error||result.error,products:[...new Map([...previous.products,...result.products].map(p=>[p.id,p])).values()]}:result;
    }));
  }
  return {...base,sectionStores,categories:categories.categories};
}

export async function getProduct(id) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const origin = storeOrigin();
  if (!origin) return demoProducts.find(item => item.id === id) || null;
  const url=wordpressRestUrl(origin,`/wc/store/v1/products/${id}`);
  const item=await publicVersionedRead(origin,url,async()=>{
    const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(response.status===404)return null;
    if(!response.ok)throw new Error('دریافت کالا از ووکامرس ممکن نشد. دوباره تلاش کنید.');
    return response.json();
  });
  return item?normalizeProduct(item):null;
}

// The Store API has no /products/{id}/variations route; variations are products
// of type=variation with a parent filter. Price and stock come from here, the
// attribute pairs of each variation come from the parent product response.
export async function getVariations(id) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const origin = storeOrigin();
  if (!origin) return null;
  const response = await fetch(wordpressRestUrl(origin,`/wc/store/v1/products?type=variation&parent=${id}&per_page=100&orderby=id&order=asc`), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('گزینه‌های این کالا دریافت نشد. دوباره تلاش کنید.');
  const items = await response.json();
  return Array.isArray(items) ? items.map(normalizeVariation) : [];
}
