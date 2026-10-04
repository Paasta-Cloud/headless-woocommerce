import Link from 'next/link';
import {notFound} from 'next/navigation';
import {StoreFrame} from '../../components/store-shell';
import CraftStore from '../../craft-store';
import {getDesign} from '../../../lib/design-server';
import {applyStorePreset,storePresets} from '../../../lib/store-presets';
import digital from '../../../lib/demo-digital.json';
import grocery from '../../../lib/demo-grocery.json';

export const metadata={title:'پیش‌نمایش قالب فروشگاه',robots:{index:false,follow:false}};
export default async function Demo({params}){
  const {theme}=await params;
  const preset=storePresets.find(item=>item.id===theme);
  if(!preset)notFound();
  const {design}=await getDesign();
  const catalog=theme==='digital'?digital:grocery;
  const preview=applyStorePreset(design,theme);
  Object.assign(preview.settings,{name:preset.name,logo:'',tagline:'نمونهٔ نمایشی؛ ثبت سفارش ندارد',announcement:`پیش‌نمایش قالب ${preset.name}`,announcementNote:'محصولات و قیمت‌ها نمونه‌اند؛ پیشنهاد فروش نیستند.',description:'کاتالوگ نمایشی مستقل',footerText:'این صفحه صرفاً پیش‌نمایش قالب است. خرید از آن فعال نیست.'});
  return <><header className="template-preview-toolbar"><div><h1>{preset.name}</h1><p>کاتالوگ نمایشی مستقل؛ قیمت‌ها پیشنهاد فروش نیستند. خرید و لینک‌های داخل ویترین غیرفعال‌اند. فروشگاه اصلی تغییر نکرده است.</p></div><nav aria-label="قالب‌ها">{storePresets.map(item=><Link aria-current={item.id===theme?'page':undefined} key={item.id} href={`/demos/${item.id}`}>{item.name}</Link>)}<Link href="/manage">مدیریت و انتخاب قالب</Link><Link href="/">فروشگاه اصلی</Link></nav></header><div inert><StoreFrame mode="preview" settings={preview.settings}><CraftStore products={catalog.products} design={preview}/></StoreFrame></div><p className="template-preview-source">داده‌ها و تصاویر مرجع: <a href={catalog.source} target="_blank" rel="noopener noreferrer">{preset.reference}</a> · برداشت ۱۲ مهر ۱۴۰۵؛ صرفاً برای نمایش قالب.</p></>;
}
