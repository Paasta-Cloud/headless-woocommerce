import defaults from '../wordpress/plugins/paasta-headless-builder/default-design.json' with {type:'json'};

export const sectionTypes=['hero','banners','categories','products','text-image','features','faq','spacer'];
const icons=['home','grid','heart','bag','user','check','order','info','pin','search'];
const text=(value,max=200)=>typeof value==='string'?value.replace(/<[^>]*>/g,'').slice(0,max):'';
const number=(value,min,max,fallback)=>(typeof value==='number'||(typeof value==='string'&&value.trim()!==''))&&Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.round(Number(value)))):fallback;
const color=(value,fallback='')=>/^#[a-f\d]{6}$/i.test(value||'')?value:fallback;
export function safeDesignUrl(value,asset=false){
  if(typeof value!=='string'||value.length>2048||/[\s<>"'\\\x00-\x1f]/.test(value))return '';
  if(!asset&&((value.startsWith('/')&&!value.startsWith('//'))||/^#[a-z\d_-]+$/i.test(value)))return value;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
function links(value,fallback,max){return (Array.isArray(value)?value:fallback).slice(0,max).map(item=>({label:text(item?.label,80),href:safeDesignUrl(item?.href),group:text(item?.group,80),icon:icons.includes(item?.icon)?item.icon:'info'})).filter(item=>item.label&&item.href);}
const ids=value=>Array.isArray(value)?[...new Set(value.filter(id=>Number.isSafeInteger(id)&&id>0))].slice(0,100):[];
export function normalizeDesign(raw){
  if(!raw||raw.version!==1||!Array.isArray(raw.sections)||!raw.settings||typeof raw.settings!=='object')throw Error('Unsupported storefront design');
  const s=raw.settings,d=defaults.settings;
  const settings={};
  for(const key of ['name','tagline','description','announcement','announcementNote','footerText','footerNote'])settings[key]=text(typeof s[key]==='string'?s[key]:d[key],key==='footerText'?1000:200);
  if(!settings.name)settings.name=d.name;
  for(const key of ['primary','background','surface','text','muted'])settings[key]=color(s[key],d[key]);
  for(const key of ['logo','favicon'])settings[key]=safeDesignUrl(s[key],true);
  settings.font=['system','tahoma','custom'].includes(s.font)?s.font:'system';
  settings.fontUrl=safeDesignUrl(s.fontUrl,true);if(!/\.woff2?(\?|$)/i.test(settings.fontUrl))settings.fontUrl='';
  settings.fontSize=number(s.fontSize,12,20,14);settings.containerWidth=number(s.containerWidth,960,1440,1240);
  settings.headerLinks=links(s.headerLinks,d.headerLinks,12);settings.footerLinks=links(s.footerLinks,d.footerLinks,36);settings.mobileLinks=links(s.mobileLinks,d.mobileLinks,5);
  const sections=raw.sections.slice(0,40).filter(section=>section&&sectionTypes.includes(section.type)).map(section=>({
    type:section.type,title:text(section.title),subtitle:text(section.subtitle),body:text(section.body,5000),buttonLabel:text(section.buttonLabel,80),href:safeDesignUrl(section.href),image:safeDesignUrl(section.image,true),
    enabled:section.enabled!==false,visibility:['all','desktop','mobile'].includes(section.visibility)?section.visibility:'all',
    background:color(section.background),columns:number(section.columns,1,6,4),mobileColumns:number(section.mobileColumns,1,2,2),gap:number(section.gap,8,48,20),padding:number(section.padding,0,80,0),spacing:number(section.spacing,0,80,24),
    source:['all','category','manual'].includes(section.source)?section.source:'all',categoryId:number(section.categoryId,0,2147483647,0),productIds:ids(section.productIds),categoryIds:ids(section.categoryIds),limit:number(section.limit,1,100,12),sort:['newest','cheap','expensive'].includes(section.sort)?section.sort:'newest',display:section.display==='carousel'?'carousel':'grid',showFilters:section.showFilters===true,imageSide:section.imageSide==='left'?'left':'right',
    items:(Array.isArray(section.items)?section.items:[]).slice(0,20).map(item=>({title:text(item?.title),body:text(item?.body,2000),image:safeDesignUrl(item?.image,true),href:safeDesignUrl(item?.href),icon:icons.includes(item?.icon)?item.icon:'info'}))
  }));
  return {version:1,settings,sections};
}
export const defaultDesign=normalizeDesign(defaults);
export function contrastingText(hex){const rgb=hex.slice(1).match(/../g).map(part=>parseInt(part,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;return luminance>.179?'#111111':'#ffffff';}
