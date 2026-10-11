import {getProducts,getCategories} from '../../../lib/store';
export async function GET(request){
  const include=new URL(request.url).searchParams.get('include');
  if(include!==null){
    if(!/^[1-9]\d*(?:,[1-9]\d*){0,99}$/.test(include))return Response.json({error:'انتخاب محصولات معتبر نیست.'},{status:400});
    const result=await getProducts({include:include.split(',').map(Number),perPage:100});
    return Response.json(result.error?{error:result.error}:{products:result.products},{status:result.error?503:200,headers:{'Cache-Control':'no-store'}});
  }
  const result=await getCategories();return Response.json(result,{status:result.error?503:200,headers:{'Cache-Control':'no-store'}});
}
