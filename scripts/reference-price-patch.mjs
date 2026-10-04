// Emits a reviewable patch, never changes a live store or imports products.
import {readFileSync} from 'node:fs';
const patches=[];
for(const theme of ['digital','grocery']){
 const path=`lib/demo-${theme}.json`,before=readFileSync(path,'utf8'),snapshot=JSON.parse(before);
 const response=await fetch(`${snapshot.source}wp-json/wc/store/v1/products?per_page=100`,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`Reference ${theme}: ${response.status}`);
 const catalog=await response.json();
 for(const product of snapshot.products){
  const original=catalog.find(item=>item.images?.some(image=>image.src===product.image));
  if(!original)throw Error(`Reference image no longer matches ${theme}/${product.id}`);
  product.regularPrice=Number(original.prices.regular_price)/10**Number(original.prices.currency_minor_unit||0);
  product.price=Number(original.prices.price)/10**Number(original.prices.currency_minor_unit||0);
 }
 const after=JSON.stringify(snapshot,null,2)+'\n';
 patches.push(`*** Update File: ${path}\n@@\n${before.trimEnd().split(/\r?\n/).map(l=>'-'+l).join('\n')}\n${after.trimEnd().split('\n').map(l=>'+'+l).join('\n')}`);
}
process.stdout.write(`*** Begin Patch\n${patches.join('\n')}\n*** End Patch\n`);
