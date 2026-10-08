import ContentPage from '../../components/content-page';
import '../../blog/content.css';
export const dynamic='force-dynamic';
export default async function Page({params}){const {slug}=await params;return <ContentPage type="page" slug={slug}/>;}
