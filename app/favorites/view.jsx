'use client';
import { Breadcrumbs } from '../components/ui';


import { useFavorites } from '../use-favorites';

export default function FavoritesView({ products, error }) {
  const favorites = useFavorites();
  const items = products.filter(product => favorites.ids.includes(product.id));
  const format = product => `${new Intl.NumberFormat('fa-IR').format(product.price)} ${product.unit || 'تومان'}`;

  return <main className="shop-shell"><Breadcrumbs items={[{label:'علاقه‌مندی‌ها'}]}/>
    
    <div className="page-heading"><span className="eyebrow">برای بعد نگه دارید</span><h1>علاقه‌مندی‌ها</h1><p>این فهرست فقط در همین مرورگر ذخیره می‌شود.</p></div>
    {error ? <p className="form-error" role="alert">{error}</p> : !favorites.ready ? <p role="status">در حال خواندن علاقه‌مندی‌ها…</p> : items.length ? <div className="favorite-list">{items.map(product => <article key={product.id}><a className={`favorite-image ${product.tone}`} href={`/product/${product.id}`}>{product.image ? <img src={product.image} alt={product.name}/> : product.label}</a><div><span>{product.category}</span><h2><a href={`/product/${product.id}`}>{product.name}</a></h2><strong>{format(product)}</strong></div><button type="button" onClick={() => favorites.toggle(product.id)} aria-label={`حذف ${product.name} از علاقه‌مندی‌ها`}>حذف</button></article>)}</div> : <div className="empty-state"><h2>هنوز کالایی نگه نداشته‌اید</h2><p>با دکمهٔ «علاقه‌مندی» کنار هر کالا، آن را برای بعد نگه دارید.</p><a className="primary-action" href="/#products">دیدن کالاها</a></div>}
  </main>;
}
