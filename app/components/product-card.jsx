'use client';
import StoreLink from './store-link';
import {useState} from 'react';
import {useCart} from '../use-cart';
import {useFavorites} from '../use-favorites';
import Icon from './icons';
import {useStoreSettings} from './store-settings';
import {useDemoNavigation} from './demo-boundary';

export default function ProductCard({product}) {
 const {busy,addItem,mode}=useCart(),favorites=useFavorites(mode!=='preview');
 const settings=useStoreSettings(),demoNavigate=useDemoNavigation();
 const [quantity,setQuantity]=useState(1),[added,setAdded]=useState(false),[failed,setFailed]=useState(false);
 const preview=mode==='preview',grocery=settings.theme==='grocery';
 const discounted=settings.theme!=='craft'&&product.regularPrice>product.price&&product.price>0;
 async function buy(){setFailed(false);const ok=await addItem(product.id,undefined,quantity)!==false;setAdded(ok);setFailed(!ok);}
 return <article className="craft-product"><div className="craft-product-photo">
  {discounted&&<span className="retail-discount">{Math.round((1-product.price/product.regularPrice)*100).toLocaleString('fa-IR')}٪</span>}
  <StoreLink href={`/product/${product.id}`}>{product.image?<img src={product.thumbnail||product.image} srcSet={product.imageSrcSet||undefined} sizes="(max-width: 640px) 50vw, 300px" alt={product.name} width="300" height="300" loading="lazy" decoding="async"/>:<span>{product.label}</span>}</StoreLink>
  <button aria-label={`${favorites.has(product.id)?'حذف از':'افزودن به'} علاقه‌مندی‌ها: ${product.name}`} aria-pressed={favorites.has(product.id)} onClick={()=>preview?demoNavigate?.('/favorites'):favorites.toggle(product.id)}><Icon name="heart"/></button>
 </div><div className="craft-product-body"><small>{product.category}</small><h3><StoreLink href={`/product/${product.id}`}>{product.name}</StoreLink></h3>
 <div className="craft-product-price">{discounted&&<del>{product.regularPrice.toLocaleString('fa-IR')} <small>{product.unit}</small></del>}<strong>{product.price.toLocaleString('fa-IR')} <small>{product.unit}</small></strong></div>
 {preview?<StoreLink className="retail-preview-product" href={`/product/${product.id}`}>مشاهدهٔ محصول <Icon name="bag"/></StoreLink>:product.type==='variable'?<StoreLink className="craft-buy" href={`/product/${product.id}`}>انتخاب گزینه‌ها <Icon name="arrow"/></StoreLink>:<div className={grocery?'retail-purchase':''}>
  {grocery&&product.purchasable!==false&&<div className="retail-quantity"><button aria-label={`افزایش تعداد ${product.name}`} disabled={busy||quantity>=99} onClick={()=>setQuantity(quantity+1)}>+</button><output aria-label="تعداد">{quantity.toLocaleString('fa-IR')}</output><button aria-label={`کاهش تعداد ${product.name}`} disabled={busy||quantity<=1} onClick={()=>setQuantity(quantity-1)}>−</button></div>}
  <button className="craft-buy" aria-label={`افزودن به سبد: ${product.name}`} disabled={busy||product.purchasable===false} onClick={buy}>{product.purchasable===false?'ناموجود':added?'افزوده شد':grocery?'':'افزودن به سبد'}<Icon name="bag"/></button>
 </div>}
 {added&&<StoreLink className="fine-print" href="/cart">مشاهدهٔ سبد خرید</StoreLink>}{failed&&<p className="form-error" role="alert">افزودن کالا تأیید نشد. <StoreLink href="/cart">بررسی سبد خرید</StoreLink></p>}
 </div></article>;
}
