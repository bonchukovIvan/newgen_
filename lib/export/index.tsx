import {renderToStaticMarkup} from 'react-dom/server';
import JSZip from 'jszip';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {SiteRenderer} from '@/components/site/renderer';
import {Site,siteSchema} from '@/lib/validation/site';
import {metadataFor,structuredData,safeJsonLd,sitemap,languageCode} from '@/lib/seo';
import {assetRoot} from '@/lib/images';
import sharp from 'sharp';
import type {ExportFormat} from './formats';
import {siteOrigin} from '@/lib/generation/domain';
export async function exportSite(projectId:string,input:Site,format:ExportFormat='node'){
 const site=siteSchema.parse(structuredClone(input));const base=siteOrigin(site.domain)||'https://example.com';
 const publicPrefix=format==='static'?'':'public/';
 const zip=new JSZip();if(format!=='static')zip.file('site.json',JSON.stringify(site,null,2));
 zip.file(publicPrefix+'site.css',await readFile(path.join(process.cwd(),'components/site/site.css')));
 zip.file(publicPrefix+'cookie-notice.js',await readFile(path.join(process.cwd(),'public/cookie-notice.js')));
 if(format==='static')zip.file('static-contact.js',await readFile(path.join(process.cwd(),'lib/export/static-contact.js')));
 for(const asset of site.assets){if(!/^\/media\/[a-zA-Z0-9-]+\.webp$/.test(asset.url))throw new Error('Only managed assets can be exported');zip.file(publicPrefix+asset.url.slice(1),await readFile(path.join(assetRoot(),path.basename(asset.url))));}
 const favicon=site.assets.find(asset=>asset.id===site.faviconId);if(favicon)zip.file(publicPrefix+'favicon.png',await sharp(await readFile(path.join(assetRoot(),path.basename(favicon.url)))).resize(64,64,{fit:'cover'}).png().toBuffer());
 for(const page of site.pages){const metadata=metadataFor(site,page,base);const staticRoot=page.slug==='/'?'':'../'.repeat(page.slug.slice(1).split('/').length);const renderSite=format==='static'?{...site,assets:site.assets.map(asset=>({...asset,url:staticRoot+asset.url.slice(1)}))}:site;const head=renderToStaticMarkup(<><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>{metadata.title}</title><meta name="description" content={metadata.description}/><link rel="canonical" href={metadata.alternates.canonical}/><meta property="og:title" content={metadata.openGraph.title}/><meta property="og:description" content={metadata.openGraph.description}/><meta property="og:url" content={metadata.openGraph.url}/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={metadata.title}/><meta name="twitter:description" content={metadata.openGraph.description}/>{favicon&&<link rel="icon" type="image/png" href={format==='static'?staticRoot+'favicon.png':'/favicon.png'}/>}<link rel="stylesheet" href={format==='static'?staticRoot+'site.css':'/site.css'}/>{format==='static'&&<script defer src={staticRoot+'static-contact.js'}/>}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structuredData(site,page,base))}}/></>);
 const html='<!doctype html><html lang="'+languageCode(site.language,site.business.country)+'"><head>'+head+'<script defer src="'+(format==='static'?staticRoot+'cookie-notice.js':'/cookie-notice.js')+'"></script></head><body style="margin:0">'+renderToStaticMarkup(<SiteRenderer site={renderSite} page={page} staticRoot={format==='static'?staticRoot:undefined} contactAction={format==='static'?'':format==='php'?'/contact.php':'/api/contact'}/>)+'</body></html>';zip.file(publicPrefix+(page.slug==='/'?'':page.slug.slice(1)+'/')+'index.html',html);}
 zip.file(publicPrefix+'sitemap.xml',sitemap(site,base));zip.file(publicPrefix+'robots.txt',`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
 if(format!=='static'){
  zip.file('components/renderer.tsx',await readFile(path.join(process.cwd(),'components/site/renderer.tsx')));
  zip.file('components/site.css',await readFile(path.join(process.cwd(),'components/site/site.css')));
  for(const file of ['lib/validation/site.ts','lib/templates/registry.ts','lib/templates/themes.ts','lib/generation/required-pages.ts','lib/seo/index.ts'])zip.file(file,await readFile(path.join(process.cwd(),file)));
 }
 if(format==='node'){
  zip.file('server.mjs',await readFile(path.join(process.cwd(),'lib/export/server.mjs')));
  zip.file('export-contacts.mjs',await readFile(path.join(process.cwd(),'lib/export/export-contacts.mjs')));
  zip.file('package.json',JSON.stringify({name:'generated-website',private:true,type:'module',scripts:{start:'node server.mjs','contacts:csv':'node export-contacts.mjs'},engines:{node:'>=22.13'}}));
  zip.file('.env.example','PORT=3000\nCONTACT_WEBHOOK_URL=\nCONTACT_WEBHOOK_SECRET=\nTRUST_PROXY=false\n');
  zip.file('Dockerfile','FROM node:22-alpine\nWORKDIR /site\nCOPY --chown=node:node . .\nRUN mkdir -p /site/data && chown node:node /site/data\nUSER node\nENV NODE_ENV=production PORT=3000\nEXPOSE 3000\nVOLUME ["/site/data"]\nCMD ["node", "server.mjs"]\n');
  zip.file('docker-compose.yml','services:\n  website:\n    build: .\n    ports: ["3000:3000"]\n    environment:\n      CONTACT_WEBHOOK_URL: ${CONTACT_WEBHOOK_URL:-}\n      CONTACT_WEBHOOK_SECRET: ${CONTACT_WEBHOOK_SECRET:-}\n    volumes: ["messages:/site/data"]\n    restart: unless-stopped\nvolumes:\n  messages:\n');
 }else if(format==='php'){
  zip.file('public/contact.php',await readFile(path.join(process.cwd(),'lib/export/contact.php')));
  zip.file('data/.keep','');
  zip.file('Dockerfile','FROM php:8.4-cli-alpine\nWORKDIR /site\nCOPY . .\nRUN mkdir -p /site/data && chown -R www-data:www-data /site/data\nUSER www-data\nEXPOSE 3000\nVOLUME ["/site/data"]\nCMD ["php", "-S", "0.0.0.0:3000", "-t", "public"]\n');
  zip.file('docker-compose.yml','services:\n  website:\n    build: .\n    ports: ["3000:3000"]\n    volumes: ["messages:/site/data"]\n    restart: unless-stopped\nvolumes:\n  messages:\n');
 }
 const start=format==='node'?'Run with Node 22.13+: `npm start`, or run `docker compose up -d --build`. Contact messages are stored in `data/contacts.sqlite`; retrieve them with `npm run contacts:csv > contacts.csv`. An optional signed webhook can be configured.':format==='php'?'Point the web server document root at `public/` and enable PHP 8.2+, or run `docker compose up -d --build`. The contact form posts to `public/contact.php` and stores messages in `data/contacts.jsonl` outside the document root. Keep `data/` writable by PHP and private; it contains personal information.':'Upload the HTML, CSS, JavaScript, and media files from this ZIP to the root of a static web host. The contact form stays visible and shows a local thank-you message, but it does not send or store submissions.';
 zip.file('README.md',`# ${site.business.name}\n\n${format==='node'?'Node.js':format==='php'?'PHP':'Static HTML/CSS'} website export.\n\n${start}\n\nPages are pre-rendered semantic HTML. ${format==='static'?'Re-export after editing in Axogen.':'The authoritative configuration is site.json. Re-export after editing in Axogen.'}\n\nPrivacy Policy, GDPR Policy, Cookie Policy, and Business Model pages are included. Their text is a draft: confirm the business identity, privacy contact, data handling, and applicable legal requirements before publication.\n\n${site.domain?'Draft canonical domain: '+site.domain+'. Confirm ownership and configure the matching mailbox before publishing':'Set the canonical domain in Axogen Settings and export again before publishing. Current canonical URLs use example.com.'}\n`);
 const directory=path.resolve(process.env.EXPORT_DIR||'generated-sites',projectId+'-'+format+'-'+Date.now());await mkdir(directory,{recursive:true});for(const [name,entry] of Object.entries(zip.files)){if(entry.dir)continue;const dest=path.join(directory,name);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,await entry.async('nodebuffer'));}
 return{directory,zip:await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'})};
}
