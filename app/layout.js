import './craft-store.css';
import './theme.css';
import './builder.css';
import './retail.css';
import './craft-detail.css';
import StoreShell from './components/store-shell';
import { customerAccount } from '../lib/customer-session';
import {getDesign} from '../lib/design-server';

export async function generateMetadata(){
  const {design:{settings:s}}=await getDesign();
  return {title:s.name,description:s.description,icons:s.favicon?{icon:s.favicon}:undefined};
}
export default async function Layout({ children }) {
  const mode = !process.env.WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL === 'demo' ? 'demo' : 'live';
  const [account,{design,preview}]=await Promise.all([customerAccount(),getDesign()]);
  const s=design.settings;
  return <html lang="fa" dir="rtl"><body>{s.font==='custom'&&s.fontUrl&&<style>{`@font-face{font-family:StoreCustom;src:url("${s.fontUrl}");font-display:swap}`}</style>}<StoreShell mode={mode} signedIn={Boolean(account)} settings={s} preview={preview}>{children}</StoreShell></body></html>;
}
