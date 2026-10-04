/** Run against a local demo-mode Docker deployment: node scripts/docker-smoke.mjs */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.SMOKE_BASE_URL||'http://localhost:3000';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Smoke tests require a local deployment');
let cookie='';
async function api(route,body){
 const response=await fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const cookies=response.headers.getSetCookie();if(cookies.length)cookie=cookies.map(c=>c.split(';')[0]).join('; ');
 const text=await response.text();assert.ok(response.ok,`${route}: ${response.status} ${text.slice(0,500)}`);return JSON.parse(text);
}
assert.equal((await api('/api/health')).ok,true);
const stamp=randomUUID();
await api('/api/auth/sign-up/email',{name:'Docker smoke test',email:`docker-${stamp}@example.test`,password:randomUUID()+randomUUID()});
const project=await api('/api/projects',{name:'NovaForge Docker smoke',category:'Gaming lounge',city:'Manchester',country:'United Kingdom',services:['PC Gaming','Console Gaming','Esports Events'],style:'Gaming',dark:true,pageCount:3,imageStrategy:'manual'});
let ready;
for(let attempt=0;attempt<90;attempt++){
 const current=await api('/api/projects/'+project.id);
 assert.notEqual(current.jobs[0]?.status,'FAILED',current.jobs[0]?.error||'Generation failed');
 if(current.status==='READY'){ready=current;break;}
 await new Promise(resolve=>setTimeout(resolve,2000));
}
assert.ok(ready,'Worker failed to finish within three minutes');
assert.equal(ready.site.pages.length,3);
for(const page of ready.site.pages){const response=await fetch(base+'/preview/'+project.id+page.slug,{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.match(await response.text(),/application\/ld\+json/);}
for(const asset of ready.site.assets){const response=await fetch(base+asset.url);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/webp/);}
const response=await fetch(base+'/api/projects/'+project.id+'/export',{headers:{Cookie:cookie}});
assert.equal(response.status,200,await response.clone().text().then(t=>t.slice(0,500)));
assert.match(response.headers.get('content-type'),/application\/zip/);
const zip=new Uint8Array(await response.arrayBuffer());assert.equal(String.fromCharCode(...zip.slice(0,2)),'PK');
const output=process.env.SMOKE_OUTPUT_DIR||'/tmp/axogen-smoke';
await mkdir(output,{recursive:true});
await writeFile(output+'/docker-smoke-website.zip',zip);
await writeFile(output+'/docker-smoke.json',JSON.stringify({projectId:project.id,pages:ready.site.pages.length,assets:ready.site.assets.length}));
console.log('PASS: Docker health, signup, worker generation, preview, shared assets, and ZIP export.');
console.log('Export: '+output+'/docker-smoke-website.zip');
