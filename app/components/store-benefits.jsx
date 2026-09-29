import StoreLink from './store-link';
import Icon from './icons';
export default function StoreBenefits({items=[]}){
  return items.length>0&&<section className="craft-benefits" aria-label="خدمات فروشگاه">{items.map((item,index)=>{
    const content=<><Icon name={item.icon}/><span><strong>{item.title}</strong><small>{item.body}</small></span></>;
    return item.href?<StoreLink href={item.href} key={index}>{content}</StoreLink>:<div key={index}>{content}</div>;
  })}</section>;
}
