'use client';

import { useState } from 'react';
import { useCart } from '../../use-cart';
import { useFavorites } from '../../use-favorites';

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

export default function ProductView({ product, mode, stock, variationError }) {
  const { cart, busy, error, addItem } = useCart(mode);
  const favorites = useFavorites();
  const [added, setAdded] = useState(false);
  const [selection, setSelection] = useState({});

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
  const canAdd = live && (variable ? Boolean(selected && info.inStock) : product.purchasable);
  const stateText = !live
    ? 'این نمونه در حالت نمایشی است؛ با اتصال ووکامرس، افزودن به سبد فعال می‌شود.'
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
    <nav className="shop-nav"><a href="/" className="shop-brand">خانه‌چین</a><div><a href="/">همهٔ کالاها</a><a href="/favorites">علاقه‌مندی‌ها</a><a href="/cart">سبد خرید ({Object.values(cart).reduce((a, b) => a + b, 0).toLocaleString('fa-IR')})</a><a href="/account">حساب</a></div></nav>
    <div className="breadcrumbs"><a href="/">فروشگاه</a><span> / </span><span>{product.category}</span><span> / </span><span>{product.name}</span></div>
    <section className="detail-grid"><div className={`detail-image ${product.tone}`}>{product.image ? <img src={product.image} alt={product.name}/> : <span>{product.label}</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p>{product.description.replace(/<[^>]*>/g, '') || 'اطلاعات تکمیلی این کالا در فروشگاه ووکامرس ثبت نشده است.'}</p>
      {variable && (product.options || []).map(option => <div className="variation-group" key={option.name}><span className="variation-label">{option.name}</span><div className="variation-options">{option.terms.map(term => {
        const enabled = termEnabled(option, term.slug);
        const active = selection[option.name] === term.slug;
        return <button key={term.slug} type="button" className={`option-chip${active ? ' active' : ''}`} disabled={!enabled} aria-pressed={active} onClick={() => pick(option.name, term.slug)}>{term.name}</button>;
      })}</div></div>)}
      {variable && product.outOfStock && <p className="form-error" role="alert">این کالا فعلاً ناموجود است.</p>}
      <div className="detail-price">{price}</div><p className="detail-state">{stateText}</p><div className="detail-actions"><button className="primary-action" type="button" disabled={busy || !canAdd} onClick={add}>{busy ? 'در حال افزودن…' : 'افزودن به سبد خرید'}</button><button className="secondary-button" type="button" aria-pressed={favorites.has(product.id)} onClick={() => favorites.toggle(product.id)}>{favorites.has(product.id) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}</button></div>{error && <p role="alert" className="form-error">{error}</p>}{added && !error && <p role="status" className="form-success">کالا به سبد اضافه شد. <a href="/cart">مشاهدهٔ سبد</a></p>}</div></section>
  </main>;
}
