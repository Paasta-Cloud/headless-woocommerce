'use client';
import {createContext,useContext,useRef,useState} from 'react';
import Icon from './icons';
export const DemoNavigation=createContext(null);
export const useDemoNavigation=()=>useContext(DemoNavigation);

// Reference IDs are never routed to the merchant's product/cart/account endpoints.
export default function DemoBoundary({products,children}){
 const dialog=useRef(null),[destination,setDestination]=useState(''),[query,setQuery]=useState('');
 function open(href){setDestination(href);setQuery('');dialog.current.showModal();}
 const product=products.find(p=>destination===`/product/${p.id}`);
 const category=destination.startsWith('/category/')?Number(destination.split('/').pop()):0;
 const visible=products.filter(p=>(!category||p.categoryRefs?.some(c=>c.id===category))&&(!query||p.name.includes(query)));
 return <DemoNavigation.Provider value={open}><div onSubmitCapture={event=>{event.preventDefault();event.stopPropagation();open('/shop');setQuery(new FormData(event.target).get('q')||'');}}>{children}</div><dialog ref={dialog} className="retail-demo-dialog" aria-label={product?'جزئیات محصول نمایشی':'پیش‌نمایش قالب'} onClick={e=>{if(e.target===e.currentTarget)dialog.current.close();}}><button className="retail-demo-close" aria-label="بستن پیش‌نمایش" onClick={()=>dialog.current.close()}><Icon name="close"/></button><p className="retail-demo-note">نمونهٔ نمایشی؛ خرید و ورود به حساب واقعی در این دمو فعال نیست.</p>{product?<div className="retail-demo-product"><img src={product.image} alt={product.name}/><div><h2>{product.name}</h2><p>{product.category}</p><strong>{product.price.toLocaleString('fa-IR')} {product.unit}</strong><p>این قیمت از کاتالوگ مرجع برداشت شده و پیشنهاد فروش نیست.</p><button onClick={()=>open('/shop')}>دیدن محصولات دیگر</button></div></div>:destination==='/shop'||category?<><h2>محصولات نمونه</h2><label className="retail-demo-search">جست‌وجو<input value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="retail-demo-grid">{visible.map(p=><button key={p.id} onClick={()=>open(`/product/${p.id}`)}><img src={p.thumbnail||p.image} alt=""/><span>{p.name}</span><strong>{p.price.toLocaleString('fa-IR')} {p.unit}</strong></button>)}</div>{!visible.length&&<p>محصولی پیدا نشد.</p>}</>:<><h2>این بخش در فروشگاه اصلی فعال است</h2><p>این صفحه برای بررسی ظاهر قالب است؛ اطلاعات حساب، سفارش و سبد فروشگاه اصلی تغییر نمی‌کند.</p><button onClick={()=>dialog.current.close()}>بازگشت به دمو</button></>}</dialog></DemoNavigation.Provider>;
}
