'use client';
import StoreLink from './store-link';
import {pagination} from '../../lib/pagination';
import './pagination.css';

const fa=value=>value.toLocaleString('fa-IR');
export default function Pagination({page,total,perPage=20,label='موارد',href,onPage,disabled=false}) {
  const model=pagination({page,total,perPage});
  if(!model.total)return null;
  function control(number,children,className,unavailable=false) {
    const destination=className==='list-pagination-previous'?'قبلی':className==='list-pagination-next'?'بعدی':fa(number);
    const props={className,'aria-label':`صفحهٔ ${destination} ${label}`};
    if(unavailable||disabled)return <button {...props} type="button" disabled>{children}</button>;
    return href?<StoreLink {...props} href={href(number)}>{children}</StoreLink>:<button {...props} type="button" onClick={()=>onPage(number)}>{children}</button>;
  }
  return <nav className="list-pagination" aria-label={`صفحه‌های ${label}`} aria-busy={disabled}>
    <p className="list-pagination-summary">{disabled?'در حال دریافت صفحه…':`نمایش ${fa(model.from)} تا ${fa(model.to)} از ${fa(model.total)}`}<span>صفحهٔ {fa(model.page)} از {fa(model.pages)}</span></p>
    {model.pages>1&&<div className="list-pagination-controls">
      {control(model.page-1,'قبلی','list-pagination-previous',model.page===1)}
      <div className="list-pagination-numbers">{model.numbers.map((number,index)=><span className="list-pagination-entry" key={number}>
        {index>0&&number>model.numbers[index-1]+1&&<span className="list-pagination-gap" aria-hidden="true">…</span>}
        {number===model.page?<span className="list-pagination-current" aria-current="page" aria-label={`صفحهٔ ${fa(number)} ${label}`}>{fa(number)}</span>:control(number,fa(number),'list-pagination-number')}
      </span>)}</div>
      {control(model.page+1,'بعدی','list-pagination-next',model.page===model.pages)}
    </div>}
  </nav>;
}
