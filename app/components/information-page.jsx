'use client';
import {usePathname} from 'next/navigation';
import {useStoreSettings} from './store-settings';
import {Breadcrumbs} from './ui';
export default function InformationPage({title,intro,children}){
  const settings=useStoreSettings(),path=usePathname();
  const page=settings.pages?.[path?.startsWith('/preview/')?path.split('/')[2]:path?.split('/')[1]];
  const custom=page?.enabled;
  const heading=custom&&page.title?page.title:title;
  return <main className="shop-shell"><Breadcrumbs items={[{label:heading}]}/><div className="page-heading"><span className="eyebrow">همراه شما در {settings.name}</span><h1>{heading}</h1><p>{custom?page.intro:intro}</p></div><article className="content-panel">{custom?page.body.split(/\n\s*\n/).map((paragraph,index)=><p key={index} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{paragraph}</p>):children}</article></main>;
}
