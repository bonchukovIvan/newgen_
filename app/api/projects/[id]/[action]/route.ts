import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db,json} from '@/lib/db';
import {route,ownedProject,readJson,originGuard,rateLimit,HttpError} from '@/lib/http';
import {briefSchema,jobPayloadSchema,siteSchema} from '@/lib/validation/site';
import {queueJob,saveSite,updateBrief} from '@/lib/projects';
import {lookupPlace,googlePhoto} from '@/lib/google/places';
import {saveImage} from '@/lib/images';
import {exportSite} from '@/lib/export/runner';
type Context={params:Promise<{id:string;action:string}>};
export function GET(request:Request,c:Context){return route(async()=>{const {id,action}=await c.params;const p=await ownedProject(id);
 if(action==='export'){if(!p.site)throw new HttpError(400,'Generate a website first');await rateLimit('export:'+p.userId,10,60);const result=await exportSite(p.id,siteSchema.parse(p.site));if(new URL(request.url).searchParams.get('format')==='directory')return NextResponse.json({directory:result.directory});return new Response(new Uint8Array(result.zip),{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${p.id}-website.zip"`}});}
 if(action==='revisions')return NextResponse.json(await db.revision.findMany({where:{projectId:id},orderBy:{createdAt:'desc'},take:20,select:{id:true,label:true,createdAt:true}}));
 if(action==='places'){await rateLimit('places:'+p.userId,10,60);const place=await lookupPlace(briefSchema.parse(p.brief),p.id);const photo=place?.id?await googlePhoto(place.id,p.id).catch(()=>null):null;return NextResponse.json({place,photo});}
 throw new HttpError(404,'Unknown action');});}
export function POST(request:Request,c:Context){return route(async()=>{originGuard(request);const {id,action}=await c.params;const p=await ownedProject(id);
 if(action==='generate'){await rateLimit('generate:'+p.userId,30,3600);return NextResponse.json(await queueJob(id,jobPayloadSchema.parse(await readJson(request))));}
 if(action==='retry'){const {jobId}=z.object({jobId:z.string()}).parse(await readJson(request));return db.$transaction(async tx=>{await tx.$queryRaw`SELECT "id" FROM "Project" WHERE "id"=${id} FOR UPDATE`;const job=await tx.generationJob.findFirst({where:{id:jobId,projectId:id,status:'FAILED'}});if(!job)throw new HttpError(404,'Failed job not found');if(await tx.generationJob.count({where:{projectId:id,status:{in:['QUEUED','RUNNING']}}}))throw new HttpError(409,'Another job is already running');await tx.project.update({where:{id},data:{status:'GENERATING'}});return NextResponse.json(await tx.generationJob.update({where:{id:jobId},data:{status:'QUEUED',error:null,leaseOwner:null,leaseUntil:null}}));});}
 if(action==='duplicate'){const copy=await db.project.create({data:{userId:p.userId,name:p.name+' copy',brief:json(p.brief),site:p.site??undefined,status:p.site?'READY':'DRAFT'}});const assets=await db.asset.findMany({where:{projectId:id}});if(assets.length)await db.asset.createMany({data:assets.map(a=>({projectId:copy.id,url:a.url,provider:a.provider,intent:a.intent,prompt:a.prompt,alt:a.alt,metadata:json(a.metadata)}))});return NextResponse.json(copy);}
 if(action==='restore'){const {revisionId}=z.object({revisionId:z.string()}).parse(await readJson(request));const revision=await db.revision.findFirst({where:{id:revisionId,projectId:id}});if(!revision)throw new HttpError(404,'Revision not found');return NextResponse.json(await saveSite(id,siteSchema.parse(revision.site),p.version));}
 if(action==='settings'){const brief=briefSchema.parse(await readJson(request));return NextResponse.json(await updateBrief(id,brief));}
 if(action==='upload'){await rateLimit('upload:'+p.userId,30,3600);if(Number(request.headers.get('content-length'))>13*1024*1024)throw new HttpError(413,'Upload too large');const data=await request.formData();const file=data.get('file');if(!(file instanceof File)||file.size>12*1024*1024||!['image/png','image/jpeg','image/webp','image/avif'].includes(file.type))throw new HttpError(400,'Upload a PNG, JPEG, WebP or AVIF image smaller than 12 MB');const id=crypto.randomUUID();const saved=await saveImage(Buffer.from(await file.arrayBuffer()),id);const asset={id,...saved,provider:'upload',alt:String(data.get('alt')||file.name).slice(0,500),intent:'Owner-supplied image',prompt:'',attribution:'',sourceUrl:''};await db.asset.create({data:{id,projectId:p.id,url:asset.url,provider:asset.provider,intent:asset.intent,prompt:'',alt:asset.alt,metadata:json(asset)}});return NextResponse.json(asset);}
 throw new HttpError(404,'Unknown action');});}
