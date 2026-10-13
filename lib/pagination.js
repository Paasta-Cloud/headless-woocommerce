// Bounded navigation: never build an array proportional to the catalogue size.
export function pagination({page=1,total=0,perPage=20}={}) {
  const size=Number.isSafeInteger(perPage)&&perPage>0?perPage:20;
  const count=Number.isSafeInteger(total)&&total>0?total:0;
  const pages=Math.max(1,Math.ceil(count/size));
  const current=Math.min(pages,Math.max(1,Number.isSafeInteger(page)?page:1));
  const start=Math.max(2,Math.min(current-1,pages-3));
  const numbers=[...new Set([1,...Array.from({length:3},(_,i)=>start+i).filter(n=>n<pages),pages])].sort((a,b)=>a-b);
  return {page:current,pages,total:count,from:count?(current-1)*size+1:0,to:Math.min(current*size,count),numbers};
}
