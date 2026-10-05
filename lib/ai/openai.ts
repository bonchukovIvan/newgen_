import OpenAI from 'openai';
import {zodTextFormat} from 'openai/helpers/zod';
import {z} from 'zod';
import {isMock} from '@/lib/env';
import {cached,cacheKey} from '@/lib/cache';
import {track} from '@/lib/usage';
import {prompts,PROMPT_VERSION} from './prompts';
import {pageSchema,sectionSchema,seoSchema,themeSchema,Site,SitePage,Section,Brief} from '@/lib/validation/site';
import {sectionRegistry,SectionType,resolveVariant} from '@/lib/templates/registry';
import {newSection,supplementalSection,SupplementalType} from '@/lib/templates/starter';
import {briefForPublication,checkGeneratedCopy} from '@/lib/generation/facts';
import {createTheme,ensureContrast,contrast,readable} from '@/lib/templates/themes';
import {isRequiredPageSlug} from '@/lib/generation/required-pages';
import {assertWritingQuality,pageCopy,sectionCopy} from './writing-quality';
import {validateH1,validateSearchMetadata} from './seo-rules';
export interface AIProvider {generatePage(site:Site,page:SitePage,brief:Brief,force?:boolean):Promise<SitePage>;generateSection(site:Site,section:Section,brief:Brief,force?:boolean):Promise<Section>;}
export class OpenAIProvider implements AIProvider {
 constructor(private projectId:string){}
 async structured<T>(schema:z.ZodType<T>,prompt:string,context:unknown,force=false,validate?:(value:T)=>void):Promise<T> {
  const key=cacheKey('ai:'+PROMPT_VERSION,{project:this.projectId,model:process.env.OPENAI_TEXT_MODEL,prompt,context});
  return cached(key,86400,async()=>{
   const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:90000,maxRetries:2});let feedback='';
   for(let attempt=0;attempt<3;attempt++) {
    try {
     const response=await client.responses.parse({model:process.env.OPENAI_TEXT_MODEL!,input:[{role:'system',content:prompt+(feedback?'\n'+prompts.repair+'\n'+feedback:'')},{role:'user',content:JSON.stringify(context)}],text:{format:zodTextFormat(schema,'website_output')},max_output_tokens:14000});
     await track(this.projectId,'openai-text','structured',response.usage?.input_tokens||0,response.usage?.output_tokens||0);
     if(!response.output_parsed)throw new Error('The model did not return usable structured content');const parsed=schema.parse(response.output_parsed);validate?.(parsed);return parsed;
    }catch(error){feedback=error instanceof Error?error.message:'Invalid structured output';if(attempt===2)throw new Error(`AI output could not be validated after three attempts: ${feedback.slice(0,250)}`);}
   }throw new Error('AI generation failed');
  },force);
 }
 async generateDesign(site:Site,brief:Brief,force=false):Promise<Site> {
  if(isMock())return site;
  const schema=z.object({theme:themeSchema,navigation:z.enum(['inline','centered','split','stacked']),footer:z.enum(['columns','minimal','centered','split','editorial'])});
  const palette=createTheme(brief.style,brief.dark,brief.primary);
  const design=await this.structured(schema,prompts.design,{businessName:brief.name,category:brief.category,tone:brief.tone,style:brief.style,dark:brief.dark,primary:brief.primary,startingTheme:site.theme,language:brief.language,country:brief.country,services:brief.services,description:brief.description,instructions:brief.instructions,pages:site.pages.filter(page=>!isRequiredPageSlug(page.slug)).map(page=>({title:page.title,sections:page.sections.map(section=>({type:section.type,variant:section.variant,itemCount:section.items.length}))}))},force);
  const background=readable(design.theme.background)===(brief.dark?'#ffffff':'#101118')?design.theme.background:palette.background;
  let theme=ensureContrast({...design.theme,primary:brief.primary,background});
  if(contrast(theme.secondary,theme.foreground)<4.5)theme={...theme,secondary:palette.secondary};
  return {...site,theme,navigation:design.navigation,footer:design.footer};
 }
 async planWebsite(site:Site,brief:Brief,force=false) {
  if(isMock())return site;
  const businessPages=site.pages.filter(page=>!isRequiredPageSlug(page.slug));
  const requiredPages=site.pages.filter(page=>isRequiredPageSlug(page.slug));
  const allowed=Object.keys(sectionRegistry).filter(id=>!['navigation','footer'].includes(sectionRegistry[id].type));
  const schema=z.object({strategy:z.string().max(1000),pages:z.array(z.object({title:z.string().max(100),slug:z.string(),objective:z.string().max(400),variants:z.array(z.enum(allowed as [string,...string[]])).min(1).max(15)})).min(1).max(20)});
  const validate=(plan:z.infer<typeof schema>)=>{
   assertWritingQuality([plan.strategy,...plan.pages.flatMap(page=>[page.title,page.objective])],businessPages.flatMap(page=>[page.title,page.objective]));
   if(plan.pages.length!==businessPages.length||plan.pages[0].slug!=='/'||new Set(plan.pages.map(p=>p.slug)).size!==plan.pages.length||plan.pages.some(p=>isRequiredPageSlug(p.slug)||!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(p.slug))||plan.pages.some(p=>!businessPages.some(original=>original.slug===p.slug)))throw new Error('Preserve the requested page routes, beginning with / and excluding the required pages.');
   if(plan.pages.length>1&&!plan.pages.some(p=>p.slug==='/contact'))throw new Error('Multi-page sites require a /contact page.');
   if(plan.pages.length===1&&!plan.pages[0].variants.some(v=>v.startsWith('contact-')))throw new Error('Landing pages need a contact section.');
   const requiredType=brief.websiteType==='blog'?'blog':'pricing';
   if(!plan.pages.some(p=>p.variants.some(v=>v.startsWith(requiredType+'-'))))throw new Error(`Include a ${requiredType} section for this website type.`);
   if(brief.websiteType==='business'&&!plan.pages[0].variants.some(v=>v.startsWith('pricing-')))throw new Error('Include the suggested pricing section on the homepage.');
   if(plan.pages.some(p=>p.variants.filter(v=>v.startsWith('blog-')).length>1))throw new Error('Use one articles section per page.');
   if(brief.websiteType==='blog'&&businessPages.length<=2&&!plan.pages[0].variants.some(v=>v.startsWith('blog-')))throw new Error('Keep the articles section on the homepage.');
   for(const [slug,type] of [['/blog','blog'],['/pricing','pricing']])if(businessPages.some(p=>p.slug===slug)&&!plan.pages.find(p=>p.slug===slug)?.variants.some(v=>v.startsWith(type+'-')))throw new Error(`Keep the ${type} section on ${slug}.`);
   for(const page of plan.pages)for(const variant of page.variants){const type=resolveVariant(variant).type;if(['testimonials','pricing','team','trustStats','logos'].includes(type)&&!businessPages.some(p=>p.sections.some(s=>s.type===type)))throw new Error(`No supplied evidence is available for ${type}. Omit it.`);}
  };
  const plan=await this.structured(schema,prompts.planner,{brief:briefForPublication(brief),facts:site.business,requestedPageCount:businessPages.length,approvedComponents:allowed,requirements:`Include a contact form and preserve a /contact route for multiple pages. Keep the ${brief.websiteType==='blog'?'blog section and /blog route when present':'suggested pricing section on the homepage and /pricing route when present'}; keep article pages and their routes when present. Select diverse compatible layouts. Preserve proposed prices exactly as supplied and label them as suggestions. Do not add other evidence-only sections without supplied facts. Privacy Policy, GDPR Policy, Cookie Policy and Business Model are added separately; do not plan them.`,sitemap:businessPages.map(p=>({title:p.title,slug:p.slug,objective:p.objective,variants:p.sections.map(s=>s.variant)}))},force,validate);
  const templates=businessPages.flatMap(p=>p.sections),slugs=new Set([...plan.pages.map(p=>p.slug),...requiredPages.map(p=>p.slug)]);
  const result={...site,pages:plan.pages.map((p,i)=>{
   const original=businessPages.find(x=>x.slug===p.slug)||businessPages[i];
   const sections=p.variants.map(variant=>{const type=resolveVariant(variant).type as SectionType;const supplemental=['audience','useCases','highlights','comparison'].includes(type);const template=original.sections.find(s=>s.type===type)||templates.find(s=>s.type===type)||(supplemental?supplementalSection(type as SupplementalType,brief):newSection(type));return {...structuredClone(template),id:p.slug==='/'&&type==='blog'?'blog-0':crypto.randomUUID(),type,variant};});
   if(p.slug==='/contact'&&!sections.some(s=>s.type==='contact'))sections.push({...newSection('contact'),title:'Get in touch'});
   return {...original,id:original.id,slug:p.slug,title:p.title,objective:p.objective,sections};
  }).concat(requiredPages)};
  for(const page of result.pages)for(const section of page.sections){for(const item of [section,...section.items])if(item.href.startsWith('/')&&!slugs.has(item.href))item.href=businessPages.length===1?'#contact':'/contact';}
  return result;
 }
 async generateRequiredPage(site:Site,page:SitePage,brief:Brief,force=false):Promise<SitePage> {
  if(isMock())return page;
  const original=page.sections[0];
  const schema=z.object({h1:z.string().min(1).max(300),intro:z.string().max(1000),items:z.array(z.object({title:z.string().min(1).max(300),text:z.string().min(1).max(3000)})).min(original.items.length).max(original.items.length),seo:seoSchema});
  const draft=await this.structured(schema,prompts.requiredPage,{page:{title:page.title,slug:page.slug,topics:original.items.map(item=>({title:item.title,text:item.text}))},business:{name:site.business.name,category:site.business.category,city:site.business.city,country:site.business.country},brief:{language:brief.language,services:brief.services,description:brief.description,proposedPrices:page.slug==='/business-model'?brief.pricing:[]},verifiedWebsiteBehavior:{contactFormFields:['name','email','optional phone','message'],submissionStorage:'Node.js and PHP packages store contact submissions server-side. Static HTML has no included contact-form backend; an external form service must be configured.',optionalWebhook:'The Node.js package can optionally send submissions to a configured webhook.',defaultExportCookies:'The included export code does not set cookies. The cookie notice saves its dismissal in browser local storage, scoped to this generated site.',defaultExportTracking:'No analytics or advertising scripts are included by default.'}},force,value=>{
   if(value.items.length!==original.items.length)throw new Error('Preserve every required policy topic');
   if(page.slug==='/business-model'&&brief.pricing.length){const revenue=value.items[original.items.length-1]?.text||'';for(const proposal of brief.pricing)if(!revenue.includes(proposal.name)||!revenue.includes(proposal.price))throw new Error('Business Model must include every proposed price and amount');}
   validateSearchMetadata({...page,seo:value.seo,sections:[{...original,title:value.h1}]},site.business.name);
   assertWritingQuality([value.h1,value.intro,...value.items.flatMap(item=>[item.title,item.text]),...Object.values(value.seo)],pageCopy(page));
   const check={...original,body:value.intro,items:value.items.map(item=>({...item,image:'',href:'',factRef:''}))};checkGeneratedCopy(check,site.business);
  });
  const section={...original,title:draft.h1,body:[original.body,draft.intro].filter(Boolean).join('\n\n'),items:draft.items.map((item,index)=>({...page.slug==='/cookie-policy'&&index===1&&brief.language.toLowerCase()==='english'?original.items[index]:item,image:'',href:'',factRef:''}))};
  checkGeneratedCopy(section,site.business);
  return {...page,seo:draft.seo,sections:[section]};
 }
 async generatePage(site:Site,page:SitePage,brief:Brief,force=false):Promise<SitePage> {
  if(isRequiredPageSlug(page.slug))return this.generateRequiredPage(site,page,brief,force);
  if(isMock())return page;
  const candidate=await this.structured(pageSchema,prompts.writer,{business:site.business,brief:briefForPublication(brief),page,sitemap:site.pages.map(p=>p.slug)},force,candidate=>{if(candidate.sections.length!==page.sections.length)throw new Error('Preserve the section count');validateH1(candidate.sections[0].title,site.business.name);candidate.sections.forEach(s=>checkGeneratedCopy(s,site.business));assertWritingQuality(pageCopy(candidate),pageCopy(page));});
  if(candidate.sections.length!==page.sections.length)throw new Error('Writer changed the section structure');
  const result={...candidate,id:page.id,slug:page.slug,title:page.title,sections:candidate.sections.map((s,i)=>({...s,id:page.sections[i].id,type:page.sections[i].type,variant:page.sections[i].variant,eyebrow:page.sections[i].type==='hero'?'':s.eyebrow,imageId:page.sections[i].imageId,items:['team','testimonials','pricing','trustStats','logos','blog'].includes(page.sections[i].type)?page.sections[i].items:s.items.map((item,j)=>({...item,image:page.sections[i].items[j]?.image||''}))}))};
  result.sections.forEach(s=>checkGeneratedCopy(s,site.business));return result;
 }
 async generateSection(site:Site,section:Section,brief:Brief,force=false):Promise<Section> {
  const requiredPage=site.pages.find(page=>isRequiredPageSlug(page.slug)&&page.sections.some(s=>s.id===section.id));
  if(requiredPage)return (await this.generateRequiredPage(site,requiredPage,brief,force)).sections.find(s=>s.id===section.id)!;
  if(isMock())return {...section,title:section.title.endsWith(' — made for you')?section.title.replace(' — made for you',''):section.title+' — made for you',body:section.body+' Tell us what you have in mind.'};
  const publicBrief=briefForPublication(brief);
  const firstSection=site.pages.some(page=>page.sections[0]?.id===section.id);
  const candidate=await this.structured(sectionSchema,firstSection?`${prompts.section} If this is the first section, its title is the page H1: keep it 40–60 characters, include a relevant target keyword, and omit the business name.`:prompts.section,{business:site.business,brief:publicBrief,section,sitemap:site.pages.map(p=>p.slug)},force,s=>{if(firstSection)validateH1(s.title,site.business.name);checkGeneratedCopy(s,site.business);assertWritingQuality(sectionCopy(s),sectionCopy(section));});
  const result={...candidate,id:section.id,type:section.type,variant:section.variant,eyebrow:section.type==='hero'?'':candidate.eyebrow,imageId:section.imageId,items:['team','testimonials','pricing','trustStats','logos','blog'].includes(section.type)?section.items:candidate.items.map((item,i)=>({...item,image:section.items[i]?.image||''}))};checkGeneratedCopy(result,site.business);return result;
 }
 async generateSEO(site:Site,force=false):Promise<Site> {
  if(isMock())return site;
  const mainPages=site.pages.filter(p=>!isRequiredPageSlug(p.slug));
  const result=await this.structured(z.object({pages:z.array(z.object({id:z.string(),seo:seoSchema}))}),prompts.seo,{business:site.business,language:site.language,pages:mainPages.map(p=>({id:p.id,title:p.title,sections:p.sections.map(s=>({title:s.title,body:s.body}))}))},force,value=>{if(value.pages.length!==mainPages.length||new Set(value.pages.map(entry=>entry.id)).size!==mainPages.length)throw new Error('Return SEO fields for every main page exactly once.');for(const entry of value.pages){const page=mainPages.find(page=>page.id===entry.id);if(!page)throw new Error('Unknown page ID in SEO output.');validateSearchMetadata({...page,seo:entry.seo},site.business.name);assertWritingQuality(Object.values(entry.seo),Object.values(page.seo));}});
  return {...site,pages:site.pages.map(p=>({...p,seo:result.pages.find(x=>x.id===p.id)?.seo||p.seo}))};
 }
}
