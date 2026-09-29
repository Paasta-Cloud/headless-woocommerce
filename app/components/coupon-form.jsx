'use client';
// Extend the existing turquoise checkout summary; WooCommerce owns all discount calculations.
import {useId,useRef,useState} from 'react';
import {useCart} from '../use-cart';
import '../cart.css';
export default function CouponForm({onChanged,onChanging,disabled=false}){
 const {coupons,busy,changeCoupon,mode}=useCart();const [code,setCode]=useState(''),[notice,setNotice]=useState('');const id=useId();
 const pending=useRef(false);
 if(mode!=='live')return null;
 async function change(value,remove=false){
  if(pending.current||busy||disabled)return;
  pending.current=true;onChanging?.();setNotice('');
  try{if(await changeCoupon(value,remove)){if(!remove)setCode('');setNotice(remove?'کد تخفیف حذف شد.':'کد تخفیف اعمال شد.');}await onChanged?.();}
  finally{pending.current=false;}
 }
 async function apply(event){event.preventDefault();await change(code);}
 async function remove(value){await change(value,true);}
 return <section className="coupon-section" aria-label="کد تخفیف"><form onSubmit={apply}><label htmlFor={id}>کد تخفیف دارید؟</label><div className="coupon-controls"><input id={id} value={code} onChange={event=>setCode(event.target.value)} placeholder="کد تخفیف" maxLength={100} autoComplete="off" autoCapitalize="none" dir="auto" disabled={busy||disabled}/><button type="submit" disabled={busy||disabled||!code.trim()}>{busy?'در حال بررسی…':'اعمال کد'}</button></div></form>{coupons.length>0&&<ul>{coupons.map(coupon=><li key={coupon.code}><bdi>{coupon.code}</bdi><button type="button" disabled={busy||disabled} onClick={()=>remove(coupon.code)} aria-label={'حذف کد '+coupon.code}>حذف</button></li>)}</ul>}<p role="status" aria-live="polite">{notice}</p></section>;
}
