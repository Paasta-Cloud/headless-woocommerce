import {getDesign} from '../../lib/design-server';
import {getProducts} from '../../lib/store';
import Storefront from '../craft-store';
import PreviewStart from './start';
export const dynamic='force-dynamic';
export const metadata={title:'پیش‌نمایش خصوصی',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Preview(){const {design,preview}=await getDesign();return <><PreviewStart ready={preview}/>{preview&&<Storefront {...await getProducts()} design={design}/>}</>;}
