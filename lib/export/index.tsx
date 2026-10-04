import {renderToStaticMarkup} from 'react-dom/server';
import JSZip from 'jszip';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {SiteRenderer} from '@/components/site/renderer';
import {Site,siteSchema} from '@/lib/validation/site';
import {metadataFor,structuredData,safeJsonLd,sitemap,languageCode} from '@/lib/seo';
import {assetRoot} from '@/lib/images';
export async function exportSite(projectId:string,input:Site){
 const site=siteSchema.parse(structuredClone(input));const base=site.domain||'https://example.com';
 const zip=new JSZip();zip.file('site.json',JSON.stringify(site,null,2));
 zip.file('public/site.css',await readFile(path.join(process.cwd(),'components/site/site.css')));
 for(const asset of site.assets){if(!/^\/media\/[a-zA-Z0-9-]+\.webp$/.test(asset.url))throw new Error('Only managed assets can be exported');zip.file('public'+asset.url,await readFile(path.join(assetRoot(),path.basename(asset.url))));}
 for(const page of site.pages){const metadata=metadataFor(site,page,base);const head=renderToStaticMarkup(<><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>{metadata.title}</title><meta name="description" content={metadata.description}/><link rel="canonical" href={metadata.alternates.canonical}/><meta property="og:title" content={metadata.openGraph.title}/><meta property="og:description" content={metadata.openGraph.description}/><meta property="og:url" content={metadata.openGraph.url}/><meta property="og:type" content="website"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content={metadata.title}/><meta name="twitter:description" content={metadata.description}/><link rel="stylesheet" href="/site.css"/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structuredData(site,page,base))}}/></>);
 const html='<!doctype html><html lang="'+languageCode(site.language)+'"><head>'+head+'</head><body style="margin:0">'+renderToStaticMarkup(<SiteRenderer site={site} page={page}/>)+'</body></html>';zip.file('public'+(page.slug==='/'?'':page.slug)+'/index.html',html);}
 zip.file('public/sitemap.xml',sitemap(site,base));zip.file('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
 zip.file('server.mjs',await readFile(path.join(process.cwd(),'lib/export/server.mjs')));
 zip.file('export-contacts.mjs',await readFile(path.join(process.cwd(),'lib/export/export-contacts.mjs')));
 zip.file('components/renderer.tsx',await readFile(path.join(process.cwd(),'components/site/renderer.tsx')));
 zip.file('components/site.css',await readFile(path.join(process.cwd(),'components/site/site.css')));
 for(const file of ['lib/validation/site.ts','lib/templates/registry.ts','lib/templates/themes.ts','lib/seo/index.ts'])zip.file(file,await readFile(path.join(process.cwd(),file)));
 zip.file('package.json',JSON.stringify({name:'generated-website',private:true,type:'module',scripts:{start:'node server.mjs','contacts:csv':'node export-contacts.mjs'},engines:{node:'>=22.13'}}));
 zip.file('.env.example','PORT=3000\nCONTACT_WEBHOOK_URL=\nCONTACT_WEBHOOK_SECRET=\nTRUST_PROXY=false\n');
 zip.file('Dockerfile','FROM node:22-alpine\nWORKDIR /site\nCOPY --chown=node:node . .\nRUN mkdir -p /site/data && chown node:node /site/data\nUSER node\nENV NODE_ENV=production PORT=3000\nEXPOSE 3000\nVOLUME ["/site/data"]\nCMD ["node", "server.mjs"]\n');
 zip.file('docker-compose.yml','services:\n  website:\n    build: .\n    ports: ["3000:3000"]\n    environment:\n      CONTACT_WEBHOOK_URL: ${CONTACT_WEBHOOK_URL:-}\n      CONTACT_WEBHOOK_SECRET: ${CONTACT_WEBHOOK_SECRET:-}\n    volumes: ["messages:/site/data"]\n    restart: unless-stopped\nvolumes:\n  messages:\n');
 zip.file('README.md',`# ${site.business.name}\n\nA standalone website. No dashboard, API keys, npm packages or database server required.\n\nRun locally with Node 22.13+: \`npm start\`. Deploy: \`docker compose up -d --build\`. Or \`docker build -t generated-site . && docker run -p 3000:3000 -v website-messages:/site/data generated-site\`.\n\nPages are pre-rendered semantic HTML from the included React component source. The authoritative configuration is site.json. Re-export after editing in Axogen. Asset credits are embedded in the pages.\n\nContact submissions are validated and stored in data/contacts.sqlite. Persist /site/data. Optionally set CONTACT_WEBHOOK_URL and CONTACT_WEBHOOK_SECRET for signed webhook delivery; SQLite retains messages if delivery fails. Run \`npm run contacts:csv > contacts.csv\` from the exported site's directory to retrieve all messages; for Docker, run \`docker compose exec -T website node export-contacts.mjs > contacts.csv\`. Keep this CSV private because it contains customer data. Set TRUST_PROXY=true only behind a proxy that overwrites forwarded headers.\n\n${site.domain?'Canonical domain: '+site.domain:'Set the canonical domain in Axogen Settings and export again before publishing. Current canonical URLs use example.com.'}\n`);
 const directory=path.resolve(process.env.EXPORT_DIR||'generated-sites',projectId+'-'+Date.now());await mkdir(directory,{recursive:true});for(const [name,entry] of Object.entries(zip.files)){if(entry.dir)continue;const dest=path.join(directory,name);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,await entry.async('nodebuffer'));}
 return{directory,zip:await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'})};
}
