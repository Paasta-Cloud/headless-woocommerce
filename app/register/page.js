import RegisterForm from './view';
import LoginForm from '../login/view';
import {nativeAuth} from '../../lib/native-auth';

export const metadata = { title: 'عضویت' };
export default function RegisterPage() {
  return nativeAuth()?<LoginForm native/>:<RegisterForm />;
}
