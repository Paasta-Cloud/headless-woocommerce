import ContentPage from '../../components/content-page';
import '../content.css';
export const dynamic='force-dynamic';
export default async function BlogPost({params}){const {slug}=await params;return <ContentPage type="post" slug={slug}/>;}
