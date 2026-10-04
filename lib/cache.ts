import {createHash} from 'node:crypto';
import {db,json} from '@/lib/db';
export const cacheKey=(scope:string,value:unknown)=>scope+':'+createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function cached<T>(key:string,seconds:number,fn:()=>Promise<T>,force=false):Promise<T> {if(!force){const item=await db.cacheEntry.findUnique({where:{key}});if(item&&item.expiresAt>new Date())return item.value as T;}const value=await fn();await db.cacheEntry.upsert({where:{key},create:{key,value:json(value),expiresAt:new Date(Date.now()+seconds*1000)},update:{value:json(value),expiresAt:new Date(Date.now()+seconds*1000)}});return value;}
