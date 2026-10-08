import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContent} from '../../lib/content-server';
import {ContentBody} from './content-body';
export default async function ContentPage({type,slug}){
 let data;try{data=await getContent({type,slug});}catch{return <main className="journal-page"><p className="journal-empty" role="alert">محتوا دریافت نشد. کمی بعد صفحه را تازه کنید.</p><Link href="/">بازگشت به فروشگاه</Link></main>;}
 const item=data.items[0];if(!item)notFound();
 return <main className="journal-page"><article className="journal-article"><Link href={type==='post'?'/blog':'/'}>{type==='post'?'بازگشت به مجله':'صفحهٔ اصلی'}</Link><h1>{item.title}</h1>{type==='post'&&<time>{new Date(item.date+'Z').toLocaleDateString('fa-IR')}</time>}{item.image&&<img className="journal-cover" src={item.image} alt=""/>}<ContentBody blocks={item.blocks}/></article></main>;
}
