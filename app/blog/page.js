import Link from 'next/link';
import {getContent} from '../../lib/content-server';
import {contentHref} from '../../lib/content';
import './content.css';
export const dynamic='force-dynamic';
export const metadata={title:'مجلهٔ فروشگاه'};
export default async function Blog({searchParams}){
 const params=await searchParams;const page=Math.max(1,Math.min(100,Number.parseInt(params?.page,10)||1));let data,error;
 try{data=await getContent({page});}catch{error=true;}
 return <main className="journal-page"><header className="journal-heading"><div><Link href="/">صفحهٔ اصلی</Link><h1>مجلهٔ فروشگاه</h1></div><Link href="/shop" className="secondary-button">دیدن محصولات</Link></header>{error?<p className="journal-empty" role="alert">مطالب دریافت نشدند. کمی بعد صفحه را تازه کنید.</p>:data.items.length?<><div className="journal-grid">{data.items.map(item=><Link className="journal-card" key={item.id} href={contentHref('posts',item.slug)}>{item.image&&<img src={item.image} alt="" loading="lazy"/>}<div><small>{new Date(item.date+'Z').toLocaleDateString('fa-IR')}</small><h2>{item.title}</h2>{item.excerpt&&<p>{item.excerpt}</p>}<span>خواندن مطلب ←</span></div></Link>)}</div><nav className="journal-pagination" aria-label="صفحه‌بندی مجله">{page>1&&<Link href={`/blog?page=${page-1}`}>صفحهٔ قبل</Link>}<span>صفحهٔ {page.toLocaleString('fa-IR')}</span>{page*12<data.total&&<Link href={`/blog?page=${page+1}`}>صفحهٔ بعد</Link>}</nav></>:<p className="journal-empty">هنوز مطلبی منتشر نشده است. نوشته‌های منتشرشدهٔ فروشگاه در این صفحه نمایش داده می‌شوند.</p>}</main>;
}
