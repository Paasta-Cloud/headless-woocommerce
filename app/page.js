import Storefront from './craft-store';
import { getProducts } from '../lib/store';
import { getDesign } from '../lib/design-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [store, {design}] = await Promise.all([getProducts(), getDesign()]);
  return <Storefront {...store} design={design} />;
}
