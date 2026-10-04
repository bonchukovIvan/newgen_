import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {route,ownedProject,readJson,originGuard,HttpError} from '@/lib/http';
import {siteSchema} from '@/lib/validation/site';
import {saveSite} from '@/lib/projects';
import {removeUnownedFiles} from '@/lib/images/cleanup';
type Context={params:Promise<{id:string}>};
export function GET(_request:Request,c:Context){return route(async()=>{const p=await ownedProject((await c.params).id);const [jobs,assets,usage,submissions]=await Promise.all([db.generationJob.findMany({where:{projectId:p.id},orderBy:{createdAt:'desc'},take:5,include:{logs:{orderBy:{createdAt:'desc'},take:25}}}),db.asset.findMany({where:{projectId:p.id},orderBy:{createdAt:'desc'}}),db.apiUsage.findMany({where:{projectId:p.id}}),db.contactSubmission.findMany({where:{projectId:p.id},orderBy:{createdAt:'desc'},take:100})]);return NextResponse.json({...p,jobs,assets,usage,submissions});});}
export function PATCH(request:Request,c:Context){return route(async()=>{originGuard(request);const p=await ownedProject((await c.params).id);const input=z.object({site:siteSchema,version:z.number().int()}).parse(await readJson(request));return NextResponse.json(await saveSite(p.id,input.site,input.version));});}
export function DELETE(request:Request,c:Context){return route(async()=>{originGuard(request);const p=await ownedProject((await c.params).id);if(await db.generationJob.count({where:{projectId:p.id,status:{in:['RUNNING','QUEUED']}}}))throw new HttpError(409,'Wait for generation to finish before deleting');const assets=await db.asset.findMany({where:{projectId:p.id},select:{url:true}});await db.project.delete({where:{id:p.id}});await removeUnownedFiles(assets.map(a=>a.url));return NextResponse.json({ok:true});});}
