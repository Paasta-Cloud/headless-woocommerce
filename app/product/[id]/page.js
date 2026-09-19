import { notFound } from 'next/navigation';
import { getProduct, storeOrigin } from '../../../lib/store';
import ProductView from './product-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const product = await getProduct(Number((await params).id)).catch(() => null);
  return { title: product ? `${product.name} | خانه‌چین` : 'کالا پیدا نشد | خانه‌چین', description: product?.description?.replace(/<[^>]*>/g, '').slice(0, 155) || '' };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(Number((await params).id));
  if (!product) notFound();
  return <ProductView product={product} mode={storeOrigin() ? 'live' : 'demo'} />;
}
