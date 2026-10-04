import {unlink} from 'node:fs/promises';
import path from 'node:path';
import {db} from '@/lib/db';
import {assetRoot} from '@/lib/images';
import {siteSchema} from '@/lib/validation/site';

export async function removeUnownedFiles(urls:string[]) {
 for(const url of new Set(urls)){
  if(!/^\/media\/[a-zA-Z0-9-]+\.webp$/.test(url))continue;
  if(await db.asset.count({where:{url}}))continue;
  await unlink(path.join(assetRoot(),path.basename(url))).catch(error=>{if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;});
 }
}

export async function pruneProjectAssets(projectId:string) {
 const project=await db.project.findUnique({where:{id:projectId},select:{site:true,revisions:{select:{site:true}},jobs:{where:{status:{in:['QUEUED','RUNNING']}},select:{result:true}}}});
 if(!project)return;
 const used=new Set<string>();
 for(const raw of [project.site,...project.revisions.map(r=>r.site),...project.jobs.map(j=>j.result)]){
  if(!raw)continue;
  const site=siteSchema.safeParse(raw);if(site.success)for(const asset of site.data.assets)used.add(asset.url);
 }
 const assets=await db.asset.findMany({where:{projectId},select:{id:true,url:true}});
 const stale=assets.filter(a=>!used.has(a.url));
 if(!stale.length)return;
 await db.asset.deleteMany({where:{id:{in:stale.map(a=>a.id)}}});
 await removeUnownedFiles(stale.map(a=>a.url));
}
