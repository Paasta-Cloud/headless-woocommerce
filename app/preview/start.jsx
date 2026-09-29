'use client';
import {useEffect,useRef,useState} from 'react';
export default function PreviewStart({ready=false}){
  const tokenRef=useRef(null),requestRef=useRef(null),[error,setError]=useState(''),[exchanging,setExchanging]=useState(false);
  useEffect(()=>{const changed=()=>{if(window.location.hash)window.location.reload();};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
  useEffect(()=>{
    if(tokenRef.current===null)tokenRef.current=window.location.hash.slice(1);
    const token=tokenRef.current;
    window.history.replaceState(null,'','/preview');
    if(!token&&ready)return;
    if(!/^[a-f0-9]{64}$/.test(token)){setError('از ویرایشگر وردپرس یک پیش‌نمایش تازه بسازید.');return;}
    let active=true;setExchanging(true);
    requestRef.current??=fetch('/api/design-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}).then(response=>{if(!response.ok)throw Error('پیش‌نمایش معتبر نیست یا منقضی شده است.');});
    requestRef.current.then(()=>{if(active)window.location.replace('/preview');}).catch(cause=>{if(active){setError(cause.message);setExchanging(false);}});
    return()=>{active=false;};
  },[ready]);
  if(ready&&!error&&!exchanging)return null;
  return <div className="builder-preview-start"><h1>پیش‌نمایش خصوصی فروشگاه</h1>{error?<p role="alert" className="form-error">{error}</p>:<p role="status">در حال آماده‌کردن پیش‌نمایش…</p>}<a href="/">بازگشت به نسخهٔ عمومی</a></div>;
}
