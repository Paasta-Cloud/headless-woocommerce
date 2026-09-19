import Storefront from './storefront';
import { getProducts } from '../lib/store';

export default async function Home() {
  const store = await getProducts();
  return <Storefront {...store} />;
}
