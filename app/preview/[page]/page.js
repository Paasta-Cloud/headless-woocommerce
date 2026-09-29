import {notFound} from 'next/navigation';
import {getDesign} from '../../../lib/design-server';
import About from '../../about/page';
import Contact from '../../contact/page';
import Guide from '../../guide/page';
import FAQ from '../../faq/page';
import Terms from '../../terms/page';
import Privacy from '../../privacy/page';
import PreviewStart from '../start';
import PreviewNavigation from '../navigation';
const pages={about:About,contact:Contact,guide:Guide,faq:FAQ,terms:Terms,privacy:Privacy};
export const dynamic='force-dynamic';
export const metadata={title:'پیش‌نمایش خصوصی صفحه',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function PreviewPage({params}){
  const {page}=await params;
  if(!Object.hasOwn(pages,page))notFound();
  const {preview}=await getDesign();
  const Page=pages[page];
  return <><PreviewStart ready={preview}/>{preview&&<><PreviewNavigation/><Page/></>}</>;
}
