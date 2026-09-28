import {notFound} from 'next/navigation';
import {getProducts} from '../../../lib/store';
import {catalogCategories} from '../../../lib/catalog';
import CatalogView from '../../shop/catalog-view';
export const dynamic='force-dynamic';
export const metadata={title:'محصولات دسته‌بندی | خانه‌چین'};
export default async function CategoryPage({params}){const data=await getProducts();if(data.error)return <CatalogView {...data}/>;const id=Number((await params).id);const category=catalogCategories(data.products).find(c=>c.id===id);if(!category)notFound();return <CatalogView {...data} category={category}/>;}
