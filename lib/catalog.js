export function catalogCategories(products) {
  const names = [...new Set(products.flatMap(p => p.categories?.length ? p.categories : [p.category]))].sort();
  const result = new Map();
  for (const product of products) {
    const refs = product.categoryRefs?.length ? product.categoryRefs : [{id:names.indexOf(product.category)+1,name:product.category}];
    for (const category of refs) {
      if (!result.has(category.id)) result.set(category.id,{...category,count:0,image:product.image});
      result.get(category.id).count++;
    }
  }
  return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name,'fa'));
}
export function inCategory(product, category) {
  return product.categoryRefs?.length ? product.categoryRefs.some(c=>c.id===category.id) : product.category===category.name;
}
export function sectionProducts(products,section){
 const category=catalogCategories(products).find(c=>c.id===section.categoryId);
 const source=section.source==='manual'?section.productIds.map(id=>products.find(p=>p.id===id)).filter(Boolean):section.source==='category'?(category?products.filter(p=>inCategory(p,category)):[]):products;
 return filterProducts(source,{sort:section.sort}).slice(0,section.limit);
}
export function filterProducts(products,{query='',category=null,stock=false,min='',max='',sort='newest'}={}) {
  const normalize = text => String(text).replaceAll('ي','ی').replaceAll('ك','ک').trim().toLocaleLowerCase('fa');
  const result=products.filter(p=>(!query||normalize(`${p.name} ${(p.categories||[p.category]).join(' ')}`).includes(normalize(query)))&&(!category||inCategory(p,category))&&(!stock||(!p.outOfStock&&p.purchasable!==false))&&(min===''||p.price>=Number(min))&&(max===''||p.price<=Number(max)));
  return result.sort(sort==='cheap'?(a,b)=>a.price-b.price:sort==='expensive'?(a,b)=>b.price-a.price:(a,b)=>b.id-a.id);
}
