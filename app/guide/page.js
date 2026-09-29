import InformationPage from '../components/information-page';
import { shoppingGuide, storefrontConfig } from '../../lib/storefront-config';

import {informationMetadata} from '../../lib/page-metadata';
export const generateMetadata=()=>informationMetadata('guide','راهنمای خرید');

export default function GuidePage() {
  return <InformationPage title="راهنمای خرید" intro="اطلاعات لازم برای یک خرید آزمایشی روشن و قابل‌پیگیری.">
    <section className="guide-layout"><div className="guide-content">{shoppingGuide.map(item => <article key={item.title}><h2>{item.title}</h2><p>{item.body}</p></article>)}</div><aside><strong>محل تحویل حضوری</strong><p>{storefrontConfig.pickupAddress}</p><small>نشانی و روش دریافت نهایی را پیش از فروش عمومی با اطلاعات واقعی فروشگاه جایگزین کنید.</small></aside></section>
  </InformationPage>;
}
