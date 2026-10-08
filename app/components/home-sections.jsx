'use client';
import StoreLink from './store-link';

import {useRef,useState} from 'react';
import {catalogCategories,filterProducts,inCategory} from '../../lib/catalog';
import ProductCard from './product-card';
import Icon from './icons';
import {useStoreSettings} from './store-settings';
import {RetailMedia,CategoryShowcase,RankedProducts,ProductSpotlight,FeaturedProduct} from './retail-sections';

function OptionalLink({href,children,...props}){return href?<StoreLink href={href} {...props}>{children}</StoreLink>:<div {...props}>{children}</div>;}
function Hero({section}){
  const settings=useStoreSettings();
  const items=section.items.filter(item=>item.image),[slide,setSlide]=useState(0);
  if(!items.length)return null;const current=items[slide%items.length];
  return <div className="craft-campaign"><OptionalLink href={current.href}><img src={current.image} alt={current.title} width="1400" height="513" fetchPriority="high"/></OptionalLink>{items.length>1&&<><div className={settings.theme==='craft'?'craft-slide-controls':'retail-slide-tabs'}>{items.map((item,index)=><button key={index} aria-label={item.title||`اسلاید ${(index+1).toLocaleString('fa-IR')}`} aria-pressed={index===slide%items.length} onClick={()=>setSlide(index)}>{settings.theme!=='craft'&&item.title}</button>)}</div><button className="craft-next" aria-label="بنر بعدی" onClick={()=>setSlide((slide+1)%items.length)}><Icon name="arrow"/></button></>}</div>;
}
function Products({section,products,error}){
  const [category,setCategory]=useState(''),[sort,setSort]=useState(section.sort),rail=useRef(null);
  const categories=catalogCategories(products);
  const selected=categories.find(item=>item.id===section.categoryId);
  let source=section.source==='manual'?section.productIds.map(id=>products.find(p=>p.id===id)).filter(Boolean):section.source==='category'?(selected?products.filter(p=>inCategory(p,selected)):[]):products;
  const filterNames=[...new Set(source.flatMap(p=>p.categories?.length?p.categories:[p.category]))];
  if(category)source=source.filter(p=>(p.categories||[p.category]).includes(category));
  const visible=filterProducts(source,{sort}).slice(0,section.limit);
  if(section.presentation==='ranked')return <div className="craft-shelf"><div className="craft-section-title"><h2>{section.title}</h2><StoreLink href="/shop">مشاهدهٔ همه</StoreLink></div>{error?<p role="alert">{error}</p>:<RankedProducts products={visible}/>}</div>;
  const moveRail=direction=>rail.current?.scrollBy({left:direction*rail.current.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  const shelf=<div className="craft-shelf"><div className="craft-section-title"><h2><Icon name="bag"/>{section.title||'محصولات'}</h2><StoreLink href={selected?`/category/${selected.id}`:'/shop'}>مشاهدهٔ همه <Icon name="arrow"/></StoreLink></div>{section.showFilters&&<div className="craft-tools"><div role="group" aria-label="فیلتر دسته‌بندی"><button aria-pressed={!category} onClick={()=>setCategory('')}>همه</button>{filterNames.map(name=><button key={name} aria-pressed={name===category} onClick={()=>setCategory(name)}>{name}</button>)}</div><select aria-label="مرتب‌سازی محصولات" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">جدیدترین‌ها</option><option value="cheap">ارزان‌ترین</option><option value="expensive">گران‌ترین</option></select></div>}{error?<p role="alert" className="form-error">{error}</p>:visible.length?<><div className="craft-rail-shell"><div ref={rail} className={`craft-products builder-grid${section.display==='carousel'?' builder-carousel':''}`}>{visible.map(product=><ProductCard product={product} key={product.id}/>)}</div>{section.display==='carousel'&&<div className="builder-rail-controls"><button aria-label={`محصولات قبلی ${section.title}`} onClick={()=>moveRail(1)}>→</button><button aria-label={`محصولات بعدی ${section.title}`} onClick={()=>moveRail(-1)}>←</button></div>}</div></>:<div className="craft-empty"><h3>محصولی برای این بخش پیدا نشد</h3><p>دسته‌بندی یا انتخاب‌های این بخش را بررسی کنید.</p>{category&&<button onClick={()=>setCategory('')}>برداشتن فیلتر</button>}</div>}</div>;
  if(section.presentation==='offers'&&section.image)return <div className="craft-poster-shelf"><StoreLink href={selected?`/category/${selected.id}`:'/shop'} className="craft-shelf-poster"><img src={section.image} alt={section.title} width="220" height="340" loading="lazy"/><span>مشاهدهٔ همه <Icon name="arrow"/></span></StoreLink>{shelf}</div>;
  if(section.featuredProduct&&visible.length&&!error)return <div className="craft-latest-pair">{shelf}<FeaturedProduct product={visible[0]}/></div>;
  return shelf;
}
export default function HomeSection({section,products,error,index}){
  const settings=useStoreSettings();
  if(!section.enabled)return null;
  let content;
  if(section.type==='hero')content=section.featuredProduct&&products.length?<div className={`builder-hero-pair image-${section.imageSide}`}><Hero section={section}/>{settings.theme==='craft'?<aside aria-label="محصول منتخب"><ProductCard product={products.find(p=>p.id===section.productIds[0])||products[0]}/></aside>:<FeaturedProduct product={products.find(p=>p.id===section.productIds[0])||products[0]}/>}</div>:<Hero section={section}/>;
  else if(section.type==='products')content=section.presentation==='spotlight'&&!error?<ProductSpotlight section={section} products={products}/>:<Products section={section} products={products} error={error}/>;
  else if(section.type==='banners'&&['stories','brands','editorial'].includes(section.presentation))content=<RetailMedia section={section}/>;
  else if(section.type==='categories'&&section.presentation==='showcase')content=<CategoryShowcase section={section} products={products}/>;
  else if(section.type==='banners')content=<div className="craft-tiles builder-grid">{section.items.filter(item=>item.image).map((item,i)=><OptionalLink key={i} href={item.href}><img src={item.image} alt={item.title} width="400" height="240" loading="lazy"/></OptionalLink>)}</div>;
  else if(section.type==='features')content=<div className="craft-benefits builder-grid">{section.items.map((item,i)=><OptionalLink key={i} href={item.href}><Icon name={item.icon}/><span><strong>{item.title}</strong><small>{item.body}</small></span></OptionalLink>)}</div>;
  else if(section.type==='categories'){
    const categories=catalogCategories(products).filter(category=>!section.categoryIds.length||section.categoryIds.includes(category.id));
    content=<><h2 className="builder-section-title">{section.title}</h2><div className="categories-grid builder-grid">{categories.map(category=><StoreLink className="category-card" key={category.id} href={`/category/${category.id}`}><div>{category.image?<img src={category.image} alt="" loading="lazy"/>:<Icon name="grid"/>}</div><h3>{category.name}</h3><span>{category.count.toLocaleString('fa-IR')} محصول</span></StoreLink>)}</div></>;
  }else if(section.type==='text-image')content=<div className={`builder-text-image image-${section.imageSide}${section.image?'':' no-image'}`}>{section.image&&<img src={section.image} alt={section.title} loading="lazy"/>}<div>{section.subtitle&&<span className="eyebrow">{section.subtitle}</span>}<h2>{section.title}</h2><p>{section.body}</p>{section.href&&section.buttonLabel&&<StoreLink className="secondary-button" href={section.href}>{section.buttonLabel}<Icon name="arrow"/></StoreLink>}</div></div>;
  else if(section.type==='faq')content=<div className="content-panel builder-faq"><h2>{section.title}</h2>{section.items.map((item,i)=><details key={i}><summary>{item.title}</summary><p>{item.body}</p></details>)}</div>;
  else content=<div className="builder-spacer" aria-hidden="true"/>;
  return <section className={`builder-section builder-${section.type} presentation-${section.presentation||'standard'} visibility-${section.visibility}`} aria-label={section.title||undefined} style={{'--section-columns':section.columns,'--section-mobile-columns':section.mobileColumns,'--section-gap':`${section.gap}px`,'--section-padding':`${section.padding}px`,marginTop:index===0?0:`${section.spacing}px`,backgroundColor:section.background||undefined}}>{content}</section>;
}
