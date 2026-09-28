import {Breadcrumbs,EmptyState} from './components/ui';
export default function NotFound(){return <main className="shop-shell"><Breadcrumbs items={[{label:'صفحه پیدا نشد'}]}/><EmptyState icon="search" title="این صفحه پیدا نشد">ممکن است نشانی تغییر کرده باشد یا این کالا دیگر در فروشگاه نباشد. از دسته‌بندی‌ها یا جست‌وجو برای پیدا کردن انتخاب خود استفاده کنید.</EmptyState></main>;}
