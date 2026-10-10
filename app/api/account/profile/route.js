import { SESSION_COOKIE } from '../../../../lib/account';
import { profileAction } from '../../../../lib/customer-profile';

export async function POST(request) {
  return profileAction(request, request.cookies.get(SESSION_COOKIE)?.value);
}
