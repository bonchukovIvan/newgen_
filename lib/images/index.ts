import OpenAI from 'openai';
import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {Asset,Brief} from '@/lib/validation/site';
import {db,json} from '@/lib/db';
import {isMock} from '@/lib/env';
import {cached,cacheKey} from '@/lib/cache';
import {track} from '@/lib/usage';
export interface ImageContext {projectId:string;intent:string;query:string;style:string;orientation:'landscape'|'portrait'|'square';force?:boolean;}
export interface ImageResult {bytes?:Buffer;url?:string;provider:string;attribution:string;sourceUrl:string;width:number;height:number;}
export interface ImageProvider {name:string;searchImages?(context:ImageContext):Promise<ImageResult[]>;generateImage?(context:ImageContext):Promise<ImageResult>;}
export const assetRoot=()=>path.resolve(process.env.ASSET_DIR||'public/uploads');
export async function saveImage(bytes:Buffer,id:string=randomUUID()):Promise<{url:string;width:number;height:number}> {
 if(bytes.length>12*1024*1024)throw new Error('Images must be smaller than 12 MB');
 const image=sharp(bytes,{limitInputPixels:40000000}).rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:82});
 const {data,info}=await image.toBuffer({resolveWithObject:true});await mkdir(assetRoot(),{recursive:true});await writeFile(path.join(assetRoot(),id+'.webp'),data);return {url:'/media/'+id+'.webp',width:info.width,height:info.height};
}
export class PexelsProvider implements ImageProvider {
 name='pexels';
 async searchImages(c:ImageContext):Promise<ImageResult[]> {
  if(!process.env.PEXELS_API_KEY)throw new Error('Pexels is not configured');
  return cached(cacheKey('pexels',{query:c.query,orientation:c.orientation}),3600,async()=>{
   const response=await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(c.query)}&orientation=${c.orientation}&per_page=8`,{headers:{Authorization:process.env.PEXELS_API_KEY!},signal:AbortSignal.timeout(15000)});
   await track(c.projectId,this.name,'search');if(!response.ok)throw new Error(`Pexels returned ${response.status}`);
   const data=await response.json();return(data.photos||[]).map((p:{src:{large2x:string};photographer:string;url:string;width:number;height:number})=>({url:p.src.large2x,provider:'pexels',attribution:`Photo by ${p.photographer} on Pexels`,sourceUrl:p.url,width:p.width,height:p.height}));
  },c.force);
 }
}
export class GPTImageProvider implements ImageProvider {
 name='gpt-image-2';
 async generateImage(c:ImageContext):Promise<ImageResult> {
  const key=process.env.OPENAI_IMAGE_API_KEY||process.env.OPENAI_API_KEY;if(!key)throw new Error('OpenAI images are not configured');
  const client=new OpenAI({apiKey:key,timeout:180000,maxRetries:1});
  const response=await client.images.generate({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2',prompt:`Original commercial photograph. ${c.intent}. ${c.style} art direction. ${c.orientation} composition, natural materials and light, no text, no logos. Illustrative concept, not a documentary image of a real business.`,size:c.orientation==='landscape'?'1536x1024':c.orientation==='portrait'?'1024x1536':'1024x1024',n:1});
  await track(c.projectId,this.name,'generate');const image=response.data?.[0]?.b64_json;if(!image)throw new Error('Image provider returned no image');return {bytes:Buffer.from(image,'base64'),provider:this.name,attribution:'AI-generated illustration',sourceUrl:'',width:1536,height:1024};
 }
}
export class ComfyProvider implements ImageProvider {
 name='comfyui';
 async generateImage(c:ImageContext):Promise<ImageResult> {
  const base=process.env.COMFYUI_BASE_URL?.replace(/\/$/,'');if(!base)throw new Error('ComfyUI is not configured');
  const workflow=JSON.parse(await readFile(process.env.COMFYUI_WORKFLOW||'config/comfyui/default.json','utf8'));
  function substitute(value:unknown):unknown {if(value==='{{SEED}}')return Math.floor(Math.random()*1e9);if(typeof value==='string')return value.replaceAll('{{PROMPT}}',c.intent+', '+c.style).replaceAll('{{SEED}}',String(Math.floor(Math.random()*1e9)));if(Array.isArray(value))return value.map(substitute);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,substitute(v)]));return value;}
  const queued=await fetch(base+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:substitute(workflow),client_id:randomUUID()}),signal:AbortSignal.timeout(10000)});
  if(!queued.ok)throw new Error(`ComfyUI rejected workflow (${queued.status})`);const {prompt_id}=await queued.json();
  const end=Date.now()+180000;while(Date.now()<end){await new Promise(r=>setTimeout(r,2000));const response=await fetch(base+'/history/'+encodeURIComponent(prompt_id),{signal:AbortSignal.timeout(10000)});if(!response.ok)continue;const history=(await response.json())[prompt_id];if(history?.status?.status_str==='error')throw new Error('ComfyUI workflow failed');const outputs=Object.values(history?.outputs||{}) as {images?:{filename:string;subfolder:string;type:string}[]}[];const file=outputs.flatMap(o=>o.images||[])[0];if(file){const image=await fetch(base+'/view?'+new URLSearchParams(file),{signal:AbortSignal.timeout(20000)});if(!image.ok)throw new Error('ComfyUI image download failed');await track(c.projectId,this.name,'generate');return {bytes:Buffer.from(await image.arrayBuffer()),provider:this.name,attribution:'AI-generated illustration',sourceUrl:'',width:1536,height:1024};}}
  throw new Error('ComfyUI timed out');
 }
}
export class PlaceholderProvider implements ImageProvider {
 name='placeholder';
 async generateImage(c:ImageContext):Promise<ImageResult> {
  const n=[...c.intent+(c.force?randomUUID():'')].reduce((a,x)=>a+x.charCodeAt(0),0)%360;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="hsl(${n},50%,12%)"/><stop offset="1" stop-color="hsl(${(n+60)%360},40%,28%)"/></linearGradient><linearGradient id="b" x2="1" y2="1"><stop stop-color="hsl(${n},70%,78%)"/><stop offset="1" stop-color="hsl(${(n+80)%360},80%,55%)"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#a)"/><g fill="none" stroke="url(#b)" stroke-width="2" opacity=".45">${Array.from({length:16},(_,i)=>`<ellipse cx="800" cy="500" rx="${180+i*30}" ry="${150+i*17}" transform="rotate(${i*8} 800 500)"/>`).join('')}</g><circle cx="800" cy="500" r="145" fill="url(#b)"/><circle cx="850" cy="450" r="135" fill="url(#a)"/><path d="M0 850L1600 350M0 880L1600 380" stroke="white" opacity=".08"/></svg>`;
  return {bytes:Buffer.from(svg),provider:this.name,attribution:'Original abstract illustration',sourceUrl:'',width:1600,height:1000};
 }
}
export function providerOrder(strategy:Brief['imageStrategy']):ImageProvider[] {
 const stock=new PexelsProvider(),ai=new GPTImageProvider(),comfy=new ComfyProvider(),fallback=new PlaceholderProvider();
 if(isMock()||strategy==='manual')return[fallback];
 return strategy==='pexels'?[stock,fallback]:strategy==='gpt-image-2'?[ai,fallback]:strategy==='comfyui'?[comfy,ai,stock,fallback]:strategy==='google'?[ai,stock,comfy,fallback]:[stock,ai,comfy,fallback];
}
export async function obtainImage(c:ImageContext,strategy:Brief['imageStrategy']):Promise<{asset:Asset;warnings:string[]}> {
 const warnings:string[]=[];
 for(const provider of providerOrder(strategy))try{
  const result=provider.generateImage?await provider.generateImage(c):(await provider.searchImages!(c))[0];if(!result)throw new Error('No relevant images found');
  let bytes=result.bytes;
  if(!bytes&&result.url){const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='images.pexels.com')throw new Error('Unapproved image host');const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});if(!response.ok)throw new Error('Image download failed');if(Number(response.headers.get('content-length'))>12*1024*1024)throw new Error('Image too large');bytes=Buffer.from(await response.arrayBuffer());}
  if(!bytes)throw new Error('No image data');const id:string=randomUUID(),saved=await saveImage(bytes,id);
  const asset:Asset={id,...saved,provider:result.provider,alt:c.intent,intent:c.intent,prompt:c.query,attribution:result.attribution,sourceUrl:result.sourceUrl};
  await db.asset.create({data:{id,projectId:c.projectId,url:asset.url,provider:asset.provider,intent:asset.intent,prompt:asset.prompt,alt:asset.alt,metadata:json(asset)}});return{asset,warnings};
 }catch(error){warnings.push(`${provider.name}: ${error instanceof Error?error.message:'unavailable'}`);}
 throw new Error('Image storage failed; check the asset volume permissions');
}
