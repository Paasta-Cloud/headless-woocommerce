// Child routes provide only their page title; the root supplies the merchant identity.
export function storeMetadata(settings){
  return {title:{default:settings.name,template:`%s | ${settings.name}`},description:settings.description,icons:settings.favicon?{icon:settings.favicon}:undefined};
}
