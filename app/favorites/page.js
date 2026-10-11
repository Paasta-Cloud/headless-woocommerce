import { getProducts,storeOrigin } from '../../lib/store';
import FavoritesView from './view';

export const metadata = { title: 'علاقه‌مندی‌ها | خانه‌چین', description: 'کالاهایی که برای بعد نگه داشته‌اید.' };
export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const store = storeOrigin()?{products:[],mode:'live',error:''}:await getProducts();
  return <FavoritesView {...store} />;
}
