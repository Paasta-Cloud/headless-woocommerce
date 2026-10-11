import Storefront from './craft-store';
import { getHomeProducts } from '../lib/store';
import { getDesign } from '../lib/design-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const {design}=await getDesign();
  const store=await getHomeProducts(design);
  return <Storefront {...store} design={design} />;
}
