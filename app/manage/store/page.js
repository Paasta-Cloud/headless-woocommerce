import '../manage.css';
import './store.css';
import '../studio.css';
import CommerceManager from './workspace';
export const metadata={title:'مدیریت عملیات فروشگاه',robots:{index:false,follow:false}};
export default function StoreManagement(){const category=Number(process.env.WOOCOMMERCE_CATEGORY_ID);return <CommerceManager catalogCategoryId={Number.isSafeInteger(category)&&category>0?category:null}/>;}
