import {normalizeDesign} from './design.js';
import {presetAssets} from './preset-assets.js';

export const storePresets=[
 {id:'digital',name:'ویترین دیجیتال',reference:'Dina',description:'استوری، اسلایدر تب‌دار، ویترین منتخب و دسته‌بندی تصویری کالاهای دیجیتال.',color:'#009eae',background:'#f4f5f8',sections:['استوری‌ها','اسلایدر و محصول منتخب','خدمات','بنرها','ویترین منتخب','پیشنهادها','دسته‌بندی‌ها','تازه‌ها','فهرست شماره‌دار','ویترین دسته‌ها','مجله','برندها']},
 {id:'grocery',name:'خرید روزمره',reference:'Dinama',description:'استوری‌های سبز، بنرهای خرید روزمره، ویترین دسته‌ها و کنترل تعداد کالا.',color:'#e52e59',background:'#f4f5f8',sections:['استوری‌ها','اسلایدر و محصول منتخب','خدمات','بنرها','پیشنهادها','ویترین منتخب','تازه‌ها','بنر عریض','ویترین دسته‌ها','بنرهای تکمیلی','فهرست شماره‌دار','برندها','مجله']},
];

// Design-only drafts: no product import, catalog replacement, checkout or identity changes.
export function applyStorePreset(design,id){
 const preset=storePresets.find(item=>item.id===id);
 if(!preset)throw Error('Unknown storefront preset');
 const current=normalizeDesign(design),assets=presetAssets[id];
 const shelf=(title,presentation='standard')=>({type:'products',title,presentation,source:'all',sort:'newest',limit:12,columns:5,display:'carousel',gap:12});
 const banners=(items,columns=items.length)=>({type:'banners',items,columns,gap:20});
 const stories={...banners(assets.stories),presentation:'stories',title:'داستان‌های فروشگاه'};
 const hero={type:'hero',title:'اسلایدر فروشگاه',featuredProduct:true,imageSide:id==='grocery'?'left':'right',items:assets.slides,spacing:20};
 const guide={type:'features',title:'راهنمای خرید',columns:5,gap:20,items:[{title:'قیمت و موجودی',body:'اطلاعات به‌روز فروشگاه',href:'/shop',icon:'check'},{title:'پشتیبانی خرید',body:'راه‌های ارتباط با فروشگاه',href:'/contact',icon:'user'},{title:'شرایط بازگشت',body:'پیش از خرید بخوانید',href:'/terms',icon:'order'},{title:'انتخاب‌های شما',body:'علاقه‌مندی‌های ذخیره‌شده',href:'/favorites',icon:'heart'},{title:'دریافت سفارش',body:'روش‌های تحویل و ارسال',href:'/guide',icon:'bag'}]};
 const spotlight={...shelf('انتخاب ویژهٔ فروشگاه','spotlight'),limit:5};
 const offers={...shelf('پیشنهادهای فروشگاه','offers'),background:id==='grocery'?'#d62b50':'#009eae',padding:20};
 const latest=shelf('جدیدترین محصولات');
 const ranked=shelf('منتخب محصولات','ranked');
 const showcase={type:'categories',title:'خرید از دسته‌بندی‌ها',presentation:'showcase',columns:4};
 const editorial={...banners(assets.editorial,4),title:id==='grocery'?'مجلهٔ سبک زندگی':'مجلهٔ تکنولوژی',presentation:'editorial'};
 const brands={type:'banners',presentation:'brands',title:'برندهای منتخب',items:assets.brands};
 const sections=id==='digital'?[stories,hero,guide,banners(assets.banners),spotlight,offers,{...banners(assets.categories,6),title:'دسته‌بندی‌های فروشگاه',presentation:'editorial'},latest,ranked,showcase,editorial,brands]:[stories,hero,guide,banners(assets.banners),offers,spotlight,latest,banners(assets.wide),showcase,banners(assets.secondary),ranked,brands,editorial];
 const result=normalizeDesign({...current,settings:{...current.settings,theme:id,primary:preset.color,background:preset.background,containerWidth:1440},sections:sections.map(s=>({spacing:20,...s}))});
 if(typeof design.settings.frontendUrl==='string')result.settings.frontendUrl=design.settings.frontendUrl;
 return result;
}
