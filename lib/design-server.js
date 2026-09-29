import {cache} from 'react';
import {cookies} from 'next/headers';
import {fetchDesign} from './design-fetch';
export const getDesign=cache(async()=>{
  const token=(await cookies()).get('paasta_design_preview')?.value;
  if(token){try{return {design:await fetchDesign(token),preview:true};}catch{return {design:await fetchDesign(),preview:false,expired:true};}}
  return {design:await fetchDesign(),preview:false};
});
