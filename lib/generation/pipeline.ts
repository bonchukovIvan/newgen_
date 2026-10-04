import {db,json} from '@/lib/db';
import {Brief,Site,briefSchema,siteSchema,jobPayloadSchema,repairGeneratedLinks,assertInternalLinks} from '@/lib/validation/site';
import {starterSite} from '@/lib/templates/starter';
import {OpenAIProvider} from '@/lib/ai/openai';
import {lookupPlace} from '@/lib/google/places';
import {obtainImage} from '@/lib/images';
import {briefForPublication,enforceSite,protectFacts} from './facts';
import {isMock} from '@/lib/env';
import {pruneProjectAssets} from '@/lib/images/cleanup';
import {generateBusinessIdentity} from './identity';
import {readable} from '@/lib/templates/themes';
export const stages=['Reading business brief','Checking business information','Planning website strategy','Building sitemap','Creating design system','Composing pages','Writing page copy','Preparing image directions','Creating image library','Writing search metadata','Preparing structured data','Validating website','Saving website','Ready to preview'];
export async function runStage(projectId:string,stage:number,site:Site,brief:Brief,force=false):Promise<Site> {
 const ai=new OpenAIProvider(projectId);
 const publicBrief=briefForPublication(brief);
 switch(stage){
 case 0:return site;
 case 1:if(!brief.autoGenerate&&!isMock()&&process.env.GOOGLE_PLACES_API_KEY){try{const place=await lookupPlace(brief,projectId);if(place)site.warnings.push('Google Places match available. Review business data in Settings; independently confirm details before publishing.');}catch{site.warnings.push('Google Places unavailable. Using owner-supplied business information.');}}return site;
 case 2:return ai.planWebsite(site,publicBrief,force);
 case 3:return siteSchema.parse(site);
 case 4:return ai.generateDesign(site,brief,force);
 case 5:return site;
 case 6:{for(let i=0;i<site.pages.length;i++){const key='page:'+site.pages[i].id;const existing=await db.generationLog.findFirst({where:{jobId:activeJobId,stage,message:key}});if(existing)continue;site.pages[i]=await ai.generatePage(site,site.pages[i],publicBrief,force);await checkpoint(site);await db.generationLog.create({data:{jobId:activeJobId,stage,message:key}});}return site;}
 case 7:for(const page of site.pages)for(const s of page.sections)if(s.imageIntent)s.imageIntent=`${s.imageIntent}. ${brief.category} in ${brief.city}. ${readable(site.theme.background)==='#ffffff'?'Atmospheric dark':'Bright natural'} light.`.slice(0,1000);return site;
 case 8:{let imageCount=site.assets.length;for(const page of site.pages)for(const s of page.sections){if(!s.imageIntent||s.imageId)continue;if(brief.imageStrategy==='google'){const owned=site.assets.find(a=>a.provider==='upload'&&!site.pages.some(p=>p.sections.some(section=>section.imageId===a.id)))||site.assets.find(a=>a.provider==='upload');if(owned){s.imageId=owned.id;continue;}}if(imageCount>=4&&s.type!=='hero'){const existing=site.assets.find(a=>a.intent.includes(brief.category));if(existing)s.imageId=existing.id;continue;}if(imageCount>=6)continue;const result=await obtainImage({projectId,intent:s.imageIntent,query:`${brief.category} ${s.type==='hero'?'interior environment':s.title} commercial photography`,style:brief.style,orientation:'landscape',force},brief.imageStrategy);site.assets.push(result.asset);site.warnings.push(...result.warnings);s.imageId=result.asset.id;imageCount++;await checkpoint(site);}return site;}
 case 9:return ai.generateSEO(site,force);
 case 10:return enforceSite(site);
 case 11:{const parsed=siteSchema.parse(repairGeneratedLinks(site));assertInternalLinks(parsed);const titles=new Set(parsed.pages.map(p=>p.seo.title));if(titles.size!==parsed.pages.length)throw new Error('Pages must have unique SEO titles');return parsed;}
 default:return site;
 }
}
// Worker is intentionally single-concurrency per process. Multiple processes use DB leases.
let activeJobId='';let activeOwner='';
async function checkpoint(site:Site){const result=await db.generationJob.updateMany({where:{id:activeJobId,leaseOwner:activeOwner,status:'RUNNING'},data:{result:json(site)}});if(!result.count)throw new Error('Job lease lost');}
export async function processJob(jobId:string,owner:string) {
 activeJobId=jobId;activeOwner=owner;
 const job=await db.generationJob.findUniqueOrThrow({where:{id:jobId},include:{project:true}});
 let brief=briefSchema.parse(job.project.brief);const payload=jobPayloadSchema.parse(job.payload);
 try {
  let identityWarnings:string[]=[];
  if(payload.scope==='site'&&!job.result&&brief.autoGenerate&&brief.name==='New business website'){
   const generated=await generateBusinessIdentity(brief,job.projectId);brief=generated.brief;identityWarnings=generated.warnings;
   await db.project.update({where:{id:job.projectId},data:{name:brief.name,brief:json(brief)}});
  }
  let site=job.result?siteSchema.parse(job.result):payload.scope==='site'?starterSite(brief,job.project.version):siteSchema.parse(job.project.site);
  site.warnings.push(...identityWarnings);
  if(payload.scope==='site'&&job.project.site){const previous=siteSchema.parse(job.project.site);site.business=protectFacts(previous.business,site.business);site.domain=previous.domain;if(!job.result)site.assets=previous.assets.filter(asset=>asset.provider==='upload');}
  if(payload.scope==='site')for(let stage=job.stage;stage<stages.length;stage++){
   await db.generationJob.updateMany({where:{id:jobId,leaseOwner:owner},data:{stage,progress:Math.round(stage/stages.length*100)}});
   await db.generationLog.create({data:{jobId,stage,message:stages[stage]}});
   site=await runStage(job.projectId,stage,site,brief,payload.force);site.warnings=[...new Set(site.warnings)].slice(-100);await checkpoint(site);
   await db.generationJob.updateMany({where:{id:jobId,leaseOwner:owner},data:{stage:stage+1}});
  }else{
   const ai=new OpenAIProvider(job.projectId);const page=site.pages.find(p=>p.id===payload.pageId);const section=page?.sections.find(s=>s.id===payload.sectionId);
   if(payload.scope==='theme')site=await ai.generateDesign(site,brief,true);
   else if(payload.scope==='image'){
    const asset=site.assets.find(a=>a.id===payload.assetId);if(!asset)throw new Error('Image not found');
    const result=await obtainImage({projectId:job.projectId,intent:asset.intent,query:asset.prompt,style:brief.style,orientation:'landscape',force:true},brief.imageStrategy);
    site.assets.push(result.asset);site.warnings.push(...result.warnings);site.pages.forEach(p=>p.sections.forEach(s=>{if(s.imageId===asset.id)s.imageId=result.asset.id;for(const item of s.items)if(item.image===asset.id)item.image=result.asset.id;}));site.assets=site.assets.filter(a=>a.id!==asset.id);
   }else if(payload.scope==='page'){if(!page)throw new Error('Page not found');const replacement=await ai.generatePage(site,page,brief,true);site.pages=site.pages.map(p=>p.id===page.id?replacement:p);}
   else{if(!section||!page)throw new Error('Section not found');const result=await ai.generateSection(site,section,brief,true);const replacement=payload.scope==='headline'?{...section,title:result.title}:payload.scope==='paragraph'?{...section,body:result.body}:result;page.sections=page.sections.map(s=>s.id===section.id?replacement:s);}
   site=enforceSite(siteSchema.parse(repairGeneratedLinks(site)),siteSchema.parse(job.project.site));assertInternalLinks(site);
  }
  await db.$transaction(async tx=>{
   const lease=await tx.generationJob.updateMany({where:{id:jobId,leaseOwner:owner,status:'RUNNING'},data:{status:'COMPLETE',progress:100,stage:14,result:json(site),leaseUntil:null,error:null}});if(!lease.count)throw new Error('Job lease lost');
   if(job.project.site)await tx.revision.create({data:{projectId:job.projectId,site:job.project.site,label:`Before ${payload.scope} generation`}});
   const saved=await tx.project.updateMany({where:{id:job.projectId,version:job.project.version},data:{site:json(site),version:{increment:1},status:'READY'}});if(!saved.count)throw new Error('Project changed during generation; retry from the latest version');
  });
  await pruneProjectAssets(job.projectId).catch(error=>console.error('Asset cleanup failed',error));
 }catch(error){const message=error instanceof Error?error.message:'Generation failed';const failed=await db.generationJob.updateMany({where:{id:jobId,leaseOwner:owner,status:'RUNNING'},data:{status:'FAILED',error:message.slice(0,2000),leaseUntil:null}});if(failed.count)await db.project.update({where:{id:job.projectId},data:{status:job.project.site?'READY':'FAILED'}});}
}
