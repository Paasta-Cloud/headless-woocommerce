import {Breadcrumbs} from './components/ui';
export default function Loading(){return <main className="shop-shell" aria-busy="true"><Breadcrumbs items={[{label:'در حال بارگذاری'}]}/><section className="loading-panel" role="status"><p>در حال آماده‌کردن صفحه…</p><div className="skeleton short"/><div className="skeleton large"/><div className="skeleton"/></section></main>;}
