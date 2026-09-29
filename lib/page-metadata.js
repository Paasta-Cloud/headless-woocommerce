import {getDesign} from './design-server';
export async function informationMetadata(key,fallback){
  const {design:{settings}}=await getDesign();
  const page=settings.pages?.[key];
  return {title:`${page?.enabled&&page.title?page.title:fallback} | ${settings.name}`,description:page?.enabled?page.intro:settings.description};
}
