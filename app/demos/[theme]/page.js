import Link from 'next/link';
import {notFound} from 'next/navigation';
import {StoreFrame} from '../../components/store-shell';
import CraftStore from '../../craft-store';
import {getDesign} from '../../../lib/design-server';
import {applyStorePreset,storePresets} from '../../../lib/store-presets';
import digital from '../../../lib/demo-digital.json';
import grocery from '../../../lib/demo-grocery.json';
import DemoBoundary from '../../components/demo-boundary';

export const metadata={title:'پیش‌نمایش قالب فروشگاه',robots:{index:false,follow:false}};
export default async function Demo({params}){
  const {theme}=await params;
  const preset=storePresets.find(item=>item.id===theme);
  if(!preset)notFound();
  const {design}=await getDesign();
  const catalog=theme==='digital'?digital:grocery;
  const preview=applyStorePreset(design,theme);
  // Keep the reference showcase compact without limiting merchants' category selections.
  preview.sections.filter(section=>section.presentation==='showcase').forEach(section=>{section.categoryIds=theme==='digital'?[122,262,293,204]:[227,231,204,205];});
  Object.assign(preview.settings,{name:preset.name,logo:theme==='grocery'?'https://dinama.i-design.ir/wp-content/uploads/2021/08/logo.png':'https://dina.i-design.ir/wp-content/themes/dinakala/images/logo.png',tagline:'پیش‌نمایش قالب فروشگاه',announcement:'فروشگاه اینترنتی خودتان را راه‌اندازی کنید',announcementNote:'با مدیریت مستقل و بکند ووکامرس',description:'کاتالوگ نمایشی مستقل',footerText:'این صفحه نمونهٔ نمایشی قالب است. محصولات و قیمت‌ها از مرجع طراحی برداشت شده‌اند و پیشنهاد فروش نیستند. هیچ خرید، ورود یا تغییر سبد واقعی از این صفحه انجام نمی‌شود.',headerLinks:[{label:'دسته‌بندی‌ها',href:'/categories'},{label:'ارتباط با ما',href:'/contact'}]});
  return <><header className="retail-preview-bar"><span>دموی نمایشی؛ خرید فعال نیست</span><nav aria-label="قالب‌ها">{storePresets.map(item=><Link aria-current={item.id===theme?'page':undefined} key={item.id} href={`/demos/${item.id}`}>{item.name}</Link>)}<Link href="/manage">انتخاب قالب</Link><Link href="/">فروشگاه اصلی</Link></nav></header><DemoBoundary products={catalog.products}><StoreFrame mode="preview" settings={preview.settings}><CraftStore products={catalog.products} design={preview}/></StoreFrame></DemoBoundary><p className="template-preview-source">داده‌ها و تصاویر مرجع: <a href={catalog.source} target="_blank" rel="noopener noreferrer">{preset.reference}</a> · برداشت ۱۲ مهر ۱۴۰۵؛ صرفاً برای نمایش قالب.</p></>;
}
