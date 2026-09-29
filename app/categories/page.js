import StoreLink from '../components/store-link';
import {getProducts} from '../../lib/store';
import {catalogCategories} from '../../lib/catalog';
import {Breadcrumbs,EmptyState} from '../components/ui';
import Icon from '../components/icons';
export const metadata={title:'دسته‌بندی محصولات | خانه‌چین'};
export const dynamic='force-dynamic';
export default async function CategoriesPage(){const {products,error}=await getProducts();const categories=catalogCategories(products);return <main className="shop-shell"><Breadcrumbs items={[{label:'دسته‌بندی‌ها'}]}/><div className="page-heading"><span className="eyebrow">کشف هنر و صنایع‌دستی</span><h1>دسته‌بندی محصولات</h1><p>از میان هنرها و کاربردها، مسیر انتخاب خود را پیدا کنید.</p></div>{error?<p className="form-error" role="alert">{error}</p>:categories.length?<div className="categories-grid">{categories.map(c=><StoreLink className="category-card" key={c.id} href={`/category/${c.id}`}><div>{c.image?<img src={c.image} alt="" loading="lazy"/>:<Icon name="grid"/>}</div><h2>{c.name}</h2><span>{c.count.toLocaleString('fa-IR')} محصول</span></StoreLink>)}</div>:<EmptyState icon="grid" title="هنوز دسته‌ای ثبت نشده است">پس از افزودن محصولات، دسته‌بندی‌های فروشگاه اینجا نمایش داده می‌شوند.</EmptyState>}</main>;}
