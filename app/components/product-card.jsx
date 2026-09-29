'use client';
import StoreLink from './store-link';

import {useState} from 'react';
import {useCart} from '../use-cart';
import {useFavorites} from '../use-favorites';
import Icon from './icons';
export default function ProductCard({product}) {
  const favorites=useFavorites();
  const {busy,addItem}=useCart();
  const [added,setAdded]=useState(false),[failed,setFailed]=useState(false);
  return <article className="craft-product"><div className="craft-product-photo"><StoreLink href={`/product/${product.id}`}>{product.image?<img src={product.thumbnail||product.image} srcSet={product.imageSrcSet||undefined} sizes="(max-width: 640px) 50vw, 300px" alt={product.name} width="300" height="300" loading="lazy" decoding="async"/>:<span>{product.label}</span>}</StoreLink><button aria-label={`${favorites.has(product.id)?'حذف از':'افزودن به'} علاقه‌مندی‌ها: ${product.name}`} aria-pressed={favorites.has(product.id)} onClick={()=>favorites.toggle(product.id)}><Icon name="heart"/></button></div><div className="craft-product-body"><small>{product.category}</small><h3><StoreLink href={`/product/${product.id}`}>{product.name}</StoreLink></h3><div className="craft-product-price"><strong>{product.price.toLocaleString('fa-IR')} <small>{product.unit}</small></strong></div>{product.type==='variable'?<StoreLink className="craft-buy" href={`/product/${product.id}`}>انتخاب گزینه‌ها <Icon name="arrow"/></StoreLink>:<button className="craft-buy" disabled={busy||product.purchasable===false} onClick={async()=>{setFailed(false);const ok=await addItem(product.id)!==false;setAdded(ok);setFailed(!ok);}}>{product.purchasable===false?'ناموجود':added?'افزوده شد':'افزودن به سبد'}<Icon name="bag"/></button>}{added&&<StoreLink className="fine-print" href="/cart">مشاهدهٔ سبد خرید</StoreLink>}{failed&&<p className="form-error" role="alert">افزودن کالا تأیید نشد. <StoreLink href="/cart">بررسی سبد خرید</StoreLink></p>}</div></article>;
}
