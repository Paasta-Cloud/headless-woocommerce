import {storeOrigin} from './store.js';
import {wordpressRestUrl} from './wordpress-rest.js';
export const MANAGER_COOKIE='paasta_manager_session';
export const MANAGER_ACTIONS=new Set(['login','session','logout','read','save','preview','history','restore','media','catalog','upload','commerce']);
export async function managerRequest(action,token,body){
  if(!MANAGER_ACTIONS.has(action))throw Error('Unsupported management action');
  const origin=storeOrigin();if(!origin)throw Error('Management requires WordPress');
  const multipart=typeof FormData!=='undefined'&&body instanceof FormData;
  const started=Date.now();let stage='headers';
  try{
  const response=await fetch(wordpressRestUrl(origin,`/paasta-headless/v1/manage/${action}`),{
    method:'POST',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000),
    headers:{...(!multipart?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},
    body:multipart?body:JSON.stringify(body||{}),
  });
  stage='body';
  return {status:response.status,data:await response.json()};
  }catch(error){
    // Do not log the token, request body, backend URL or customer data.
    console.error('management_backend_request_failed',{action,stage,elapsedMs:Date.now()-started,name:error.name,code:error.cause?.code});
    throw error;
  }
}
