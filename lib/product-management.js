import {money,text} from './customer-orders.js';

export const productStatuses={publish:'منتشرشده',draft:'پیش‌نویس',private:'خصوصی',pending:'در انتظار بررسی'};
export const productTypes={simple:'ساده',variable:'متغیر',external:'خارجی',grouped:'گروهی'};
export const stockStatuses={instock:'موجود',outofstock:'ناموجود',onbackorder:'پیش‌خرید'};
export function stockLabel(item){
 const state=stockStatuses[item.stock_status]||'وضعیت ثبت نشده';
 return item.manage_stock&&item.stock_quantity!==null&&item.stock_quantity!==undefined&&item.stock_quantity!==''
  ?`${state} · ${Number(item.stock_quantity).toLocaleString('fa-IR')} عدد`:state;
}
export function productPrice(item,currency){return item.price!==null&&item.price!==undefined&&item.price!==''?money(item.price,currency):'قیمت ثبت نشده';}
export function variationTitle(item){return item.attributes?.map(a=>text(a.option)).filter(Boolean).join(' / ')||'تنوع بدون گزینه';}
// Display only: never change the native WooCommerce price, quantity or attribute payload.
export function draftPrice(draft,item,currency){
 if(draft.type==='variable'||draft.type==='grouped')return productPrice(item,currency);
 const value=draft.sale_price!==''&&draft.sale_price!==undefined&&draft.sale_price!==null?draft.sale_price:draft.regular_price;
 return value!==''&&value!==undefined&&value!==null?money(value,currency):'قیمت ثبت نشده';
}
