import {it,expect,afterAll} from 'vitest';
import {db,json} from '@/lib/db';
import {processJob} from '@/lib/generation/pipeline';
import {demoBrief} from '@/lib/templates/starter';
import {siteSchema} from '@/lib/validation/site';
import {saveSite} from '@/lib/projects';
import {exportSite} from '@/lib/export';
import JSZip from 'jszip';
import {randomUUID} from 'node:crypto';
import {spawn,ChildProcess} from 'node:child_process';
import {rm} from 'node:fs/promises';
import path from 'node:path';
let userId:string|undefined,server:ChildProcess|undefined;const directories:string[]=[];
afterAll(async()=>{server?.kill();if(userId)await db.user.delete({where:{id:userId}});for(const directory of directories)await rm(directory,{recursive:true,force:true});await db.$disconnect();});
it('persists a generated site, enforces optimistic saves, resumes jobs and runs standalone export',async()=>{
 process.env.MOCK_AI='true';userId=randomUUID();await db.user.create({data:{id:userId,name:'Integration test',email:userId+'@example.test'}});
 const project=await db.project.create({data:{userId,name:demoBrief.name,brief:json(demoBrief)}});
 const owner=randomUUID();const job=await db.generationJob.create({data:{projectId:project.id,status:'RUNNING',leaseOwner:owner,leaseUntil:new Date(Date.now()+180000),payload:json({scope:'site',force:false})}});
 await processJob(job.id,owner);
 const finished=await db.generationJob.findUniqueOrThrow({where:{id:job.id}});expect(finished.status,finished.error||'').toBe('COMPLETE');
 let persisted=await db.project.findUniqueOrThrow({where:{id:project.id}});const site=siteSchema.parse(persisted.site);expect(site.pages).toHaveLength(10);expect(site.assets.length).toBeGreaterThan(0);expect(site.faviconId).toBeTruthy();expect(site.assets.some(asset=>asset.id===site.faviconId)).toBe(true);
 site.pages[0].sections[0].title='A saved integration headline';const saved=await saveSite(project.id,site,persisted.version);expect(saved.version).toBe(persisted.version+1);
 await expect(saveSite(project.id,site,persisted.version)).rejects.toThrow('changed');
 const foreign=structuredClone(site);foreign.assets[0].url='/media/unowned-image.webp';await expect(saveSite(project.id,foreign,saved.version)).rejects.toThrow('Only images');
 // A leased job starting at a saved stage consumes the checkpoint rather than rebuilding the site.
 const resumed=await db.generationJob.create({data:{projectId:project.id,status:'RUNNING',leaseOwner:owner,leaseUntil:new Date(Date.now()+180000),stage:9,result:json(site),payload:json({scope:'site',force:false})}});await processJob(resumed.id,owner);
 persisted=await db.project.findUniqueOrThrow({where:{id:project.id}});expect(siteSchema.parse(persisted.site).pages[0].sections[0].title).toBe('A saved integration headline');
 const result=await exportSite(project.id,siteSchema.parse(persisted.site));directories.push(result.directory);const zip=await JSZip.loadAsync(result.zip);expect(zip.file('Dockerfile')).not.toBeNull();expect(zip.file('site.json')).not.toBeNull();expect(zip.file('public/favicon.png')).not.toBeNull();expect(await zip.file('public/index.html')!.async('string')).toContain('A saved integration headline');for(const slug of ['privacy-policy','gdpr-policy','cookie-policy','business-model'])expect(zip.file(`public/${slug}/index.html`)).not.toBeNull();
 const domain=site.domain;const homeHtml=await zip.file('public/index.html')!.async('string');expect(homeHtml).toContain(`rel="canonical" href="${domain}/"`);expect(homeHtml).toContain(`property="og:url" content="${domain}/"`);expect(await zip.file('public/sitemap.xml')!.async('string')).toContain(`${domain}/`);expect(await zip.file('public/robots.txt')!.async('string')).toContain(`${domain}/sitemap.xml`);
 const staticResult=await exportSite(project.id,site,'static');directories.push(staticResult.directory);const staticZip=await JSZip.loadAsync(staticResult.zip);expect(staticZip.file('index.html')).not.toBeNull();expect(staticZip.file('favicon.png')).not.toBeNull();expect(staticZip.file('privacy-policy/index.html')).not.toBeNull();expect(staticZip.file('server.mjs')).toBeNull();expect(staticZip.file('contact.php')).toBeNull();const staticContact=await staticZip.file('contact/index.html')!.async('string');expect(staticContact).toContain('data-static-contact');expect(staticContact).toContain('data-static-confirmation');expect(staticContact).toContain('Thank you for your request. This form does not send messages.');expect(staticContact).not.toContain('action="/api/contact');expect(staticZip.file('static-contact.js')).not.toBeNull();
 for(const [name,entry] of Object.entries(staticZip.files)){if(!name.endsWith('.html'))continue;const html=await entry.async('string');for(const [,href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){if(/^(?:https?:|mailto:|tel:|#)/.test(href))continue;expect(href.startsWith('/'),`${name}: ${href}`).toBe(false);const target=path.posix.normalize(path.posix.join(path.posix.dirname(name),href.split('#')[0]));expect(staticZip.file(target),`${name}: ${href}`).not.toBeNull();}}
 const phpResult=await exportSite(project.id,site,'php');directories.push(phpResult.directory);const phpZip=await JSZip.loadAsync(phpResult.zip);expect(phpZip.file('public/contact.php')).not.toBeNull();expect(phpZip.file('public/favicon.png')).not.toBeNull();expect(phpZip.file('server.mjs')).toBeNull();expect(await phpZip.file('public/contact/index.html')!.async('string')).toContain('action="/contact.php"');
 const port=32000+Math.floor(Math.random()*1000);server=spawn(process.execPath,['server.mjs'],{cwd:result.directory,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Standalone server did not start')),10000);server!.stdout!.on('data',data=>{if(String(data).includes('Website ready')){clearTimeout(timer);resolve();}});server!.on('error',reject);});
 const base='http://localhost:'+port;expect((await fetch(base)).status).toBe(200);expect((await fetch(base+'/services')).status).toBe(200);for(const slug of ['privacy-policy','gdpr-policy','cookie-policy','business-model'])expect((await fetch(base+'/'+slug)).status).toBe(200);expect((await fetch(base+site.assets[0].url)).headers.get('content-type')).toBe('image/webp');expect((await fetch(base+'/favicon.png')).headers.get('content-type')).toBe('image/png');
 const invalid=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'A',email:'invalid',message:'short'})});expect(invalid.status).toBe(400);
 const contact=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'A visitor',email:'visitor@example.test',message:'Please contact me about private gaming events.'})});expect(contact.status).toBe(200);
 expect(await contact.text()).toContain('message has been received');
});
