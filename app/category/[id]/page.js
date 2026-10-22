import {notFound} from 'next/navigation';
import {getProducts,getCategories} from '../../../lib/store';
import {catalogFilters} from '../../../lib/catalog-query';
import CatalogView from '../../shop/catalog-view';
export const dynamic='force-dynamic';
export const metadata={title:'محصولات دسته‌بندی'};
export default async function CategoryPage({params,searchParams}){const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<=0)notFound();const filters=catalogFilters(await searchParams);const [data,taxonomy]=await Promise.all([getProducts({...filters,category:id}),getCategories()]);const category=taxonomy.categories.find(c=>c.id===id);if(!category&&!taxonomy.error)notFound();return <CatalogView key={JSON.stringify([id,filters])} {...data} categories={taxonomy.categories} category={category||{id,name:'محصولات دسته‌بندی'}} categoryError={taxonomy.error}/>;}
