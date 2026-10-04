import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {route,user,readJson,originGuard,rateLimit} from '@/lib/http';
import {briefSchema,newProjectSchema} from '@/lib/validation/site';
import {createProject} from '@/lib/projects';
export function GET(){return route(async()=>{const u=await user();return NextResponse.json(await db.project.findMany({where:{userId:u.id},orderBy:{createdAt:'desc'},select:{id:true,name:true,status:true,brief:true,createdAt:true,updatedAt:true,version:true}}));});}
export function POST(request:Request){return route(async()=>{originGuard(request);const u=await user();await rateLimit('create:'+u.id,10,3600);const input=await readJson(request);const brief=typeof input==='object'&&input!==null&&'name' in input?briefSchema.parse(input):briefSchema.parse({...newProjectSchema.parse(input),name:'New business website',city:'Location pending',services:['Services pending'],autoGenerate:true,addressVerified:false,phoneVerified:false,emailVerified:false});return NextResponse.json(await createProject(u.id,brief),{status:201});});}
