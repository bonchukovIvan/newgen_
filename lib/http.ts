import {NextResponse} from 'next/server';
import {headers} from 'next/headers';
import {auth} from '@/lib/auth';
import {db} from '@/lib/db';
import {ZodError} from 'zod';
import {InternalLinkError} from '@/lib/validation/site';
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export async function user() {const session=await auth.api.getSession({headers:await headers()});if(!session)throw new HttpError(401,'Please sign in');return session.user;}
export async function ownedProject(id:string) {const u=await user();const p=await db.project.findFirst({where:{id,userId:u.id}});if(!p)throw new HttpError(404,'Project not found');return p;}
export function originGuard(request:Request) {const origin=request.headers.get('origin');const expected=new URL(process.env.BETTER_AUTH_URL||'http://localhost:3000').origin;if(origin&&origin!==expected)throw new HttpError(403,'Origin not allowed');}
export async function readJson(request:Request) {if(Number(request.headers.get('content-length'))>1000000)throw new HttpError(413,'Request too large');const raw=await request.text();if(raw.length>1000000)throw new HttpError(413,'Request too large');try{return JSON.parse(raw) as unknown;}catch{throw new HttpError(400,'Invalid JSON');}}
export function route(fn:()=>Promise<Response>) {return fn().catch((e:unknown)=>{if(e instanceof ZodError)return NextResponse.json({error:e.issues.map(x=>`${x.path.join('.')}: ${x.message}`).join('; ')},{status:400});if(e instanceof InternalLinkError)return NextResponse.json({error:e.message},{status:400});if(e instanceof HttpError)return NextResponse.json({error:e.message},{status:e.status});console.error(e);return NextResponse.json({error:'The request could not be completed. Please try again.'},{status:500});});}
export async function rateLimit(key:string,max=15,seconds=60) {const now=new Date();const rows=await db.$queryRaw<{count:number}[]>`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${new Date(now.getTime()+seconds*1000)}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt"<${now} THEN 1 ELSE "RateLimit"."count"+1 END,"expiresAt"=CASE WHEN "RateLimit"."expiresAt"<${now} THEN ${new Date(now.getTime()+seconds*1000)} ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
 if(rows[0].count>max)throw new HttpError(429,'Too many requests. Please try again shortly.');}
export function clientIp(request:Request) {return process.env.TRUST_PROXY==='true'?request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown':'direct';}
