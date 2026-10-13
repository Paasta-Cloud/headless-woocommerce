'use client';
import StoreLink from '../components/store-link';
import {useMemo,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {catalogCategories,filterProducts} from '../../lib/catalog';
import {catalogHref} from '../../lib/catalog-query';
import {Breadcrumbs,EmptyState} from '../components/ui';
import ProductCard from '../components/product-card';
import Pagination from '../components/pagination';
import '../catalog-pagination.css';

export default function CatalogView({products,error,category=null,initialQuery='',filters,categories:allCategories,categoryError='',page=1,total=0,totalPages=0,perPage=24}) {
  const router=useRouter(),[pending,startTransition]=useTransition();
  const [query,setQuery]=useState(filters?.query||initialQuery),[stock,setStock]=useState(filters?.stock||false),[min,setMin]=useState(filters?.min||''),[max,setMax]=useState(filters?.max||''),[sort,setSort]=useState(filters?.sort||'newest');
  const [filtersOpen,setFiltersOpen]=useState(false);
  const categories=allCategories||catalogCategories(products),paged=!!filters;
  const visible=useMemo(()=>paged?products:filterProducts(products,{query,category,stock,min,max,sort}),[paged,products,query,category,stock,min,max,sort]);
  const title=category?.name||'همهٔ محصولات',path=category?`/category/${category.id}`:'/shop';
  const current={query,stock,min,max,sort,minorUnit:products[0]?.minorUnit??filters?.minorUnit??0};
  function navigate(href){startTransition(()=>router.push(href));}
  function apply(change={}){if(paged)navigate(catalogHref(path,{...current,...change}));}
  const applied=paged?filters:current;
  const activeFilters=[applied.query&&{key:'query',label:`جست‌وجو: ${applied.query}`,value:''},applied.stock&&{key:'stock',label:'فقط کالاهای موجود',value:false},applied.min&&{key:'min',label:`از ${Number(applied.min).toLocaleString('fa-IR')}`,value:''},applied.max&&{key:'max',label:`تا ${Number(applied.max).toLocaleString('fa-IR')}`,value:''}].filter(Boolean);
  function removeFilter(filter){({query:setQuery,stock:setStock,min:setMin,max:setMax})[filter.key](filter.value);if(paged)navigate(catalogHref(path,{...filters,[filter.key]:filter.value}));}
  return <main className="shop-shell">
    <Breadcrumbs items={[...(category?[{label:'دسته‌بندی‌ها',href:'/categories'}]:[]),{label:title}]}/>
    <div className="catalog-layout">
      <aside className="catalog-filter"><h2>فیلتر محصولات</h2><button className="filter-toggle" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={()=>setFiltersOpen(!filtersOpen)}>فیلتر محصولات <span>{filtersOpen?'−':'+'}</span></button>
        <form id="catalog-filters" className={`filter-body${filtersOpen?' open':''}`} onSubmit={e=>{e.preventDefault();apply();}}>
          <label>جست‌وجو<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="نام محصول…" maxLength={100}/></label>
          <label>دسته‌بندی<select value={category?.id||''} onChange={e=>navigate(catalogHref(e.target.value?`/category/${e.target.value}`:'/shop',current))}><option value="">همهٔ دسته‌ها</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name} ({c.count.toLocaleString('fa-IR')})</option>)}</select></label>
          {categoryError&&<p className="form-error" role="alert">{categoryError}</p>}
          <label><input type="checkbox" checked={stock} onChange={e=>setStock(e.target.checked)}/>فقط کالاهای موجود</label>
          <label>حداقل قیمت ({products[0]?.unit||'تومان'})<input type="number" min="0" step="any" value={min} onChange={e=>setMin(e.target.value)} inputMode="decimal"/></label>
          <label>حداکثر قیمت ({products[0]?.unit||'تومان'})<input type="number" min={min||'0'} step="any" value={max} onChange={e=>setMax(e.target.value)} inputMode="decimal"/></label>
          {paged&&<button className="primary-action" disabled={pending}>{pending?'در حال دریافت…':'اعمال فیلترها'}</button>}
          <button type="button" onClick={()=>{setQuery('');setStock(false);setMin('');setMax('');setSort('newest');if(paged)navigate(path);}} disabled={pending}>پاک‌کردن فیلترها</button>
        </form>
      </aside>
      <section className="catalog-results" aria-busy={pending}>
        <div className="catalog-toolbar"><div><h1>{title}</h1><p role="status">{pending?'در حال دریافت محصولات…':`${(paged?total:visible.length).toLocaleString('fa-IR')} محصول`}{!pending&&paged&&totalPages>1&&<span className="catalog-page-position">صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</span>}</p></div><label className="catalog-sort"><span>مرتب‌سازی</span><select aria-label="مرتب‌سازی محصولات" value={sort} disabled={pending} onChange={e=>{setSort(e.target.value);apply({sort:e.target.value});}}><option value="newest">جدیدترین‌ها</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></label></div>
        {activeFilters.length>0&&<div className="catalog-active-filters" aria-label="فیلترهای فعال"><span>فیلترهای فعال:</span>{activeFilters.map(filter=><button type="button" key={filter.key} disabled={pending} onClick={()=>removeFilter(filter)} aria-label={`حذف فیلتر ${filter.label}`}>{filter.label}<span aria-hidden="true">×</span></button>)}</div>}
        {error?<div className="form-error" role="alert">{error} <StoreLink href={path}>تلاش دوباره</StoreLink></div>:visible.length?<div className="craft-products">{visible.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<EmptyState icon="search" title="محصولی پیدا نشد" href={path} action="نمایش همهٔ محصولات">عبارت جست‌وجو یا محدودهٔ قیمت را تغییر دهید. می‌توانید فیلتر موجودی را هم بردارید.</EmptyState>}
        {paged&&!error&&<Pagination page={page} total={total} perPage={perPage} label="محصولات" disabled={pending} href={number=>catalogHref(path,filters,number)}/>}
      </section>
    </div>
  </main>;
}
