import {getProducts} from '../../../lib/store';
import {catalogCategories} from '../../../lib/catalog';
export async function GET(){const {products,error}=await getProducts();return Response.json(error?{error}:{categories:catalogCategories(products)},{status:error?503:200,headers:{'Cache-Control':'no-store'}});}
