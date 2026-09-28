import VerifyView from './view';

export const metadata = { title: 'تأیید حساب | خانه‌چین' };
export default async function VerifyPage({ searchParams }) {
  const token = typeof (await searchParams).token === 'string' ? (await searchParams).token : '';
  return <VerifyView token={token} />;
}
