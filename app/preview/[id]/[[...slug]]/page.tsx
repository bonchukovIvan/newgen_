import {notFound,redirect} from 'next/navigation';
import {headers} from 'next/headers';
import {cache} from 'react';
import {db} from '@/lib/db';
import {auth} from '@/lib/auth';
import {siteSchema} from '@/lib/validation/site';
import {SiteRenderer} from '@/components/site/renderer';
import Script from 'next/script';
import {metadataFor,structuredData,safeJsonLd,languageCode} from '@/lib/seo';
import {siteOrigin} from '@/lib/generation/domain';
type Props={params:Promise<{id:string;slug?:string[]}>};
const load=cache(async(id:string,slug:string)=>{const session=await auth.api.getSession({headers:await headers()});if(!session)redirect('/login');const p=await db.project.findFirst({where:{id,userId:session.user.id}});if(!p?.site)notFound();const site=siteSchema.parse(p.site);const page=site.pages.find(p=>p.slug===slug);if(!page)notFound();return{site,page};});
export async function generateMetadata({params}:Props){const {id,slug}=await params;const {site,page}=await load(id,'/'+(slug||[]).join('/'));return {...metadataFor(site,page,siteOrigin(site.domain)||`${process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'}/preview/${id}`),robots:{index:false,follow:false}};}
export default async function Preview({params}:Props){const {id,slug}=await params;const {site,page}=await load(id,'/'+(slug||[]).join('/'));return <div lang={languageCode(site.language,site.business.country)}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structuredData(site,page,siteOrigin(site.domain)||'https://example.com'))}}/><SiteRenderer site={site} page={page} base={'/preview/'+id} contactAction={'/api/contact/'+id}/><Script src="/cookie-notice.js" strategy="afterInteractive"/></div>;}
