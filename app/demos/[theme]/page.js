import Link from 'next/link';
import {notFound} from 'next/navigation';
import {StoreFrame} from '../../components/store-shell';
import CraftStore from '../../craft-store';
import {getProducts} from '../../../lib/store';
import {getDesign} from '../../../lib/design-server';
import {applyStorePreset,storePresets} from '../../../lib/store-presets';

export const metadata={title:'پیش‌نمایش قالب فروشگاه',robots:{index:false,follow:false}};
export default async function Demo({params}){
  const {theme}=await params;
  const preset=storePresets.find(item=>item.id===theme);
  if(!preset)notFound();
  const [store,{design}]=await Promise.all([getProducts(),getDesign()]);
  const preview=applyStorePreset(design,theme);
  return <><header className="template-preview-toolbar"><div><h1>{preset.name}</h1><p>پیش‌نمایش ظاهری با محصولات همین فروشگاه؛ خرید و لینک‌های داخل ویترین غیرفعال‌اند. طراحی زنده تغییر نکرده است.</p></div><nav aria-label="قالب‌ها">{storePresets.map(item=><Link aria-current={item.id===theme?'page':undefined} key={item.id} href={`/demos/${item.id}`}>{item.name}</Link>)}<Link href="/manage">مدیریت و انتخاب قالب</Link><Link href="/">فروشگاه اصلی</Link></nav></header><div inert><StoreFrame mode="preview" settings={preview.settings}><CraftStore {...store} design={preview}/></StoreFrame></div></>;
}
