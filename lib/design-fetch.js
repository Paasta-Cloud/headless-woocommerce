import {storeOrigin} from './store.js';
import {defaultDesign,normalizeDesign} from './design.js';
import {publicRead} from './public-cache.js';

// Only published, public data is retained. Drafts never enter this fallback.
let lastPublished=null;
export async function fetchDesign(previewToken){
  const origin=storeOrigin();if(!origin){if(previewToken)throw Error('Preview unavailable');return defaultDesign;}
  if(previewToken&&!/^[a-f0-9]{64}$/.test(previewToken))throw Error('Invalid preview');
  try{
    const load=async()=>{
    const response=await fetch(`${origin}/wp-json/paasta-headless/v1/${previewToken?'preview/read':'design'}?_=${Date.now()}`,{
      method:previewToken?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(previewToken?15000:5000),redirect:'error',
      ...(previewToken?{headers:{'Content-Type':'application/json'},body:JSON.stringify({token:previewToken})}:{})
    });
    if(!response.ok)throw Error('Design unavailable');
    const data=await response.text();if(data.length>250000)throw Error('Design too large');
    const design=normalizeDesign(JSON.parse(data));
    return design;
    };
    const design=previewToken?await load():await publicRead(`design:${origin}`,load,10000);
    if(!previewToken)lastPublished={origin,design};
    return design;
  }catch(error){if(previewToken)throw error;return lastPublished?.origin===origin?lastPublished.design:defaultDesign;}
}
