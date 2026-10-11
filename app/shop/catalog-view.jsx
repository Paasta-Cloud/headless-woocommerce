'use client';
import StoreLink from '../components/store-link';
import {useMemo,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {catalogCategories,filterProducts} from '../../lib/catalog';
import {catalogHref} from '../../lib/catalog-query';
import {Breadcrumbs,EmptyState} from '../components/ui';
import ProductCard from '../components/product-card';
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
  const numbers=[...new Set([1,...Array.from({length:5},(_,i)=>page+i-2).filter(n=>n>0&&n<=totalPages),totalPages])].filter(n=>n>0).sort((a,b)=>a-b);
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
      <section aria-busy={pending}>
        <div className="catalog-toolbar"><div><h1>{title}</h1><p role="status">{pending?'در حال دریافت محصولات…':`${(paged?total:visible.length).toLocaleString('fa-IR')} محصول`}</p></div><select aria-label="مرتب‌سازی محصولات" value={sort} disabled={pending} onChange={e=>{setSort(e.target.value);apply({sort:e.target.value});}}><option value="newest">جدیدترین‌ها</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></div>
        {(filters?.query||!paged&&query)&&<p className="catalog-active">نتایج جست‌وجوی «{filters?.query||query}»</p>}
        {error?<div className="form-error" role="alert">{error} <StoreLink href={path}>تلاش دوباره</StoreLink></div>:visible.length?<div className="craft-products">{visible.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<EmptyState icon="search" title="محصولی پیدا نشد" href={path} action="نمایش همهٔ محصولات">عبارت جست‌وجو یا محدودهٔ قیمت را تغییر دهید. می‌توانید فیلتر موجودی را هم بردارید.</EmptyState>}
        {paged&&!error&&totalPages>1&&<nav className="catalog-pagination" aria-label="صفحه‌های محصولات">
          <p>صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}<span>نمایش {((page-1)*perPage+1).toLocaleString('fa-IR')} تا {Math.min(page*perPage,total).toLocaleString('fa-IR')} از {total.toLocaleString('fa-IR')} محصول</span></p>
          <div>{page>1&&<StoreLink href={catalogHref(path,filters,page-1)} aria-label="صفحهٔ قبلی محصولات">قبلی</StoreLink>}{numbers.map((number,index)=><span key={number}>{index>0&&number>numbers[index-1]+1&&<span className="pagination-gap" aria-hidden="true">…</span>}{number===page?<span className="pagination-current" aria-current="page" aria-label={`صفحهٔ ${number.toLocaleString('fa-IR')}`}>{number.toLocaleString('fa-IR')}</span>:<StoreLink href={catalogHref(path,filters,number)} aria-label={`صفحهٔ ${number.toLocaleString('fa-IR')} محصولات`}>{number.toLocaleString('fa-IR')}</StoreLink>}</span>)}{page<totalPages&&<StoreLink href={catalogHref(path,filters,page+1)} aria-label="صفحهٔ بعدی محصولات">بعدی</StoreLink>}</div>
        </nav>}
      </section>
    </div>
  </main>;
}
