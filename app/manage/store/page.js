import '../manage.css';
import './store.css';
import '../studio.css';
import './operations.css';
import './content.css';
import CommerceManager from './workspace';
export const metadata={title:'مدیریت عملیات فروشگاه',robots:{index:false,follow:false}};
export default async function StoreManagement({searchParams}){const params=await searchParams;const category=Number(process.env.WOOCOMMERCE_CATEGORY_ID);const tab=['products','orders','customers','posts','pages','categories','coupons','zones','gateways'].includes(params?.tab)?params.tab:'products';const id=Number(params?.customer);return <CommerceManager initialResource={tab} initialCustomerId={tab==='customers'&&Number.isSafeInteger(id)&&id>0?id:null} catalogCategoryId={Number.isSafeInteger(category)&&category>0?category:null}/>;}
