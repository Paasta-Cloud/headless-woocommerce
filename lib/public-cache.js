// Process-local, bounded and tenant-keyed. Never use for sessions, carts,
// orders, authenticated calls or draft previews. No stale-on-error inventory.
export function createPublicCache({max=128,now=Date.now}={}) {
 const values=new Map();
 return async function read(key,load,ttl=15000){
  const hit=values.get(key);
  if(hit&&(hit.pending||hit.expires>now()))return structuredClone(await hit.promise);
  if(values.size>=max)values.delete(values.keys().next().value);
  const entry={pending:true,expires:0};
  entry.promise=Promise.resolve().then(load).then(value=>{entry.pending=false;entry.expires=now()+ttl;return value;}).catch(error=>{if(values.get(key)===entry)values.delete(key);throw error;});
  values.set(key,entry);
  return structuredClone(await entry.promise);
 };
}
export const publicRead=createPublicCache();
