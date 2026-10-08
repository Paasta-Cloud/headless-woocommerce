'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Login,MediaDialog,api} from '../workspace';
import Icon from '../../components/icons';
import {Switch,Badge} from '../../components/vibefarsi/controls';
import {IRAN_STATES} from '../../../lib/iran-states';
const names={products:'محصولات',variations:'تنوع‌های محصول',categories:'دسته‌بندی‌ها',orders:'سفارش‌ها',coupons:'کدهای تخفیف',zones:'مناطق ارسال',locations:'محدودهٔ ارسال','zone-methods':'روش‌های ارسال',gateways:'درگاه‌های پرداخت'};
const fa=n=>Number(n).toLocaleString('fa-IR');
const clean=value=>String(value??'').replace(/<[^>]*>/g,'');
const statusName=value=>({publish:'منتشرشده',draft:'پیش‌نویس',private:'خصوصی',pending:'در انتظار',processing:'در حال انجام',completed:'تکمیل‌شده',cancelled:'لغوشده',refunded:'بازپرداخت‌شده',failed:'ناموفق','on-hold':'در انتظار اقدام'})[value]||value;
async function call(body){
 const response=await fetch('/api/manage/commerce',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
 const data=await response.json();if(!response.ok){const error=new Error(data.error||'عملیات انجام نشد.');error.status=response.status;error.code=data.code;throw error;}return data;
}
function Field({label,value,onChange,type='text',options,large=false,hint}){
 const id=useId();return <label className="manage-field" htmlFor={id}><span>{label}</span>{options?<select id={id} value={value??''} onChange={e=>onChange(e.target.value)}>{Object.entries(options).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select>:large?<textarea id={id} rows={5} value={value??''} onChange={e=>onChange(e.target.value)} maxLength={20000}/>:<input id={id} type={type} value={value??''} onChange={e=>onChange(type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value)} autoComplete={type==='password'?'new-password':undefined}/>} {hint&&<small>{hint}</small>}</label>;
}
function Check({label,value,onChange}){return <div className="manage-toggle"><Switch aria-label={label} checked={Boolean(value)} onCheckedChange={onChange}/><span>{label}</span></div>;}
const defaults={
 products:{name:'',type:'simple',status:'draft',description:'',short_description:'',sku:'',regular_price:'',sale_price:'',manage_stock:false,stock_quantity:0,stock_status:'outofstock',categories:[],images:[],attributes:[],virtual:false},
 variations:{status:'private',description:'',sku:'',regular_price:'',sale_price:'',manage_stock:false,stock_quantity:0,stock_status:'outofstock',attributes:[]},
 categories:{name:'',slug:'',parent:0,description:''},
 coupons:{code:'',discount_type:'percent',amount:'0',description:'',date_expires:null,individual_use:false,free_shipping:false,usage_limit:null,usage_limit_per_user:null,minimum_amount:'',maximum_amount:'',exclude_sale_items:false},
 zones:{name:'',order:0},
 'zone-methods':{method_id:'flat_rate',enabled:false,order:0,settings:{}},
};
export default function CommerceManager({catalogCategoryId=null}){
 const [resource,setResource]=useState('products'),[parent,setParent]=useState(0),[items,setItems]=useState([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[login,setLogin]=useState(false),[editor,setEditor]=useState(null),[draft,setDraft]=useState(null),[revision,setRevision]=useState(''),[baseline,setBaseline]=useState(''),[retry,setRetry]=useState(0);
 const pending=useRef(null),sequence=useRef(0),previousActor=useRef(null);
 const [unresolved,setUnresolved]=useState(null),[actor,setActor]=useState(null),[currency,setCurrency]=useState('');
 const storageKey='paasta_commerce_unresolved_'+actor;
 useEffect(()=>{setUnresolved(null);pending.current=null;if(!actor)return;if(previousActor.current&&previousActor.current!==actor){setDraft(null);setEditor(null);}previousActor.current=actor;try{const saved=JSON.parse(sessionStorage.getItem('paasta_commerce_unresolved_'+actor)||'null');if(saved?.operationKey&&names[saved.resource])setUnresolved(saved);}catch{}},[actor]);
 function clearOperation(){sessionStorage.removeItem(storageKey);setUnresolved(null);pending.current=null;}
 async function reconcile(acknowledged=false){
  if(!unresolved)return;setBusy(true);setError('');
  try{const result=await call({...unresolved,verb:'resolve',acknowledged});clearOperation();if(result.status==='done'){setDraft(null);setEditor(null);setNotice('عملیات قبلی انجام شده است؛ مورد تکراری ساخته نشد. شناسه: '+result.id);setRetry(n=>n+1);}else setNotice('درخواست قبلی بسته شد و دیگر اجرا نمی‌شود. پیش از ثبت دوباره، فهرست و مقادیر ذخیره‌شده را بررسی کنید.');}
  catch(e){setError(e.message);if(e.status===401)setLogin(true);}finally{setBusy(false);}
 }
 const dirty=draft&&JSON.stringify(draft)!==baseline;
 useEffect(()=>{const warn=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{let active=true;setBusy(true);setError('');call(resource==='locations'?{resource,verb:'read',id:parent}:{resource,parentId:parent,verb:'list',query:{page,...(query?{search:query}:{})}}).then(result=>{if(active){setActor(result.actorId);setCurrency(result.currency);if(resource==='locations'){const value={locations:result.item.map(({code,type})=>({code,type}))};setEditor({id:parent,name:'محدودهٔ منطقهٔ ارسال'});setDraft(value);setBaseline(JSON.stringify(value));setRevision(result.revision);}else{setItems(result.items);setTotal(result.total);}setLogin(false);}}).catch(e=>{if(active){setError(e.message);if(e.status===401)setLogin(true);}}).finally(()=>active&&setBusy(false));return()=>{active=false;};},[resource,parent,page,query,retry]);
 function canLeave(){return !dirty||window.confirm('تغییرات ذخیره‌نشده کنار گذاشته شوند؟');}
 async function logout(){if(!canLeave())return;setBusy(true);try{await api('logout');setDraft(null);setEditor(null);setItems([]);setLogin(true);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function navigate(next,parentId=0){if(!canLeave())return;sequence.current++;setResource(next);setParent(parentId);setPage(1);setSearch('');setQuery('');setEditor(null);setDraft(null);setNotice('');pending.current=null;}
 function editValue(values){setDraft(current=>({...current,...values}));pending.current=null;setNotice('');}
 async function open(id){if(!canLeave())return;const serial=++sequence.current;setBusy(true);setError('');try{const result=await call({resource,parentId:parent,verb:'read',id});if(serial!==sequence.current)return;const value=extract(resource,result.item);setEditor(result.item);setDraft(value);setBaseline(JSON.stringify(value));setRevision(result.revision);pending.current=null;}catch(e){setError(e.message);if(e.status===401)setLogin(true);}finally{if(serial===sequence.current)setBusy(false);}}
 function create(){if(!canLeave())return;sequence.current++;setEditor({new:true});const next=structuredClone(defaults[resource]);if(resource==='products'&&catalogCategoryId)next.categories=[{id:catalogCategoryId}];setDraft(next);setBaseline('');setRevision('');setError('');setNotice('');pending.current=null;}
 async function save(){
  if(unresolved)return;
  if(!window.confirm(resource==='orders'?'تغییر وضعیت ممکن است روی موجودی و ایمیل سفارش اثر بگذارد. ذخیره شود؟':resource==='locations'&&!draft.locations.length?'محدودهٔ خالی، همهٔ نشانی‌ها را شامل می‌شود. این منطقه عمومی شود؟':'این تغییرات در خود ووکامرس ذخیره می‌شوند. ادامه می‌دهید؟'))return;
  setBusy(true);setError('');setNotice('');
  const before=editor.new?{}:JSON.parse(baseline);
  const changes=editor.new?draft:Object.fromEntries(Object.entries(draft).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(before[key])));
  const request=pending.current??{resource,parentId:parent,verb:editor.new?'create':'update',...(editor.new?{}:{id:editor.id,revision}),values:changes,operationKey:crypto.randomUUID()};pending.current=request;
  const marker={resource,parentId:parent,operationKey:request.operationKey};
  try{sessionStorage.setItem(storageKey,JSON.stringify(marker));setUnresolved(marker);const result=await call(request);clearOperation();setBaseline(JSON.stringify(draft));setNotice('تغییرات در ووکامرس ذخیره شد.');setDraft(null);setEditor(null);setRetry(n=>n+1);if(result.replayed)setNotice('عملیات قبلاً انجام شده بود؛ مورد تکراری ساخته نشد.');}
  catch(e){setError(e.message);if(e.status===401)setLogin(true);if(e.status>=400&&e.status<500){try{const result=await call({...marker,verb:'resolve'});if(result.resolved)clearOperation();}catch{}}}
  finally{setBusy(false);}
 }
 if(login)return <Login onLogin={()=>{setLogin(false);setRetry(n=>n+1);}}/>;
 return <div className="manage-app commerce-app"><aside className="manage-rail"><a className="manage-brand" href="/manage/store"><Icon name="bag"/><span>مدیریت فروشگاه<small>محصولات، سفارش‌ها و فروش</small></span></a><nav aria-label="عملیات فروشگاه">{['products','categories','orders','coupons','zones','gateways'].map(key=><button disabled={busy} className={resource===key?'is-current':''} key={key} onClick={()=>navigate(key)}><Icon name={{products:'bag',categories:'grid',orders:'order',coupons:'heart',zones:'pin',gateways:'check'}[key]}/>{names[key]}</button>)}<a href="/manage"><Icon name="grid"/>ظاهر و محتوای فروشگاه</a><a href="/" target="_blank" rel="noopener"><Icon name="eye"/>مشاهدهٔ فروشگاه</a><button disabled={busy} onClick={logout}><Icon name="user"/>خروج از مدیریت</button></nav></aside>
 <main className="manage-main"><header className="manage-toolbar"><div className="manage-store-identity"><span className="manage-avatar"><Icon name="bag"/></span><div><strong>{names[resource]}</strong><Badge variant={dirty?'warning':'brand'}>{dirty?'تغییرات ذخیره‌نشده':'مدیریت عملیات فروشگاه'}</Badge></div></div><div className="manage-actions">{editor&&<button disabled={busy} onClick={()=>{if(resource==='locations'){navigate('zones');return;}if(canLeave()){setEditor(null);setDraft(null);pending.current=null;}}}>بستن ویرایش</button>}{editor&&<button className="manage-primary" disabled={busy||!dirty||!actor||Boolean(unresolved)} onClick={save}><Icon name="check"/>{busy?'در حال ذخیره…':'ذخیره در فروشگاه'}</button>}{!editor&&!unresolved&&defaults[resource]&&<button className="manage-primary" disabled={busy||!actor} onClick={create}>+ افزودن</button>}</div></header>
 <div className="manage-content">{['variations','zone-methods','locations'].includes(resource)&&<button disabled={busy} onClick={()=>navigate(resource==='variations'?'products':'zones')}>بازگشت به {resource==='variations'?'محصولات':'مناطق ارسال'}</button>}<h1>{editor?(editor.new?'افزودن مورد جدید':clean(editor.name||editor.code||editor.title||'سفارش '+editor.number)):names[resource]}</h1>
 <p className="manage-hint">اطلاعات واقعی ووکامرس؛ واحد مبلغ‌ها: {({IRT:'تومان',IRR:'ریال'})[currency]||currency||'واحد تنظیم‌شده در فروشگاه'}. ذخیرهٔ این بخش مستقل از انتشار ظاهر است.</p>
 {resource==='products'&&catalogCategoryId&&<p className="manage-hint">ویترین فعلی به مجموعهٔ شمارهٔ {fa(catalogCategoryId)} محدود است. این دسته برای محصولات تازه از ابتدا انتخاب می‌شود؛ حذف آن می‌تواند محصول را از ویترین پنهان کند.</p>}
 {unresolved&&<div className="manage-message" role="status"><p>عملیاتی در انتظار تأیید نتیجه است؛ ذخیرهٔ تازه موقتاً غیرفعال است. می‌توانید فهرست‌ها و نسخهٔ ذخیره‌شده را بررسی کنید.</p><button disabled={busy} onClick={()=>reconcile(false)}>بررسی نتیجهٔ عملیات</button><button disabled={busy} onClick={()=>{if(window.confirm('آیا وجود مورد و مقادیر آن را در فهرست فروشگاه بررسی کرده‌اید؟ بستن درخواست، تغییر قبلی را برنمی‌گرداند. ثبت دوباره بدون بررسی ممکن است مورد تکراری بسازد.'))reconcile(true);}}>بررسی کردم؛ بستن درخواست قبلی</button></div>}{error&&<div className="manage-message is-error" role="alert"><p>{error}</p><button disabled={busy} onClick={()=>resource==='locations'?setRetry(n=>n+1):editor&&!editor.new?open(editor.id):setRetry(n=>n+1)}>بررسی نسخهٔ ذخیره‌شده</button></div>}{notice&&<p className="manage-message is-success" role="status">{notice}</p>}
 {editor&&draft?<section className="manage-settings"><fieldset disabled={busy||Boolean(unresolved)}><Editor resource={resource} value={draft} set={editValue} item={editor}/></fieldset>{!editor.new&&resource==='products'&&editor.type==='variable'&&<button disabled={busy} onClick={()=>navigate('variations',editor.id)}>مدیریت تنوع‌های این محصول</button>}{!editor.new&&resource==='zones'&&<div className="manage-actions"><button disabled={busy} onClick={()=>navigate('zone-methods',editor.id)}>مدیریت روش‌های این منطقه</button>{editor.id>0&&<button disabled={busy} onClick={()=>navigate('locations',editor.id)}>تنظیم محدودهٔ جغرافیایی</button>}</div>}</section>:<>
 <form className="commerce-search" onSubmit={e=>{e.preventDefault();setQuery(search);setPage(1);}}><Field label="جست‌وجو" value={search} onChange={setSearch}/><button disabled={busy}>جست‌وجو</button></form>
 {busy?<p role="status">در حال دریافت اطلاعات…</p>:items.length?<div className="commerce-table-wrap"><table className="commerce-table"><thead><tr><th>عنوان</th><th>وضعیت / جزئیات</th><th>عملیات</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><div className="commerce-title">{item.images?.[0]?.src&&<img src={item.images[0].src} alt="" loading="lazy"/>}<div><strong>{clean(item.name||item.code||item.title||'سفارش '+item.number)}</strong><small dir="ltr">#{item.id}</small></div></div></td><td>{clean(statusName(item.status)??(typeof item.enabled==='boolean'?(item.enabled?'فعال':'غیرفعال'):'') )}{item.price!==undefined&&<small>{item.price?fa(item.price):'بدون قیمت'}</small>}{item.total!==undefined&&<small>{fa(item.total)} <bdi>{item.currency}</bdi></small>}</td><td><button onClick={()=>open(item.id)} aria-label={'ویرایش '+clean(item.name||item.code||item.title||item.number)}>مشاهده و ویرایش</button></td></tr>)}</tbody></table></div>:<p className="manage-message">موردی پیدا نشد. فیلتر را تغییر دهید یا مورد تازه‌ای اضافه کنید.</p>}
 <div className="commerce-pagination"><button disabled={busy||page===1} onClick={()=>setPage(p=>p-1)}>صفحهٔ قبل</button><span>صفحهٔ {fa(page)}</span><button disabled={busy||items.length<20||page*20>=total} onClick={()=>setPage(p=>p+1)}>صفحهٔ بعد</button></div>
 </>}</div></main></div>;
}
function extract(resource,item){
 if(resource==='locations')return {locations:item.map(({code,type})=>({code,type}))};
 const keys={products:Object.keys(defaults.products),variations:Object.keys(defaults.variations),categories:Object.keys(defaults.categories),coupons:Object.keys(defaults.coupons),zones:['name','order'],'zone-methods':['enabled','order','settings'],orders:['status','customer_note'],gateways:['enabled','title','description','settings']}[resource];
 const data=Object.fromEntries(keys.map(key=>[key,item[key]??defaults[resource]?.[key]??'']));
 if(data.images)data.images=data.images.map(image=>({id:image.id}));
 if(data.categories)data.categories=data.categories.map(category=>({id:category.id}));
 if(data.settings)data.settings={};
 if(data.attributes)data.attributes=data.attributes.map(a=>resource==='variations'?{id:a.id,name:a.name,option:a.option}:{id:a.id,name:a.name,position:a.position,visible:a.visible,variation:a.variation,options:a.options});
 return data;
}
function Editor({resource,value:v,set,item}){
 const field=(key,label,options={})=><Field key={key} label={label} value={v[key]} onChange={value=>set({[key]:value})} {...options}/>;
 if(resource==='products'||resource==='variations')return <>
  {resource==='products'&&<>{field('name','نام محصول')}{field('type','نوع محصول',{options:{simple:'ساده',variable:'متغیر',...(v.type==='external'?{external:'محصول خارجی'}:{}),...(v.type==='grouped'?{grouped:'گروهی'}:{})}})}</>}
  {field('status','انتشار',{options:{draft:'پیش‌نویس',publish:'منتشرشده',private:'خصوصی',pending:'در انتظار بررسی'}})}
  {field('sku','شناسهٔ کالا (SKU)')}{field('description','توضیحات',{large:true})}{resource==='products'&&field('short_description','توضیح کوتاه',{large:true})}
  {v.type!=='variable'&&<div className="manage-field-grid">{field('regular_price','قیمت عادی')}{field('sale_price','قیمت فروش ویژه')}</div>}
  <Check label="مدیریت تعداد موجودی" value={v.manage_stock} onChange={manage_stock=>set({manage_stock})}/>{v.manage_stock&&field('stock_quantity','تعداد موجودی',{type:'number'})}
  {field('stock_status','وضعیت موجودی',{options:{instock:'موجود',outofstock:'ناموجود',onbackorder:'پیش‌خرید'}})}
  {resource==='products'&&<><CategoryPicker value={v.categories} onChange={categories=>set({categories})}/><ProductImages value={v.images} original={item.images||[]} onChange={images=>set({images})}/></>}
  <h2>{resource==='variations'?'گزینه‌های این تنوع':'ویژگی‌های محصول'}</h2><p className="manage-hint">برای محصول متغیر، ابتدا ویژگی‌ها و گزینه‌هایش را ذخیره کنید و سپس تنوع‌ها را بسازید.</p>
  {v.attributes.map((a,index)=><section className="manage-benefit-editor" key={index}><Field label="نام ویژگی" value={a.name} onChange={name=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,name}:entry)})}/><Field label={resource==='variations'?'گزینهٔ انتخاب‌شده':'گزینه‌ها با ویرگول'} value={a.option??a.options?.join(', ')??''} onChange={text=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,...(resource==='variations'?{option:text}:{options:text.split(/[,،]/).map(s=>s.trim()).filter(Boolean)})}:entry)})}/>{resource==='products'&&<Check label="استفاده برای تنوع" value={a.variation} onChange={variation=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,variation}:entry)})}/>}<button onClick={()=>set({attributes:v.attributes.filter((_,i)=>i!==index)})}>حذف ویژگی</button></section>)}
  <button onClick={()=>set({attributes:[...v.attributes,resource==='variations'?{name:'',option:''}:{name:'',visible:true,variation:true,options:[]}]})}>افزودن ویژگی</button>
 </>;
 if(resource==='categories')return <>{field('name','نام دسته')}{field('slug','نامک')}{field('parent','شناسهٔ دستهٔ مادر (صفر برای بدون مادر)',{type:'number'})}{field('description','توضیحات',{large:true})}</>;
 if(resource==='coupons')return <>{field('code','کد تخفیف')}{field('discount_type','نوع تخفیف',{options:{percent:'درصدی',fixed_cart:'مبلغ ثابت سبد',fixed_product:'مبلغ ثابت محصول'}})}{field('amount','مقدار تخفیف')}{field('description','توضیحات',{large:true})}<Field label="انقضا (اختیاری)" type="datetime-local" value={v.date_expires??''} onChange={date_expires=>set({date_expires:date_expires||null})}/>{['usage_limit','usage_limit_per_user'].map((key,i)=><Field key={key} label={i?'محدودیت هر مشتری':'محدودیت کل استفاده'} type="number" value={v[key]??''} onChange={n=>set({[key]:n===''?null:n})}/>)}{field('minimum_amount','حداقل مبلغ خرید')}{field('maximum_amount','حداکثر مبلغ خرید')}<Check label="غیرقابل ترکیب با تخفیف‌های دیگر" value={v.individual_use} onChange={individual_use=>set({individual_use})}/><Check label="شامل کالاهای تخفیف‌خورده نشود" value={v.exclude_sale_items} onChange={exclude_sale_items=>set({exclude_sale_items})}/><Check label="اجازهٔ ارسال رایگان (نیازمند روش ارسال سازگار)" value={v.free_shipping} onChange={free_shipping=>set({free_shipping})}/></>;
 if(resource==='orders')return <><h2>جزئیات سفارش</h2><p>{clean(item.billing?.first_name)} {clean(item.billing?.last_name)}</p><p dir="auto">{item.billing?.email} · {item.billing?.phone}</p><p>{clean(item.billing?.address_1)} {clean(item.billing?.city)}</p><ul>{item.line_items?.map(line=><li key={line.id}>{clean(line.name)} × {fa(line.quantity)} · {line.total}</li>)}</ul><p>جمع: {item.total} {item.currency} · روش پرداخت: {clean(item.payment_method_title)}</p><p className="manage-hint">این بخش بازپرداخت انجام نمی‌دهد و پرداخت آنلاینِ تأییدنشده را قطعی نمی‌کند. لغو یا تکمیل می‌تواند ایمیل و موجودی را تغییر دهد.</p>{field('status','وضعیت',{options:{[item.status]:item.status,'on-hold':'در انتظار اقدام',processing:'در حال انجام',completed:'تکمیل‌شده',cancelled:'لغوشده'}})}{field('customer_note','یادداشت مشتری',{large:true})}</>;
 if(resource==='locations')return <LocationFields value={v.locations} onChange={locations=>set({locations})}/>;
 if(resource==='zones')return <>{field('name','نام منطقه')}{field('order','اولویت (عدد کمتر زودتر بررسی می‌شود)',{type:'number'})}<p className="manage-hint">بعد از ذخیره، محدودهٔ جغرافیایی و روش‌های ارسال را تنظیم کنید. منطقهٔ بدون محدوده، همهٔ نشانی‌ها را شامل می‌شود؛ تا تنظیم محدوده، روش‌های آن را غیرفعال نگه دارید.</p></>;
 if(resource==='zone-methods'||resource==='gateways')return <>
  {item.new&&field('method_id','نوع روش',{options:{flat_rate:'نرخ ثابت',free_shipping:'ارسال رایگان',local_pickup:'تحویل حضوری'}})}
  {resource==='gateways'&&<>{field('title','عنوان درگاه')}{field('description','توضیح در صورت‌حساب',{large:true})}</>}
  <Check label="فعال" value={v.enabled} onChange={enabled=>set({enabled})}/>
  <p className="manage-hint">فعال‌سازی به معنی آمادگی پرداخت یا ارسال نیست. اعتبار پذیرنده، محدوده و هزینه‌ها را پیش از فروش واقعی آزمایش کنید. مقادیر محرمانه نمایش داده نمی‌شوند؛ فیلد خالی، مقدار قبلی را حفظ می‌کند.</p>
  {Object.entries(item.settings??{}).filter(([,f])=>!['title','sectionend'].includes(f.type)).map(([key,f])=><NativeSetting key={key} name={key} field={f} value={v.settings[key]??(f.private?'':f.value??'')} onChange={value=>set({settings:{...v.settings,[key]:value}})}/>)}
 </>;
 return null;
}

function NativeSetting({name,field:f,value,onChange}){
 const label=clean(f.label||f.title||name);
 if(f.private)return <Field label={label} type="password" value={value} onChange={onChange} hint={f.configured?'مقدار قبلی پنهان است؛ خالی بگذارید تا حفظ شود.':'مقدار محرمانه را وارد کنید.'}/>;
 if(f.type==='checkbox')return <Check label={label} value={value==='yes'||value===true} onChange={checked=>onChange(checked?'yes':'no')}/>;
 if(f.type==='multiselect')return <fieldset className="commerce-option-list"><legend>{label}</legend>{Object.entries(f.options||{}).map(([key,title])=><Check key={key} label={clean(title)} value={Array.isArray(value)&&value.includes(key)} onChange={checked=>onChange(checked?[...new Set([...(Array.isArray(value)?value:[]),key])]:(Array.isArray(value)?value:[]).filter(v=>v!==key))}/>)}</fieldset>;
 if(!['text','textarea','select','number','price','decimal','email'].includes(f.type))return <p className="manage-hint">{label}: این نوع تنظیم هنوز قابل ویرایش نیست؛ مقدار فعلی حفظ می‌شود.</p>;
 return <Field label={label} value={value} onChange={onChange} large={f.type==='textarea'} options={f.type==='select'?f.options:undefined} hint={clean(f.description)}/>;
}
function LocationFields({value,onChange}){
 const choices={IR:'سراسر ایران',...Object.fromEntries(Object.entries(IRAN_STATES).map(([key,label])=>['IR:'+key,label]))};
 const [region,setRegion]=useState('IR'),[postcode,setPostcode]=useState('');
 function add(location){if(!value.some(item=>item.type===location.type&&item.code===location.code))onChange([...value,location]);}
 return <section><h2>فروشگاه به کجا ارسال می‌کند؟</h2><p className="manage-hint">کشور یا استان‌ها را انتخاب کنید. کد پستی، محدودهٔ انتخاب‌شده را محدودتر می‌کند. محدودهٔ خالی یعنی همهٔ نشانی‌ها؛ ترتیب مناطق هم در انتخاب روش ارسال مؤثر است.</p><Field label="کشور یا استان" value={region} options={choices} onChange={setRegion}/><button onClick={()=>add({type:region==='IR'?'country':'state',code:region})}>افزودن محدوده</button><Field label="کد پستی (اختیاری)" value={postcode} onChange={setPostcode} hint="اعداد لاتین؛ برای پیشوند از * استفاده کنید، مثلاً ۱۴* را به صورت 14* وارد کنید."/><button disabled={!/^[0-9* .-]{1,80}$/.test(postcode)} onClick={()=>{add({type:'postcode',code:postcode});setPostcode('');}}>افزودن کد پستی</button><ul>{value.map((location,index)=><li key={location.type+location.code}><span>{choices[location.code]||location.code} — {location.type==='postcode'?'کد پستی':'محدوده'}</span><button onClick={()=>onChange(value.filter((_,i)=>i!==index))}>برداشتن {choices[location.code]||location.code}</button></li>)}</ul>{!value.length&&<p className="manage-message">هنوز محدوده‌ای انتخاب نشده است؛ این منطقه محدود به ایران نیست.</p>}</section>;
}
function ProductImages({value,original,onChange}){
 const [target,setTarget]=useState(null),[added,setAdded]=useState([]);
 const known=[...original,...added];
 return <section><h2>تصاویر محصول</h2><p className="manage-hint">اولین تصویر، تصویر اصلی محصول است. تصاویر از کتابخانهٔ همین فروشگاه انتخاب می‌شوند.</p><div className="commerce-images">{value.map((image,index)=>{const media=known.find(item=>item.id===image.id);return <div key={image.id}>{media&&<img src={media.src||media.url} alt={media.alt||'تصویر محصول'}/>}<span>تصویر {fa(index+1)}</span><button disabled={index===0} onClick={()=>onChange([image,...value.filter(i=>i.id!==image.id)])}>تصویر اصلی</button><button onClick={()=>onChange(value.filter(i=>i.id!==image.id))}>برداشتن</button></div>;})}</div><button disabled={value.length>=20} onClick={()=>setTarget({onSelectItem:media=>{setAdded(items=>[...items,media]);if(!value.some(i=>i.id===media.id))onChange([...value,{id:media.id}]);}})}>انتخاب یا بارگذاری تصویر</button><MediaDialog target={target} onClose={()=>setTarget(null)}/></section>;
}
function CategoryPicker({value,onChange}){
 const [items,setItems]=useState([]),[query,setQuery]=useState(''),[page,setPage]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{setBusy(true);call({resource:'categories',verb:'list',query:{search:query,page}}).then(result=>active&&setItems(result.items)).catch(e=>active&&setError(e.message)).finally(()=>active&&setBusy(false));},250);return()=>{active=false;clearTimeout(timer);};},[query,page]);
 return <section className="commerce-category-picker"><h2>دسته‌بندی محصول</h2><Field label="جست‌وجوی دسته‌بندی" value={query} onChange={text=>{setQuery(text);setPage(1);}}/>{error&&<p role="alert">{error}</p>}{busy?<p role="status">در حال دریافت دسته‌ها…</p>:items.map(category=><Check key={category.id} label={clean(category.name)} value={value.some(c=>c.id===category.id)} onChange={checked=>onChange(checked?[...value,{id:category.id}]:value.filter(c=>c.id!==category.id))}/>)}<div className="commerce-pagination"><button disabled={busy||page===1} onClick={()=>setPage(n=>n-1)}>دسته‌های قبل</button><small>{fa(value.length)} دسته انتخاب شده</small><button disabled={busy||items.length<20} onClick={()=>setPage(n=>n+1)}>دسته‌های بعد</button></div></section>;
}
