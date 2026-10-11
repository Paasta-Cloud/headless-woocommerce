import StoreLink from '../components/store-link';
import {getCategories} from '../../lib/store';
import {Breadcrumbs,EmptyState} from '../components/ui';
import Icon from '../components/icons';
export const metadata={title:'دسته‌بندی محصولات | خانه‌چین'};
export const dynamic='force-dynamic';
export default async function CategoriesPage(){const {categories,error}=await getCategories();return <main className="shop-shell"><Breadcrumbs items={[{label:'دسته‌بندی‌ها'}]}/><div className="page-heading"><span className="eyebrow">دسته‌بندی‌های فروشگاه</span><h1>دسته‌بندی محصولات</h1><p>از میان دسته‌ها، مسیر انتخاب خود را پیدا کنید.</p></div>{error?<p className="form-error" role="alert">{error}</p>:categories.length?<div className="categories-grid">{categories.map(c=><StoreLink className="category-card" key={c.id} href={`/category/${c.id}`}><div>{c.image?<img src={c.image} alt="" loading="lazy"/>:<Icon name="grid"/>}</div><h2>{c.name}</h2><span>{c.count.toLocaleString('fa-IR')} محصول</span></StoreLink>)}</div>:<EmptyState icon="grid" title="هنوز دسته‌ای ثبت نشده است">پس از افزودن محصولات، دسته‌بندی‌های فروشگاه اینجا نمایش داده می‌شوند.</EmptyState>}</main>;}
