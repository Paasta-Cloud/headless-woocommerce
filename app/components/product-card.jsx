'use client';
import {useState} from 'react';
import {useCart} from '../use-cart';
import {useFavorites} from '../use-favorites';
import Icon from './icons';
export default function ProductCard({product}) {
  const favorites=useFavorites();
  const {busy,addItem}=useCart();
  const [added,setAdded]=useState(false),[failed,setFailed]=useState(false);
  return <article className="craft-product"><div className="craft-product-photo"><a href={`/product/${product.id}`}>{product.image?<img src={product.image} alt={product.name} width="300" height="300" loading="lazy"/>:<span>{product.label}</span>}</a><button aria-label={`${favorites.has(product.id)?'حذف از':'افزودن به'} علاقه‌مندی‌ها: ${product.name}`} aria-pressed={favorites.has(product.id)} onClick={()=>favorites.toggle(product.id)}><Icon name="heart"/></button></div><div className="craft-product-body"><small>{product.category}</small><h3><a href={`/product/${product.id}`}>{product.name}</a></h3><div className="craft-product-price"><strong>{product.price.toLocaleString('fa-IR')} <small>{product.unit}</small></strong></div>{product.type==='variable'?<a className="craft-buy" href={`/product/${product.id}`}>انتخاب گزینه‌ها <Icon name="arrow"/></a>:<button className="craft-buy" disabled={busy||product.purchasable===false} onClick={async()=>{setFailed(false);const ok=await addItem(product.id)!==false;setAdded(ok);setFailed(!ok);}}>{product.purchasable===false?'ناموجود':added?'افزوده شد':'افزودن به سبد'}<Icon name="bag"/></button>}{added&&<a className="fine-print" href="/cart">مشاهدهٔ سبد خرید</a>}{failed&&<p className="form-error" role="alert">افزودن کالا تأیید نشد. <a href="/cart">بررسی سبد خرید</a></p>}</div></article>;
}
