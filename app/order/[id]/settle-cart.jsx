'use client';
import {useEffect,useState} from 'react';
import {useCart} from '../../use-cart';
export default function SettleCart({id}){
 const {refreshCart}=useCart();const [error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;
  fetch(`/order/${id}/settle`,{method:'POST'}).then(async response=>{
   if(!response.ok)throw Error('سبد هنوز همگام نشده است.');
   const data=await response.json();
   if(data.settled){await refreshCart();try{localStorage.setItem('khanechin-cart-updated',String(Date.now()));}catch{}}
  }).catch(()=>{if(active)setError('خرید ثبت شده است، اما سبد هنوز همگام نشده است.');});
  return()=>{active=false;};
 },[id,attempt,refreshCart]);
 return error?<p role="alert">{error} <button onClick={()=>{setError('');setAttempt(value=>value+1);}}>تلاش دوباره</button></p>:null;
}
