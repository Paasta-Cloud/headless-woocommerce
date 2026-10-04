import {normalizeDesign} from './design.js';

export const storePresets=[
  {id:'digital',name:'ویترین دیجیتال',reference:'Dina',description:'ویترین‌های افقی، دسته‌های در دسترس و فضای روشن برای مقایسهٔ کالاها.',color:'#007e91',background:'#f4f5f8',sections:['دسته‌بندی‌ها','اسلایدر و محصول منتخب','راهنمای خرید','تازه‌های فروشگاه','معرفی فروشگاه','همهٔ محصولات']},
  {id:'grocery',name:'خرید روزمره',reference:'Dinama',description:'دسته‌بندی در ابتدای صفحه و شبکهٔ متراکم‌تر برای خریدهای تکراری.',color:'#b92f58',background:'#f8f6f7',sections:['دسته‌بندی‌ها','اسلایدر و محصول منتخب','راهنمای خرید','تازه‌های فروشگاه','معرفی فروشگاه','همهٔ محصولات']},
];

// Presets are design-only drafts: never replace identity, catalog IDs, links or orders.
export function applyStorePreset(design,id){
  const preset=storePresets.find(item=>item.id===id);
  if(!preset)throw Error('Unknown storefront preset');
  const current=normalizeDesign(design);
  const introduction={type:'text-image',title:current.settings.name,body:current.settings.tagline,buttonLabel:'مشاهدهٔ محصولات',href:'/shop',padding:32,background:id==='digital'?'#e3f3f6':'#f9e8ee'};
  const categories={type:'categories',title:'دسته‌بندی‌های فروشگاه',columns:6,mobileColumns:2};
  const latest={type:'products',title:'تازه‌های فروشگاه',source:'all',sort:'newest',limit:12,columns:4,display:'carousel'};
  const catalog={type:'products',title:'محصولات فروشگاه',source:'all',limit:48,columns:id==='grocery'?5:4,showFilters:true};
  const guide={type:'features',title:'همراه خرید شما',columns:3,items:[{title:'انتخاب از دسته‌ها',body:'کالای موردنظرتان را پیدا کنید.',href:'/categories',icon:'grid'},{title:'انتخاب‌های ذخیره‌شده',body:'به علاقه‌مندی‌ها برگردید.',href:'/favorites',icon:'heart'},{title:'پیگیری سفارش‌ها',body:'خریدهایتان را در حساب ببینید.',href:'/account',icon:'order'}]};
  const slides=id==='digital'?['https://dina.i-design.ir/wp-content/uploads/2022/08/slide1.jpg','https://dina.i-design.ir/wp-content/uploads/2022/08/slide2.jpg','https://dina.i-design.ir/wp-content/uploads/2022/08/slide3.jpg','https://dina.i-design.ir/wp-content/uploads/2022/08/slide4.jpg']:['https://dinama.i-design.ir/wp-content/uploads/2025/04/slider1.jpg','https://dinama.i-design.ir/wp-content/uploads/2025/04/slider2.jpg','https://dinama.i-design.ir/wp-content/uploads/2025/04/slider3.jpg','https://dinama.i-design.ir/wp-content/uploads/2025/04/slider4.jpg'];
  const hero={type:'hero',title:'بنرهای نمایشی قالب؛ پیش از انتشار جایگزین کنید',featuredProduct:true,imageSide:id==='grocery'?'left':'right',items:slides.map((image,index)=>({image,title:`بنر نمایشی ${(index+1).toLocaleString('fa-IR')}`,href:'/shop'}))};
  const result=normalizeDesign({...current,settings:{...current.settings,theme:id,primary:preset.color,background:preset.background},sections:[categories,hero,guide,latest,introduction,catalog]});
  // Admin document carries the private preview destination outside the public schema.
  if(typeof design.settings.frontendUrl==='string')result.settings.frontendUrl=design.settings.frontendUrl;
  return result;
}
