export const contentResources=new Set(['posts','pages']);
export const contentStatuses={draft:'پیش‌نویس',publish:'منتشرشده',pending:'در انتظار بررسی',private:'خصوصی',future:'زمان‌بندی‌شده'};
export function contentDraft(item,resource='posts'){
 const draft={title:item.title||'',slug:item.slug||'',status:item.status||'draft',...(resource==='posts'?{excerpt:item.excerpt||''}:{}),featured_media:item.featured_media||0};
 if(item.editable!==false)draft.blocks=structuredClone(item.blocks||[]);
 return draft;
}
export function contentHref(resource,slug){return `${resource==='pages'?'/pages':'/blog'}/${encodeURIComponent(slug)}`;}
export function moveContentBlock(items,index,delta){const next=[...items],target=index+delta;if(target<0||target>=items.length)return next;[next[index],next[target]]=[next[target],next[index]];return next;}
