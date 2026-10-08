'use client';
import {useId,useState,useEffect} from 'react';
import Icon from '../../components/icons';
import {Badge,Switch} from '../../components/vibefarsi/controls';
import {MediaDialog} from '../workspace';
import {text} from '../../../lib/customer-orders';
import {productStatuses,productTypes,stockStatuses,stockLabel,productPrice,draftPrice,variationTitle} from '../../../lib/product-management';

const fa=n=>Number(n).toLocaleString('fa-IR');
const sections=[['details','مشخصات','bag'],['pricing','قیمت و موجودی','order'],['media','تصاویر','eye'],['content','توضیحات','info'],['organization','دسته و ویژگی','grid']];
function Toggle({label,value,onChange,hint}){return <div className="product-toggle"><div><strong>{label}</strong>{hint&&<small>{hint}</small>}</div><Switch aria-label={label} checked={Boolean(value)} onCheckedChange={onChange}/></div>;}
export function ProductList({items,currency,onOpen,variation=false}){
 return <div className="commerce-table-wrap product-table-wrap"><table className="commerce-table product-table"><thead><tr><th scope="col">{variation?'تنوع محصول':'محصول'}</th><th scope="col">قیمت</th><th scope="col">موجودی</th><th scope="col">انتشار</th><th scope="col">عملیات</th></tr></thead><tbody>{items.map(item=>{const title=variation?variationTitle(item):text(item.name);return <tr key={item.id}><td><div className="commerce-title">{item.images?.[0]?.src?<img src={item.images[0].src} alt="" width={64} height={64} loading="lazy"/>:<span className="product-image-placeholder"><Icon name="bag"/></span>}<div><button type="button" className="product-name" onClick={()=>onOpen(item.id)} aria-label={'ویرایش '+title}>{title}</button><small>{!variation&&<span>{productTypes[item.type]||text(item.type)} · </span>}<bdi>#{item.id}</bdi>{item.sku&&<> · <bdi>{item.sku}</bdi></>}</small>{item.categories?.length>0&&<small className="product-list-categories">{item.categories.map(c=>text(c.name)).join('، ')}</small>}</div></div></td><td data-label="قیمت"><strong className="product-price">{productPrice(item,currency)}</strong></td><td data-label="موجودی"><span className={'product-stock '+(item.stock_status==='instock'?'is-instock':'')}>{stockLabel(item)}</span></td><td data-label="انتشار"><Badge variant={item.status==='publish'?'success':item.status==='draft'?'default':'warning'}>{productStatuses[item.status]||text(item.status)}</Badge></td><td><button type="button" onClick={()=>onOpen(item.id)} aria-label={'بازکردن '+title}>ویرایش<Icon name="arrow"/></button></td></tr>;})}</tbody></table></div>;
}

export default function ProductEditor({resource,value:v,set,item,currency,Field,call,onVariations}){
 const [active,setActive]=useState('details'),[media,setMedia]=useState([]),[visited,setVisited]=useState(['details']);
 const id=useId(),variation=resource==='variations';
 const tabs=variation?sections.filter(([key])=>key!=='media'):sections;
 const known=[...(item.images||[]),...media];
 const cover=known.find(image=>image.id===v.images?.[0]?.id);
 const field=(key,label,options={})=><Field label={label} value={v[key]} onChange={value=>set({[key]:value})} {...options}/>;
 function selectSection(key){setActive(key);setVisited(current=>current.includes(key)?current:[...current,key]);}
 function panel(key,title,hint,children){return <section hidden={active!==key} id={id+'-'+key} className="product-section" aria-label={title}><header><h2>{title}</h2><p>{hint}</p></header>{children}</section>;}
 return <div className="product-workbench"><div className="product-form"><nav className="product-sections" aria-label="بخش‌های ویرایش محصول">{tabs.map(([key,label,icon])=><button type="button" key={key} aria-pressed={active===key} aria-controls={id+'-'+key} onClick={()=>selectSection(key)}><Icon name={icon}/>{label}</button>)}</nav>
 {panel('details','مشخصات محصول','نام و شناسهٔ کالا را مشخص کنید؛ انتشار را از ستون کنار فرم تنظیم کنید.',<>
  {!variation&&field('name','نام محصول')}
  <div className="manage-field-grid">{!variation&&field('type','نوع محصول',{options:{simple:'ساده',variable:'متغیر',...(['external','grouped'].includes(v.type)?{[v.type]:productTypes[v.type]}:{})}})}{field('sku','شناسهٔ کالا (SKU)',{dir:'ltr',hint:'اختیاری؛ در فروشگاه باید یکتا باشد.'})}</div>
  {!variation&&<Toggle label="محصول مجازی" value={v.virtual} onChange={virtual=>set({virtual})} hint="محصول مجازی به ارسال فیزیکی نیاز ندارد."/>}
  {v.type==='variable'&&<div className="product-inline-help"><Icon name="grid"/><div><strong>هر گزینه، قیمت و موجودی خودش را دارد</strong><p>در «دسته و ویژگی» گزینه‌های محصول را تعریف کنید، سپس آن‌ها را ذخیره کنید و تنوع‌ها را بسازید.</p>{!item.new&&item.type==='variable'&&<button type="button" onClick={onVariations}>مدیریت تنوع‌ها<Icon name="arrow"/></button>}</div></div>}
  {['external','grouped'].includes(v.type)&&<p className="manage-hint">تنظیمات اختصاصی این نوع محصول در این فرم نمایش داده نمی‌شوند و در ذخیره حفظ می‌شوند.</p>}
 </>)}
 {panel('pricing','قیمت و موجودی',`مبلغ‌ها با واحد ${currency==='IRT'?'تومان':currency==='IRR'?'ریال':currency||'تنظیم‌شده در فروشگاه'} ذخیره می‌شوند؛ قیمت نهایی را ووکامرس محاسبه می‌کند.`,<>
  {v.type==='variable'?<div className="product-inline-help"><Icon name="info"/><div><strong>قیمت را در هر تنوع تنظیم کنید</strong><p>قیمت پایهٔ محصول متغیر از تنوع‌های آن به دست می‌آید.</p>{!item.new&&item.type==='variable'&&<button type="button" onClick={onVariations}>مدیریت تنوع‌ها</button>}</div></div>:<div className="manage-field-grid">{field('regular_price','قیمت عادی',{dir:'ltr',inputMode:'decimal',hint:'عدد با ارقام لاتین؛ بدون جداکننده.'})}{field('sale_price','قیمت فروش ویژه',{dir:'ltr',inputMode:'decimal',hint:'خالی بگذارید تا فروش ویژه حذف شود.'})}</div>}
  <Toggle label="مدیریت تعداد موجودی" value={v.manage_stock} onChange={manage_stock=>set({manage_stock})} hint="با هر خرید، تعداد موجودی در ووکامرس به‌روزرسانی می‌شود."/>
  <div className="manage-field-grid">{v.manage_stock&&field('stock_quantity','تعداد موجودی',{type:'number',dir:'ltr'})}{field('stock_status','وضعیت موجودی',{options:stockStatuses})}</div>
 </>)}
 {!variation&&panel('media','تصاویر محصول','اولین تصویر، تصویر اصلی است. تصاویر را از کتابخانهٔ فروشگاه انتخاب یا بارگذاری کنید.',<ProductImages value={v.images} known={known} onMedia={image=>setMedia(current=>[...current,image])} onChange={images=>set({images})}/>)}
 {panel('content','توضیحات محصول','متن معرفی را از اطلاعات قیمت و موجودی جدا نگه دارید.',<>{!variation&&field('short_description','توضیح کوتاه',{large:true,hint:'معرفی کوتاه کنار تصویر و دکمهٔ خرید.'})}{field('description','توضیحات کامل',{large:true,hint:'متن یا HTML فعلی محصول؛ این فرم کد را اجرا نمی‌کند.'})}</>)}
 {panel('organization',variation?'گزینه‌های تنوع':'دسته و ویژگی',variation?'برای هر ویژگی، گزینهٔ همین تنوع را وارد کنید.':'دسته‌ها جای محصول را در فروشگاه مشخص می‌کنند؛ ویژگی‌ها برای مشخصات و تنوع‌ها هستند.',<>
  {!variation&&visited.includes('organization')&&<CategoryPicker value={v.categories} original={item.categories||[]} onChange={categories=>set({categories})} Field={Field} call={call}/>}
  <div className="product-subheading"><h3>{variation?'گزینه‌های این تنوع':'ویژگی‌های محصول'}</h3><button type="button" onClick={()=>set({attributes:[...v.attributes,variation?{name:'',option:''}:{name:'',visible:true,variation:true,options:[]}]})}>+ افزودن ویژگی</button></div>
  {!v.attributes.length&&<p className="product-empty-note">هنوز ویژگی‌ای تعریف نشده است. برای مثال «رنگ» با گزینه‌های «سبز، کرم» اضافه کنید.</p>}
  {v.attributes.map((a,index)=><section className="product-attribute" key={index} aria-label={'ویژگی '+fa(index+1)}><div className="manage-field-grid"><Field label="نام ویژگی" value={a.name} onChange={name=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,name}:entry)})}/><Field label={variation?'گزینهٔ انتخاب‌شده':'گزینه‌ها با ویرگول'} value={a.option??a.options?.join('، ')??''} onChange={value=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,...(variation?{option:value}:{options:value.split(/[,،]/).map(s=>s.trim()).filter(Boolean)})}:entry)})}/></div><div className="product-attribute-actions">{!variation&&<Toggle label="استفاده برای تنوع" value={a.variation} onChange={enabled=>set({attributes:v.attributes.map((entry,i)=>i===index?{...entry,variation:enabled}:entry)})}/>}<button type="button" className="manage-danger" aria-label={'حذف ویژگی '+(a.name||fa(index+1))} onClick={()=>set({attributes:v.attributes.filter((_,i)=>i!==index)})}>حذف ویژگی</button></div></section>)}
 </>)}
 </div>
 <aside className="product-summary" aria-label="خلاصه و انتشار محصول">
  <div className="product-preview-image">{cover?<img src={cover.src||cover.url} alt={cover.alt||'تصویر اصلی محصول'} width={240} height={200}/>:<><Icon name="bag"/><span>{variation?'تنوع محصول':'تصویر محصول را انتخاب کنید'}</span></>}</div>
  <small>پیش‌نمایش مقادیر فرم</small>
  <h2>{variation?variationTitle(v):v.name||'محصول تازه'}</h2>
  <strong className="product-summary-price">{draftPrice(v,item,currency)}</strong>
  {v.type==='variable'&&<small>قیمت فعلی ثبت‌شده برای تنوع‌ها</small>}
  <div className="product-summary-meta"><span>{productTypes[v.type]||(variation?'تنوع':'محصول')}</span><bdi>{v.sku||(!item.new?'#'+item.id:'بدون شناسه')}</bdi></div>
  <hr/>{field('status','وضعیت انتشار',{options:productStatuses})}
  <p className="product-publication-note">{v.status==='publish'?'پس از ذخیره، محصول منتشرشده برای بازدیدکنندگان در دسترس است؛ نمایش در ویترین به تنظیمات دسته‌ها هم بستگی دارد.':'با ذخیرهٔ این وضعیت، محصول در ویترین عمومی نمایش داده نمی‌شود.'}</p>
  <div className="product-summary-stock"><span>موجودی فرم</span><strong>{stockLabel(v)}</strong></div>
  {!item.new&&<small>شناسهٔ ووکامرس: <bdi>#{item.id}</bdi></small>}
 </aside></div>;
}

function ProductImages({value,known,onMedia,onChange}){
 const [target,setTarget]=useState(null);
 return <><div className="product-gallery">{value.map((image,index)=>{const media=known.find(item=>item.id===image.id);return <div className="product-gallery-item" key={image.id}><div className="product-gallery-image">{media?<img src={media.src||media.url} alt={media.alt||'تصویر '+fa(index+1)} width={220} height={180}/>:<Icon name="bag"/>}{index===0&&<Badge variant="brand">تصویر اصلی</Badge>}</div><span>تصویر {fa(index+1)}</span><div><button type="button" disabled={index===0} aria-label={'اصلی کردن تصویر '+fa(index+1)} onClick={()=>onChange([image,...value.filter(i=>i.id!==image.id)])}>اصلی کردن</button><button type="button" aria-label={'برداشتن تصویر '+fa(index+1)} onClick={()=>onChange(value.filter(i=>i.id!==image.id))}><Icon name="close"/></button></div></div>;})}<button type="button" className="product-add-image" disabled={value.length>=20} onClick={()=>setTarget({onSelectItem:media=>{onMedia(media);if(!value.some(i=>i.id===media.id))onChange([...value,{id:media.id}]);}})}><Icon name="eye"/><strong>انتخاب یا بارگذاری تصویر</strong><span>{fa(value.length)} از {fa(20)} تصویر</span></button></div><MediaDialog target={target} onClose={()=>setTarget(null)}/></>;
}
function CategoryPicker({value,original,onChange,Field,call}){
 const [items,setItems]=useState([]),[known,setKnown]=useState(original),[total,setTotal]=useState(0),[query,setQuery]=useState(''),[page,setPage]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;const timer=setTimeout(()=>{setBusy(true);setError('');call({resource:'categories',verb:'list',query:{search:query,page}}).then(result=>{if(active){setItems(result.items);setTotal(result.total);setKnown(current=>[...current.filter(c=>!result.items.some(i=>i.id===c.id)),...result.items]);}}).catch(e=>active&&setError(e.message)).finally(()=>active&&setBusy(false));},250);return()=>{active=false;clearTimeout(timer);};},[query,page,retry,call]);
 return <section className="product-categories" aria-label="دسته‌بندی محصول"><div className="product-subheading"><h3>دسته‌بندی محصول</h3><small>{fa(value.length)} دسته انتخاب شده</small></div>{value.length>0&&<div className="product-category-chips">{value.map(c=><button type="button" key={c.id} aria-label={'برداشتن دسته '+text(known.find(i=>i.id===c.id)?.name||'#'+c.id)} onClick={()=>onChange(value.filter(i=>i.id!==c.id))}>{text(known.find(i=>i.id===c.id)?.name||'دستهٔ '+fa(c.id))}<Icon name="close"/></button>)}</div>}<Field label="جست‌وجوی دسته‌بندی" value={query} onChange={text=>{setQuery(text);setPage(1);}}/>{error?<div className="manage-message is-error" role="alert"><p>{error}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>تلاش دوباره</button></div>:busy?<p role="status">در حال دریافت دسته‌ها…</p>:<div className="product-category-options">{items.map(category=><label key={category.id}><input type="checkbox" checked={value.some(c=>c.id===category.id)} onChange={e=>onChange(e.target.checked?[...value,{id:category.id}]:value.filter(c=>c.id!==category.id))}/><span>{text(category.name)}</span></label>)}{!items.length&&<p className="manage-hint">دسته‌ای با این عبارت پیدا نشد.</p>}</div>}<div className="commerce-pagination"><button type="button" disabled={busy||page===1} onClick={()=>setPage(n=>n-1)}>دسته‌های قبل</button><small>صفحهٔ {fa(page)}</small><button type="button" disabled={busy||page*20>=total} onClick={()=>setPage(n=>n+1)}>دسته‌های بعد</button></div></section>;
}
