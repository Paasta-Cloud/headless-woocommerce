import { notFound } from 'next/navigation';
import { getProduct, getProducts, getVariations, storeOrigin } from '../../../lib/store';
import ProductView from './product-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const product = await getProduct(Number((await params).id)).catch(() => null);
  return { title: product ? product.name : 'کالا پیدا نشد', description: product?.description?.replace(/<[^>]*>/g, '').slice(0, 155) || '' };
}

export default async function ProductPage({ params }) {
  const product=await getProduct(Number((await params).id));
  if (!product) notFound();
  const {products}=await getProducts({perPage:5,...(product.categoryRefs?.[0]?.id?{category:product.categoryRefs[0].id}:{})});
  // Variation stock and price come from the Store API products query; the
  // attribute pairs of each variation come from the parent product itself.
  let stock = null;
  let variationError = '';
  if (product.type === 'variable' && storeOrigin()) {
    try { stock = await getVariations(product.id); }
    catch (cause) { variationError = cause?.message || 'گزینه‌های این کالا دریافت نشد. دوباره تلاش کنید.'; }
  }
  const related = products.filter(item => item.id !== product.id && item.category === product.category).slice(0,4);
  return <ProductView product={product} mode={storeOrigin() ? 'live' : 'demo'} stock={stock} variationError={variationError} related={related} />;
}
