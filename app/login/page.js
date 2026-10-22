import { redirect } from 'next/navigation';
import { customerAccount } from '../../lib/customer-session';
import LoginForm from './view';
import {nativeAuth} from '../../lib/native-auth';

export const metadata = { title: 'ورود' };
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (await customerAccount()) redirect('/account');
  return <LoginForm native={nativeAuth()}/>;
}
