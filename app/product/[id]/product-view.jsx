'use client';

import { useRef, useState } from 'react';
import { useCart } from '../../use-cart';
import { useFavorites } from '../../use-favorites';
import { Breadcrumbs } from '../../components/ui';
import ProductCard from '../../components/product-card';
import Icon from '../../components/icons';

// Every attribute pair must match the selection; empty values are "any"
// variations and act as wildcards.
function variationMatches(variation, selection, ignore) {
  return variation.attributes.every(attribute =>
    !attribute.value || attribute.name === ignore || selection[attribute.name] === attribute.value);
}

function variationFor(variations, selection) {
  return variations.find(variation => variation.attributes.every(attribute =>
    !attribute.value || selection[attribute.name] === attribute.value)) || null;
}

export default function ProductView({ product, mode, stock, variationError, related = [] }) {
  const { cart, busy, error, addItem } = useCart(mode);
  const favorites = useFavorites();
  const [added, setAdded] = useState(false);
  const [selection, setSelection] = useState({});

  const [imageIndex, setImageIndex] = useState(0), [tab, setTab] = useState('description');
  const zoom = useRef(null);
  const images = product.images?.length ? product.images : product.image ? [{src:product.image,alt:product.name}] : [];
  const category = product.categoryRefs?.[0];
  const description = product.description.replace(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ').replaceAll('&amp;', '&');
  const live = mode === 'live';
  const variable = product.type === 'variable';
  // Join the parent's variation attribute pairs with the stock and price
  // details fetched from the Store API variation query.
  const variations = variable && stock
    ? product.variations
      .map(variation => ({ ...variation, detail: stock.find(item => item.id === variation.id) || null }))
      .filter(variation => variation.detail)
    : [];

  const allSelected = variable && (product.options || []).every(option => selection[option.name]);
  const selected = allSelected ? variationFor(variations, selection) : null;
  const info = selected ? selected.detail : null;

  function pick(name, slug) {
    setAdded(false);
    setSelection(previous => {
      const next = { ...previous };
      if (next[name] === slug) delete next[name];
      else next[name] = slug;
      return next;
    });
  }

  // A term stays selectable when at least one variation offers it and matches
  // the selection made for all the other attributes.
  function termEnabled(option, slug) {
    return variations.some(variation =>
      variation.attributes.some(attribute => attribute.name === option.name && (!attribute.value || attribute.value === slug))
      && variationMatches(variation, selection, option.name));
  }

  const priceValue = info ? info.price : product.price;
  const priceUnit = info ? info.unit : product.unit;
  const price = new Intl.NumberFormat('fa-IR').format(priceValue) + ' ' + priceUnit;
  const canAdd = mode === 'demo' ? !variable : live && (variable ? Boolean(selected && info.inStock) : product.purchasable);
  const stateText = !live
    ? 'سبد این نسخه نمایشی است؛ سفارش و پرداخت واقعی انجام نمی‌شود.'
    : variable
      ? (!stock || variations.length === 0)
        ? (variationError || 'گزینه‌های این کالا در دسترس نیست. کمی بعد دوباره ببینید.')
        : selected
          ? (info.inStock ? 'قیمت و موجودی هنگام افزودن به سبد دوباره با ووکامرس بررسی می‌شود.' : 'این گزینه فعلاً ناموجود است.')
          : product.outOfStock ? 'این کالا فعلاً ناموجود است.' : 'گزینه‌های کالا را انتخاب کنید تا قیمت و موجودی دیده شود.'
      : product.outOfStock ? 'این کالا فعلاً ناموجود است.' : 'قیمت و موجودی هنگام افزودن به سبد دوباره با ووکامرس بررسی می‌شود.';

  async function add() {
    setAdded(false);
    const payload = variable && selected
      ? { id: selected.id, attributes: selected.attributes.filter(attribute => attribute.value).map(attribute => ({ name: attribute.name, value: attribute.value })) }
      : undefined;
    setAdded(await addItem(product.id, payload));
  }

  return <main className="shop-shell">
    <Breadcrumbs items={[{label:product.category,href:category?'/category/'+category.id:'/categories'},{label:product.name}]}/>
    <section className="detail-grid">
      <div className="detail-gallery"><button className="detail-image" aria-label="بزرگ‌نمایی تصویر محصول" disabled={!images.length} onClick={()=>zoom.current.showModal()}>{images.length?<img src={images[imageIndex].src} alt={product.name}/>:<span>{product.label}</span>}</button>{images.length>1&&<div className="gallery-thumbnails">{images.map((image,index)=><button key={image.src} aria-label={'تصویر '+(index+1).toLocaleString('fa-IR')} aria-pressed={imageIndex===index} onClick={()=>setImageIndex(index)}><img src={image.src} alt=""/></button>)}</div>}<dialog className="gallery-zoom" ref={zoom} aria-label="تصویر بزرگ محصول" onClick={e=>{if(e.target===e.currentTarget)zoom.current.close();}}><button onClick={()=>zoom.current.close()} aria-label="بستن تصویر"><Icon name="close"/></button>{images.length>0&&<img src={images[imageIndex].src} alt={product.name}/>}</dialog></div>
      <div className="detail-copy"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{description.slice(0,240)||'جزئیات و موجودی این محصول را پیش از خرید بررسی کنید.'}</p>
      {variable && (product.options || []).map(option => <div className="variation-group" key={option.name}><span className="variation-label">{option.name}</span><div className="variation-options">{option.terms.map(term => {
        const enabled = termEnabled(option, term.slug);
        const active = selection[option.name] === term.slug;
        return <button key={term.slug} type="button" className={`option-chip${active ? ' active' : ''}`} disabled={!enabled} aria-pressed={active} onClick={() => pick(option.name, term.slug)}>{term.name}</button>;
      })}</div></div>)}

      <div className="detail-meta"><span>شناسهٔ کالا: <bdi>{product.sku||product.id}</bdi></span><span>دسته‌بندی: <a href={category?'/category/'+category.id:'/categories'}>{product.category}</a></span><a href="/guide">راهنمای سفارش و دریافت کالا ←</a></div></div>
      <aside className="purchase-panel"><h2>خرید از خانه‌چین</h2><p className="fine-print">مبلغ و موجودی نهایی پیش از ثبت سفارش بررسی می‌شود.</p><div className="detail-price">{price}</div><p className="detail-state">{stateText}</p><div className="detail-actions"><button className="primary-action" type="button" disabled={busy || !canAdd} onClick={add}><Icon name="bag"/>{busy?'در حال افزودن…':product.outOfStock?'فعلاً ناموجود':'افزودن به سبد خرید'}</button><button className="secondary-button" type="button" aria-pressed={favorites.has(product.id)} onClick={()=>favorites.toggle(product.id)}><Icon name="heart"/>{favorites.has(product.id)?'حذف از علاقه‌مندی‌ها':'افزودن به علاقه‌مندی‌ها'}</button></div>{error&&<p role="alert" className="form-error">{error}</p>}{added&&!error&&<p role="status" className="form-success">کالا به سبد اضافه شد. <a href="/cart">مشاهدهٔ سبد</a></p>}</aside>
    </section>
    <section className="product-information"><div className="product-tabs" role="tablist" aria-label="اطلاعات محصول">{[['description','توضیحات'],['specs','مشخصات'],['delivery','دریافت سفارش']].map(([id,label])=><button key={id} id={'tab-'+id} role="tab" aria-selected={tab===id} aria-controls={'panel-'+id} tabIndex={tab===id?0:-1} onKeyDown={event=>{const ids=['description','specs','delivery'];if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=ids.indexOf(id);const next=event.key==='Home'?ids[0]:event.key==='End'?ids[2]:ids[(index+(event.key==='ArrowLeft'?1:2))%3];setTab(next);document.getElementById('tab-'+next)?.focus();}} onClick={()=>setTab(id)}>{label}</button>)}</div><div role="tabpanel" id={'panel-'+tab} aria-labelledby={'tab-'+tab}>{tab==='description'?<><h2>دربارهٔ {product.name}</h2><p>{description||'هنوز توضیحات بیشتری برای این محصول ثبت نشده است.'}</p></>:tab==='specs'?<table className="specifications"><tbody><tr><th scope="row">نام محصول</th><td>{product.name}</td></tr><tr><th scope="row">دسته‌بندی</th><td>{product.category}</td></tr>{(product.specifications||[]).map((item,index)=><tr key={index}><th scope="row">{item.name}</th><td>{item.value}</td></tr>)}</tbody></table>:<><h2>پیش از ثبت سفارش</h2><p>روش‌های دریافت فعال و هزینهٔ آن‌ها در صفحهٔ صورت‌حساب نمایش داده می‌شوند. پرداخت تنها پس از تأیید سمت سرور معتبر است.</p><a className="secondary-button" href="/guide">راهنمای کامل خرید</a></>}</div></section>
    {related.length>0&&<section className="craft-shelf"><div className="craft-section-title"><h2>محصولات مرتبط</h2><a href={category?'/category/'+category.id:'/shop'}>مشاهدهٔ همه ←</a></div><div className="craft-products related-products">{related.map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}
  </main>;
}
