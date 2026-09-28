import ResetForm from './view';

export const metadata = { title: 'تعیین رمز تازه | خانه‌چین' };
export const dynamic = 'force-dynamic';
export default async function ResetPage({ searchParams }) {
  const params = await searchParams;
  const login = typeof params.login === 'string' ? params.login.slice(0, 254) : '';
  const key = typeof params.key === 'string' ? params.key.slice(0, 128) : '';
  return <ResetForm login={login} key0={key} />;
}
