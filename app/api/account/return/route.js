import {SESSION_COOKIE} from '../../../../lib/account';
import {customerReturnAction} from '../../../../lib/customer-return';
export async function POST(request){return customerReturnAction(request,request.cookies.get(SESSION_COOKIE)?.value);}
