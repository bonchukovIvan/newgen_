import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {assetRoot} from '@/lib/images';
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}) {const {filename}=await params;if(!/^[a-zA-Z0-9-]+\.webp$/.test(filename))return new Response('Not found',{status:404});try{const bytes=await readFile(path.join(assetRoot(),filename));return new Response(bytes,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}}
