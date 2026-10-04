import { z } from 'zod';
import { sectionRegistry, sectionTypes } from '@/lib/templates/registry';
const text = z.string().max(6000);
export const safeLink = z.string().max(2048).refine(v => !/[\\\u0000-\u001f]/.test(v) && /^(\/(?!\/)|https:\/\/|mailto:|tel:|#)/.test(v), 'Use a relative path or HTTPS link');
export const factSchema = z.object({ value: z.string().max(3000), source: z.string().max(100), classification: z.enum(['VERIFIED','USER_PROVIDED','AI_GENERATED']) }).strict();
export const briefSchema = z.object({
  name: z.string().min(2).max(120), category: z.string().min(2).max(120), city: z.string().min(1).max(100), country: z.string().min(1).max(100),
  address: z.string().max(300).default(''), phone: z.string().max(50).default(''), email: z.union([z.email(),z.literal('')]).default(''),
  placeId: z.string().max(300).default(''), placeUrl: z.union([z.url(),z.literal('')]).default(''),
  autoGenerate: z.boolean().default(false), addressVerified: z.boolean().default(true), phoneVerified: z.boolean().default(true), emailVerified: z.boolean().default(true),
  description: text.default(''), services: z.array(z.string().min(1).max(120)).min(1).max(30),
  language: z.string().min(2).max(60).default('English'), size: z.enum(['Landing page','Small site','Standard','Large','Custom']).default('Standard'), pageCount: z.number().int().min(1).max(20).default(5),
  style: z.string().max(80).default('Modern Corporate'), tone: z.enum(['professional','friendly','premium','technical','bold','playful','luxury','minimal','authoritative']).default('professional'),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6d5dfc'), dark: z.boolean().default(false),
  imageStrategy: z.enum(['mixed','pexels','gpt-image-2','comfyui','google','manual']).default('mixed'), instructions: text.default(''),
  facts: z.record(z.string().max(80),z.string().max(3000)).default({}),
  testimonials: z.array(z.object({name:z.string().max(120),quote:text})).max(20).default([]),
  team: z.array(z.object({name:z.string().max(120),role:z.string().max(200)})).max(30).default([]),
  pricing: z.array(z.object({name:z.string().max(120),price:z.string().max(100),description:text})).max(30).default([]),
}).strict();
export const newProjectSchema=briefSchema.omit({name:true,city:true,address:true,placeId:true,placeUrl:true,description:true,services:true,tone:true,phone:true,email:true,style:true,primary:true,dark:true,imageStrategy:true,instructions:true,autoGenerate:true,addressVerified:true,phoneVerified:true,emailVerified:true});
export function effectivePageCount(size:z.infer<typeof briefSchema>['size'],pageCount:number):number{return size==='Landing page'?1:size==='Small site'?3:size==='Large'?Math.max(8,pageCount):pageCount;}
export const themeSchema = z.object({ primary:z.string().regex(/^#[0-9a-fA-F]{6}$/), secondary:z.string().regex(/^#[0-9a-fA-F]{6}$/), accent:z.string().regex(/^#[0-9a-fA-F]{6}$/), background:z.string().regex(/^#[0-9a-fA-F]{6}$/), foreground:z.string().regex(/^#[0-9a-fA-F]{6}$/), muted:z.string().regex(/^#[0-9a-fA-F]{6}$/), headingFont:z.enum(['sans','serif','mono']), bodyFont:z.enum(['sans','serif']), radius:z.enum(['none','small','medium','large']), density:z.enum(['compact','comfortable','spacious']), shadow:z.enum(['none','soft','bold']), buttonStyle:z.enum(['solid','outline','pill']), cardStyle:z.enum(['bordered','filled','plain']), scale:z.enum(['compact','balanced','dramatic']) }).strict();
export const itemSchema = z.object({ title:z.string().max(200), text, image:z.string().max(300).default(''), href:z.union([safeLink,z.literal('')]).default(''), factRef:z.string().max(100).default('') }).strict();
export const sectionSchema = z.object({ id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), type:z.enum(sectionTypes as [typeof sectionTypes[number],...typeof sectionTypes[number][]]), variant:z.string().refine(v=>!!sectionRegistry[v],'Unknown variant'), eyebrow:z.string().max(150), title:z.string().max(300), body:text, cta:z.string().max(80), href:z.union([safeLink,z.literal('')]), imageId:z.string().max(100), imageIntent:z.string().max(1000), items:z.array(itemSchema).max(30) }).strict().refine(s=>sectionRegistry[s.variant]?.type===s.type,'Variant must match section type');
export const seoSchema = z.object({ title:z.string().min(1).max(160), description:z.string().min(1).max(320), ogTitle:z.string().max(160), ogDescription:z.string().max(320) }).strict();
export const pageSchema = z.object({ id:z.string().max(100), slug:z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/), title:z.string().min(1).max(100), objective:z.string().max(400), seo:seoSchema, sections:z.array(sectionSchema).min(1).max(25) }).strict();
export const assetSchema = z.object({ id:z.string(), url:z.string().regex(/^\/media\/[a-zA-Z0-9-]+\.webp$/), provider:z.string(), alt:z.string().max(500), intent:z.string().max(1000), prompt:z.string().max(2000), attribution:z.string().max(500), sourceUrl:z.union([safeLink,z.literal('')]), width:z.number(), height:z.number() }).strict();
export const siteSchema = z.object({ schemaVersion:z.literal(1), language:z.string().max(60), business:z.object({name:z.string().max(120),category:z.string().max(120),city:z.string().max(100),country:z.string().max(100),facts:z.record(z.string(),factSchema)}).strict(), theme:themeSchema, navigation:z.enum(['inline','centered','split','stacked']), footer:z.enum(['columns','minimal','centered','split','editorial']), pages:z.array(pageSchema).min(1).max(20), assets:z.array(assetSchema).max(100), domain:z.union([z.url().refine(v=>v.startsWith('https://')||v.startsWith('http://localhost')),z.literal('')]), warnings:z.array(z.string().max(1000)).max(100) }).strict().superRefine((s,ctx)=>{
 if(s.pages[0]?.slug!=='/') ctx.addIssue({code:'custom',message:'First page must be the homepage'});
 if(new Set(s.pages.map(p=>p.slug)).size!==s.pages.length) ctx.addIssue({code:'custom',message:'Duplicate page URLs'});
 if(new Set(s.assets.map(a=>a.id)).size!==s.assets.length)ctx.addIssue({code:'custom',message:'Duplicate asset IDs'});
 const assetIds=new Set(s.assets.map(a=>a.id));
 for(const page of s.pages)for(const section of page.sections)for(const id of [section.imageId,...section.items.map(i=>i.image)])if(id&&!assetIds.has(id))ctx.addIssue({code:'custom',message:'Unknown image reference'});
 const ids=s.pages.flatMap(p=>p.sections.map(x=>x.id)); if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Section IDs must be unique'});
});
export function internalLinkErrors(site:Site):string[] {
 const pages=new Map(site.pages.map(page=>[page.slug,page]));
 const errors:string[]=[];
 for(const page of site.pages){
  const anchors=new Set(['main-content',...page.sections.map(section=>section.type==='contact'?'contact':section.type==='services'?'services':section.id)]);
  for(const section of page.sections)for(const href of [section.href,...section.items.map(item=>item.href)]){
   if(!href||(!href.startsWith('/')&&!href.startsWith('#')))continue;
   const [pathname,fragment]=href.split('#');
   const target=pathname?pages.get(pathname):page;
   if(!target){errors.push(`${page.title}: ${href} points to a missing page`);continue;}
   if(fragment){const targetAnchors=target===page?anchors:new Set(['main-content',...target.sections.map(s=>s.type==='contact'?'contact':s.type==='services'?'services':s.id)]);if(!targetAnchors.has(fragment))errors.push(`${page.title}: ${href} points to a missing section`);}
  }
 }
 return errors;
}
export class InternalLinkError extends Error {}
export function assertInternalLinks(site:Site):void {const errors=internalLinkErrors(site);if(errors.length)throw new InternalLinkError(errors.slice(0,5).join('; '));}
export function repairGeneratedLinks(site:Site):Site {
 const pages=new Map(site.pages.map(page=>[page.slug,page]));
 for(const page of site.pages){
  const repair=(href:string)=>{
   if(!href||(!href.startsWith('/')&&!href.startsWith('#')))return href;
   const [pathname,fragment]=href.split('#'),target=pathname?pages.get(pathname):page;
   if(!target)return pages.has('/contact')?'/contact':'/';
   const anchors=new Set(['main-content',...target.sections.map(s=>s.type==='contact'?'contact':s.type==='services'?'services':s.id)]);
   return fragment&&!anchors.has(fragment)?(pathname||'/'):href;
  };
  for(const section of page.sections){section.href=repair(section.href);for(const item of section.items)item.href=repair(item.href);}
 }
 return site;
}
export const contactSchema = z.object({name:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().max(50).default(''),message:z.string().trim().min(10).max(5000),website:z.string().max(200).default('')});
export const jobPayloadSchema=z.object({scope:z.enum(['site','page','section','headline','paragraph','image','theme']),pageId:z.string().optional(),sectionId:z.string().optional(),assetId:z.string().optional(),force:z.boolean().default(false)});
export type Brief=z.infer<typeof briefSchema>;
export type NewProjectInput=z.infer<typeof newProjectSchema>;
export type Site=z.infer<typeof siteSchema>;
export type Section=z.infer<typeof sectionSchema>;
export type SitePage=z.infer<typeof pageSchema>;
export type Asset=z.infer<typeof assetSchema>;
export type Theme=z.infer<typeof themeSchema>;
export type Fact=z.infer<typeof factSchema>;
export type JobPayload=z.infer<typeof jobPayloadSchema>;
