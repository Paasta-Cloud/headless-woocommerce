import Storefront from './storefront';
import { getProducts } from '../lib/store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const store = await getProducts();
  return <Storefront {...store} />;
}
