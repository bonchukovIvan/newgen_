import {db,json} from '@/lib/db';
import {Brief,JobPayload,Site,briefSchema,siteSchema,assertInternalLinks} from '@/lib/validation/site';
import {HttpError} from '@/lib/http';
import {businessFromBrief,enforceSite} from '@/lib/generation/facts';
import {ensureContrast,createTheme} from '@/lib/templates/themes';
import {revenueModelText} from '@/lib/generation/required-pages';
import {suggestedBusinessEmail,siteOrigin} from '@/lib/generation/domain';
export async function createProject(userId:string,brief:Brief) {return db.project.create({data:{userId,name:brief.name,brief:json(brief),status:'QUEUED',jobs:{create:{payload:json({scope:'site',force:false})}}}});}
export async function queueJob(projectId:string,payload:JobPayload) {return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id"=${projectId} FOR UPDATE`;
 if(await tx.generationJob.count({where:{projectId,status:{in:['QUEUED','RUNNING']}}}))throw new HttpError(409,'A generation is already running');
 const p=await tx.project.findUniqueOrThrow({where:{id:projectId}});if(payload.scope!=='site'&&!p.site)throw new HttpError(400,'Generate the website first');
 await tx.project.update({where:{id:projectId},data:{status:'GENERATING'}});return tx.generationJob.create({data:{projectId,payload:json(payload)}});
 });}
export async function saveSite(projectId:string,site:Site,version:number) {return db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id"=${projectId} FOR UPDATE`;
 const project=await tx.project.findUniqueOrThrow({where:{id:projectId}});
 if(await tx.generationJob.count({where:{projectId,status:{in:['QUEUED','RUNNING']}}}))throw new HttpError(409,'Wait for generation to finish before editing');
 const current=project.site?siteSchema.parse(project.site):undefined;
 const safe=enforceSite(siteSchema.parse(site),current);safe.theme=ensureContrast(safe.theme);safe.domain=siteOrigin(safe.domain);
 const brief=briefSchema.parse(project.brief);
 const previousEmail=suggestedBusinessEmail(brief.name,current?.domain||'');
 const nextEmail=suggestedBusinessEmail(brief.name,safe.domain);
 const updateDraftEmail=!!safe.domain&&!brief.emailVerified&&!!nextEmail&&(brief.email===previousEmail||brief.email===''||/\.example$/i.test(brief.email))&&brief.email!==nextEmail;
 const nextBrief=updateDraftEmail?briefSchema.parse({...brief,email:nextEmail}):brief;
 if(updateDraftEmail&&safe.business.facts.email?.classification==='AI_GENERATED')safe.business.facts.email={...safe.business.facts.email,value:nextEmail,source:'Draft suggested mailbox'};
 assertInternalLinks(safe);
 const owned=await tx.asset.findMany({where:{projectId},select:{url:true}});const urls=new Set(owned.map(a=>a.url));if(safe.assets.some(a=>!urls.has(a.url)))throw new HttpError(400,'Only images from this project can be used');
 if(project.version!==version)throw new HttpError(409,'This project changed in another window. Reload before editing.');
 if(project.site)await tx.revision.create({data:{projectId,site:project.site,label:'Before edit'}});
 return tx.project.update({where:{id:projectId},data:{site:json(safe),...(updateDraftEmail?{brief:json(nextBrief)}:{}),version:{increment:1}}});
 });}

export async function updateBrief(projectId:string,brief:Brief) {
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id"=${projectId} FOR UPDATE`;
  if(await tx.generationJob.count({where:{projectId,status:{in:['RUNNING','QUEUED']}}}))throw new HttpError(409,'Wait for generation to finish');
  const project=await tx.project.findUniqueOrThrow({where:{id:projectId}});
  const site=project.site?siteSchema.parse(project.site):null;
  if(site){await tx.revision.create({data:{projectId,site:json(site),label:'Before business update'}});site.business=businessFromBrief(brief);site.language=brief.language;const previous=project.brief as Brief;site.theme=previous.style!==brief.style||previous.dark!==brief.dark?createTheme(brief.style,brief.dark,brief.primary):ensureContrast({...site.theme,primary:brief.primary});
   // Existing evidence sections are rebuilt from supplied evidence, never rewritten by AI.
   for(const page of site.pages){page.sections=page.sections.filter(section=>{
    if(!['team','testimonials','pricing','trustStats','logos'].includes(section.type))return true;
    if(section.type==='pricing'){
     section.items=brief.pricing.map((entry,i)=>({title:entry.name,text:site!.business.facts[`pricing-${i}`].value,factRef:`pricing-${i}`,href:site!.pages.some(page=>page.slug==='/contact')?'/contact':'#contact',image:''}));
     return brief.websiteType==='business';
    }
    section.items=section.items.filter(item=>site!.business.facts[item.factRef]);
    section.items.forEach(item=>{item.text=site!.business.facts[item.factRef].value;});return section.items.length>0;
   });}
   const revenue=site.pages.find(page=>page.slug==='/business-model')?.sections[0]?.items.at(-1);
   if(revenue)revenue.text=revenueModelText(brief);
  }
  return tx.project.update({where:{id:projectId},data:{brief:json(brief),name:brief.name,...(site?{site:json(site)}:{}),version:{increment:1}}});
 });
}
