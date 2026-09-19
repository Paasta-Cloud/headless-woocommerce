import { redirect } from 'next/navigation';
import { customerAccount } from '../../lib/account';
import LoginForm from './view';

export const metadata = { title: 'ورود | خانه‌چین' };
export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (await customerAccount()) redirect('/account');
  return <LoginForm />;
}
