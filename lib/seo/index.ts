import type {Site,SitePage} from '@/lib/validation/site';
const languageNames:Record<string,string>={English:'en',French:'fr',German:'de',Spanish:'es',Italian:'it',Portuguese:'pt',Ukrainian:'uk',Polish:'pl',Dutch:'nl',Japanese:'ja',Arabic:'ar'};
const regionNames=new Intl.DisplayNames(['en'],{type:'region'});
const countryAliases:Record<string,string>={uk:'GB','united kingdom':'GB',usa:'US','u.s.':'US','u.s.a.':'US','united states of america':'US'};
const regions=new Map<string,string>();
for(let first=65;first<=90;first++)for(let second=65;second<=90;second++){
 const code=String.fromCharCode(first,second),name=regionNames.of(code);
 if(name&&name!==code)regions.set(name.toLowerCase(),code);
}
export function languageCode(language:string,country=''){
 const normalized=language.trim();
 const code=languageNames[normalized]||(/^[a-z]{2}(?:-[a-z]{2})?$/i.test(normalized)?normalized.replace(/^([a-z]{2})(?:-([a-z]{2}))?$/i,(_,lang:string,region:string|undefined)=>lang.toLowerCase()+(region?'-'+region.toUpperCase():'')):'und');
 const place=country.trim().toLowerCase();
 const region=countryAliases[place]||regions.get(place)||(/^[a-z]{2}$/i.test(place)&&regionNames.of(place.toUpperCase())!==place.toUpperCase()?place.toUpperCase():'');
 return region&&code!=='und'?code.split('-')[0]+'-'+region:code;
}
export function metadataFor(site:Site,page:SitePage,base:string) {const canonical=base.replace(/\/$/,'')+page.slug;const favicon=site.assets.find(asset=>asset.id===site.faviconId);return {title:page.seo.title,description:page.seo.description,alternates:{canonical},icons:favicon?{icon:[{url:favicon.url,type:'image/webp'}]}:undefined,openGraph:{title:page.seo.ogTitle||page.seo.title,description:page.seo.ogDescription||page.seo.description,url:canonical,type:'website' as const,siteName:site.business.name},twitter:{card:'summary_large_image' as const,title:page.seo.title,description:page.seo.description}};}
export function structuredData(site:Site,page:SitePage,base:string) {
 const facts=site.business.facts,verified=(key:string)=>facts[key]&&facts[key].classification!=='AI_GENERATED'?facts[key].value:undefined;
 const type=/restaurant/i.test(site.business.category)?'Restaurant':/medical|dentist/i.test(site.business.category)?'MedicalBusiness':/service/i.test(site.business.category)?'ProfessionalService':'LocalBusiness';
 const nodes:Record<string,unknown>[]=[{'@context':'https://schema.org','@type':type,'@id':base+'/#business',url:base,...(verified('name')?{name:verified('name')}:{}),...(verified('address')?{address:verified('address')}:{}),...(verified('phone')?{telephone:verified('phone')}:{}),...(verified('city')?{areaServed:verified('city')}:{})}];
 if(!verified('name'))nodes.length=0;
 const faqs=page.sections.filter(s=>s.type==='faq').flatMap(s=>s.items);if(faqs.length)nodes.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(x=>({'@type':'Question',name:x.title,acceptedAnswer:{'@type':'Answer',text:x.text}}))});
 nodes.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:base+'/'},...(page.slug==='/'?[]:[{'@type':'ListItem',position:2,name:page.title,item:base+page.slug}])]});return nodes;
}
export const safeJsonLd=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
export const xmlEscape=(s:string)=>s.replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]!));
export function sitemap(site:Site,base:string){return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site.pages.map(p=>`<url><loc>${xmlEscape(base.replace(/\/$/,'')+p.slug)}</loc></url>`).join('')}</urlset>`;}
