import {getProducts} from '../../lib/store';
import CatalogView from './catalog-view';
export const metadata={title:'محصولات | خانه‌چین'};
export const dynamic='force-dynamic';
export default async function ShopPage({searchParams}){const data=await getProducts();const q=(await searchParams).q;return <CatalogView {...data} initialQuery={typeof q==='string'?q.slice(0,100):''}/>;}
