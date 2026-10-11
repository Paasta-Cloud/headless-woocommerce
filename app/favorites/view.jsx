'use client';
import StoreLink from '../components/store-link';

import { Breadcrumbs } from '../components/ui';


import { useFavorites } from '../use-favorites';
import {useEffect,useState} from 'react';

export default function FavoritesView({ products, error:initialError,mode='demo' }) {
  const favorites = useFavorites();
  const key=favorites.ids.join(','),[loaded,setLoaded]=useState({key:'',products:[],error:''});
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(mode!=='live'||!favorites.ready||!key)return;
    const controller=new AbortController();
    (async()=>{
      const items=[];
      try{
        const ids=key.split(',');
        for(let start=0;start<ids.length;start+=100){
          const response=await fetch(`/api/catalog?include=${ids.slice(start,start+100).join(',')}`,{cache:'no-store',signal:controller.signal});
          const data=await response.json();if(!response.ok||!Array.isArray(data.products))throw Error(data.error||'علاقه‌مندی‌ها دریافت نشدند. دوباره تلاش کنید.');
          items.push(...data.products);
        }
        if(!controller.signal.aborted)setLoaded({key,products:items,error:''});
      }catch(cause){if(!controller.signal.aborted)setLoaded({key,products:[],error:cause.message});}
    })();
    return()=>controller.abort();
  },[mode,favorites.ready,key,retry]);
  const error=initialError||(key&&loaded.key===key?loaded.error:'');
  const loading=mode==='live'&&key&&loaded.key!==key;
  const items=(mode==='live'?loaded.products:products).filter(product => favorites.ids.includes(product.id));
  const format = product => `${new Intl.NumberFormat('fa-IR').format(product.price)} ${product.unit || 'تومان'}`;

  return <main className="shop-shell"><Breadcrumbs items={[{label:'علاقه‌مندی‌ها'}]}/>

    <div className="page-heading"><span className="eyebrow">برای بعد نگه دارید</span><h1>علاقه‌مندی‌ها</h1><p>این فهرست فقط در همین مرورگر ذخیره می‌شود.</p></div>
    {!favorites.ready||loading ? <p role="status">در حال خواندن علاقه‌مندی‌ها…</p> : error ? <div className="form-error" role="alert">{error}<button onClick={()=>{setLoaded({key:'',products:[],error:''});setRetry(retry+1);}}>تلاش دوباره</button></div> : items.length ? <div className="favorite-list">{items.map(product => <article key={product.id}><StoreLink className={`favorite-image ${product.tone}`} href={`/product/${product.id}`}>{product.image ? <img src={product.image} alt={product.name}/> : product.label}</StoreLink><div><span>{product.category}</span><h2><StoreLink href={`/product/${product.id}`}>{product.name}</StoreLink></h2><strong>{format(product)}</strong></div><button type="button" onClick={() => favorites.toggle(product.id)} aria-label={`حذف ${product.name} از علاقه‌مندی‌ها`}>حذف</button></article>)}</div> : <div className="empty-state"><h2>{favorites.ids.length?'این کالاها دیگر در ویترین موجود نیستند':'هنوز کالایی نگه نداشته‌اید'}</h2><p>با دکمهٔ «علاقه‌مندی» کنار هر کالا، آن را برای بعد نگه دارید.</p><StoreLink className="primary-action" href="/shop">دیدن کالاها</StoreLink></div>}
  </main>;
}
