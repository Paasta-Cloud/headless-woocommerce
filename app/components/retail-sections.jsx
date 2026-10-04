'use client';
// THESIS: Faithful Dina/Dinama composition, not a recolored craft grid.
// OWN-WORLD: White shelves, story rings, tabbed imagery, asymmetric hero.
// STORY: Explore campaigns, compare products, continue through the shared shop.
// FIRST VIEWPORT: Slim masthead, twelve stories, 3:1 hero and featured product.
// FORM: User-pinned references; no alternate direction or fake urgency.
import {useState} from 'react';
import StoreLink from './store-link';
import ProductCard from './product-card';
import Icon from './icons';
import {catalogCategories,inCategory,sectionProducts} from '../../lib/catalog';

export function RetailMedia({section}){
 const variant=section.presentation;
 const items=section.items.filter(item=>item.image||variant==='brands');
 return <div className={`retail-media retail-${variant}`}>
  {variant!=='stories'&&section.title&&<div className="craft-section-title"><h2>{section.title}</h2><Icon name="grid"/></div>}
  <div className={`retail-media-items${variant==='editorial'?' builder-grid':''}`}>
   {items.map((item,i)=><StoreLink key={i} href={item.href||'/shop'} className="retail-media-item">
    {item.image?<img src={item.image} alt={variant==='brands'?item.title:''} width={variant==='stories'?80:300} height={variant==='stories'?80:200} loading="lazy"/>:null}
    {variant!=='brands'||!item.image?<span>{item.title}</span>:null}
    {variant==='editorial'&&item.body&&<small>{item.body}</small>}
   </StoreLink>)}
  </div>
 </div>;
}
export function CategoryShowcase({section,products}){
 const categories=catalogCategories(products).filter(c=>!section.categoryIds.length||section.categoryIds.includes(c.id));
 return <div className="retail-category-showcase builder-grid">{categories.map(c=><section key={c.id}><h2>{c.name}</h2><div>{products.filter(p=>inCategory(p,c)).slice(0,4).map(p=><StoreLink key={p.id} href={`/product/${p.id}`} aria-label={p.name}><img src={p.thumbnail||p.image} alt={p.name} width="160" height="160" loading="lazy"/></StoreLink>)}</div><StoreLink href={`/category/${c.id}`}>مشاهدهٔ همه <Icon name="arrow"/></StoreLink></section>)}</div>;
}
export function RankedProducts({products}){
 return <div className="retail-ranked">{products.map((p,i)=><StoreLink key={p.id} href={`/product/${p.id}`}><img src={p.thumbnail||p.image} alt="" width="80" height="80" loading="lazy"/><b>{(i+1).toLocaleString('fa-IR')}</b><span>{p.name}</span></StoreLink>)}</div>;
}
export function ProductSpotlight({section,products}){
 const [selected,setSelected]=useState(0);
 const visible=sectionProducts(products,section);
 const p=visible[selected%visible.length];
 if(!p)return <div className="craft-empty"><h2>{section.title}</h2><p>محصولی برای این بخش پیدا نشد؛ دسته‌بندی یا انتخاب‌های بخش را بررسی کنید.</p></div>;
 return <div className="retail-spotlight"><StoreLink href={`/product/${p.id}`} className="retail-spotlight-image"><img src={p.image} alt={p.name} width="300" height="300" loading="lazy"/></StoreLink><div className="retail-spotlight-info"><h2>{section.title}</h2><h3>{p.name}</h3><strong>{p.price.toLocaleString('fa-IR')} <small>{p.unit}</small></strong><p>جزئیات، مشخصات و گزینه‌های این محصول را ببینید.</p><StoreLink href={`/product/${p.id}`} className="secondary-button">مشاهدهٔ محصول <Icon name="bag"/></StoreLink></div><div className="retail-spotlight-options" role="group" aria-label="انتخاب محصول ویژه">{visible.map((item,i)=><button key={item.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}><img src={item.thumbnail||item.image} alt="" width="44" height="44" loading="lazy"/><span>{item.name}</span></button>)}</div></div>;
}
export function FeaturedProduct({product}){
 return <aside className="retail-featured"><h2>پیشنهاد لحظه‌ای</h2><ProductCard product={product}/></aside>;
}
