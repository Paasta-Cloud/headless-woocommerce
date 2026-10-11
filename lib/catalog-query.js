const positive = (value,fallback=1) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value)>0 ? Number(value) : fallback;
export function catalogFilters(params={}) {
  const text=key=>typeof params[key]==='string'?params[key]:'';
  const amount=key=>/^\d{1,12}(?:\.\d{1,6})?$/.test(text(key))?text(key):'';
  const minor=Number(text('minor'));
  return {page:Math.min(100000,positive(params.page)),query:text('q').replaceAll('ي','ی').replaceAll('ك','ک').trim().slice(0,100),stock:params.stock==='1',min:amount('min'),max:amount('max'),sort:['cheap','expensive'].includes(params.sort)?params.sort:'newest',minorUnit:Number.isSafeInteger(minor)&&minor>=0&&minor<=6?minor:0};
}
export function catalogHref(path,filters,page=1) {
  const params=new URLSearchParams();
  if(filters.query)params.set('q',filters.query);
  if(filters.stock)params.set('stock','1');
  if(filters.min!=='')params.set('min',filters.min);
  if(filters.max!=='')params.set('max',filters.max);
  if(filters.sort!=='newest')params.set('sort',filters.sort);
  if(filters.minorUnit)params.set('minor',String(filters.minorUnit));
  if(page>1)params.set('page',String(page));
  return path+(params.size?`?${params}`:'');
}
