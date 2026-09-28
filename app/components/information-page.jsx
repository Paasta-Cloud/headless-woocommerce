import {Breadcrumbs} from './ui';
export default function InformationPage({title,intro,children}){return <main className="shop-shell"><Breadcrumbs items={[{label:title}]}/><div className="page-heading"><span className="eyebrow">همراه شما در خانه‌چین</span><h1>{title}</h1><p>{intro}</p></div><article className="content-panel">{children}</article></main>;}
