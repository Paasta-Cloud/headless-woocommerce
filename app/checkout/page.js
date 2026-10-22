import CheckoutView from './view';
import {customerAccount} from '../../lib/customer-session';

export const metadata = { title: 'صورت‌حساب' };

export default async function CheckoutPage() {const account=await customerAccount();return <CheckoutView initialAddress={account?.billing||{}} />;}
