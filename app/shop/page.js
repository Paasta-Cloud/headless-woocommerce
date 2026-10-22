import {getProducts,getCategories} from '../../lib/store';
import {catalogFilters} from '../../lib/catalog-query';
import CatalogView from './catalog-view';
export const metadata={title:'محصولات'};
export const dynamic='force-dynamic';
export default async function ShopPage({searchParams}){const filters=catalogFilters(await searchParams);const [data,taxonomy]=await Promise.all([getProducts(filters),getCategories()]);return <CatalogView key={JSON.stringify(filters)} {...data} categories={taxonomy.categories} categoryError={taxonomy.error}/>;}
