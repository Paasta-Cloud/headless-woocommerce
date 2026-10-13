'use client';
import {useEffect,useId,useRef,useState} from 'react';
import './return-request.css';

const statuses={requested:'در انتظار بررسی مدیر',approved:'درخواست تأیید شده؛ بازپرداخت جداگانه پیگیری می‌شود',rejected:'درخواست پذیرفته نشده'};
export default function ReturnRequest({orderId,manager=false,disabled=false}){
  const [report,setReport]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[open,setOpen]=useState(false),[note,setNote]=useState(''),[decision,setDecision]=useState(''),[confirmed,setConfirmed]=useState(false),[uncertain,setUncertain]=useState(false);
  const lock=useRef(false),operation=useRef(null),dialog=useRef(null),id=useId(),heading=useRef(null);
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
  useEffect(()=>{if(!open||!note)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[open,note]);
  async function send(body){
    const response=await fetch(manager?'/api/manage/returns':'/api/account/return',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId,...body}),cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Error(response.status===404?'برای پیگیری مرجوعی، افزونهٔ اتصال باید به‌روز شود.':data.error||'درخواست انجام نشد.');
    if(data.automaticRefund!==false||typeof data.revision!=='string')throw Error('پاسخ کامل نیست؛ نتیجه را دوباره بخوانید.');
    return data;
  }
  async function read(){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{setReport(await send({verb:'read'}));setUncertain(false);operation.current=null;}
    catch(e){setReport(null);setError(e.message);}
    finally{lock.current=false;setBusy(false);heading.current?.focus();}
  }
  async function submit(e){
    e.preventDefault();if(lock.current||uncertain||!confirmed||!note.trim()||(manager&&!decision))return;
    lock.current=true;setBusy(true);setError('');operation.current??=crypto.randomUUID();
    try{
      const result=await send({verb:manager?'decide':'request',operationKey:operation.current,confirmed:true,...(manager?{decision,note,revision:report.revision}:{reason:note})});
      setReport(result);setOpen(false);setNote('');setConfirmed(false);operation.current=null;
    }catch(e){setError(e.message);setUncertain(true);}
    finally{lock.current=false;setBusy(false);}
  }
  const allowed=manager?report?.canDecide:report?.canRequest;
  const errorView=error&&<p className="return-error" role="alert">{error}</p>;
  return <section className="return-panel" aria-labelledby={id} aria-busy={busy}>
    <div className="return-heading"><div><h2 id={id} ref={heading} tabIndex={-1}>{manager?'بررسی مرجوعی':'درخواست مرجوعی'}</h2><p>هر درخواست باید به تأیید مدیر برسد. این بخش وجهی برنمی‌گرداند و وضعیت پرداخت یا موجودی را تغییر نمی‌دهد.</p></div><button type="button" onClick={read} disabled={disabled||busy}>{busy?'در حال دریافت…':report?'خواندن دوبارهٔ نتیجه':'پیگیری مرجوعی'}</button></div>
    {!open&&errorView}
    {report?.case?<div className="return-case" role="status"><strong>{statuses[report.case.status]||'نیازمند پیگیری'}</strong><p>{report.case.reason}</p>{report.case.note&&<p>پاسخ مدیر: {report.case.note}</p>}<small>تأیید درخواست، رسید بازپرداخت نیست. نتیجهٔ انتقال وجه باید جداگانه با فروشگاه پیگیری شود.</small></div>:report&&<p className="return-empty">هنوز درخواستی ثبت نشده است.{!manager&&!allowed?' برای وضعیت فعلی سفارش، با فروشگاه تماس بگیرید.':''}</p>}
    {allowed&&!uncertain&&<button type="button" className="return-primary" disabled={disabled||busy} onClick={()=>{setError('');setConfirmed(false);setOpen(true);}}>{manager?'بررسی و ثبت تصمیم':'ثبت درخواست بررسی'}</button>}
    <dialog ref={dialog} className="return-dialog" aria-labelledby={id+'-dialog'} onCancel={e=>{e.preventDefault();if(!busy){setOpen(false);setConfirmed(false);}}}>
      <form onSubmit={submit}><h2 id={id+'-dialog'}>{manager?'تصمیم مدیر دربارهٔ مرجوعی':'ثبت درخواست بررسی مرجوعی'}</h2><p>سفارش <bdi>#{Number(orderId).toLocaleString('fa-IR')}</bdi> · بدون انتقال وجه خودکار</p>
        {manager&&<label>نتیجهٔ بررسی<select value={decision} onChange={e=>setDecision(e.target.value)} disabled={busy||uncertain} required><option value="" disabled>نتیجهٔ بررسی را انتخاب کنید</option><option value="approved">تأیید درخواست برای پیگیری</option><option value="rejected">رد درخواست</option></select></label>}
        <label>{manager?'توضیح قابل مشاهده برای مشتری':'دلیل درخواست'}<textarea autoFocus value={note} maxLength={1000} rows={4} required disabled={busy||uncertain} onChange={e=>setNote(e.target.value)}/><small>حداکثر ۱۰۰۰ نویسه؛ شمارهٔ کارت یا اطلاعات بانکی ننویسید.</small></label>
        <label className="return-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy||uncertain}/><span>{manager?'نتیجه و توضیح را بررسی کرده‌ام؛ می‌دانم این تأیید به معنی بازپرداخت وجه نیست.':'تأیید می‌کنم این فقط درخواست بررسی است و پذیرش مرجوعی به تصمیم مدیر بستگی دارد.'}</span></label>
        {errorView}{uncertain&&<p>ثبت دوباره موقتاً بسته است. ابتدا نتیجهٔ ذخیره‌شده را بخوانید؛ متن شما حفظ می‌شود.</p>}
        <div className="return-actions"><button type="button" disabled={busy} onClick={()=>{setOpen(false);setNote('');setConfirmed(false);}}>انصراف و بستن</button>{uncertain?<button type="button" onClick={read} disabled={busy}>خواندن نتیجهٔ ذخیره‌شده</button>:<button type="submit" className="return-primary" disabled={busy||!confirmed||!note.trim()||!allowed||(manager&&!decision)}>{busy?'در حال ثبت…':manager?'ثبت تصمیم مدیر':'ارسال درخواست بررسی'}</button>}</div>
        {open&&report?.case&&((manager&&!report.canDecide)||!manager)&&<p role="status">نتیجهٔ ثبت‌شده: {statuses[report.case.status]}. برای دیدن آن این پنجره را ببندید.</p>}
      </form>
    </dialog>
  </section>;
}
