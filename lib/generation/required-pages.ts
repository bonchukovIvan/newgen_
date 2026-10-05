import type {Brief,SitePage} from '@/lib/validation/site';

export const requiredPageSpecs=[
 {slug:'/privacy-policy',title:'Privacy Policy'},
 {slug:'/gdpr-policy',title:'GDPR Policy'},
 {slug:'/cookie-policy',title:'Cookie Policy'},
 {slug:'/business-model',title:'Business Model'},
] as const;
export type RequiredPageSlug=typeof requiredPageSpecs[number]['slug'];
export function isRequiredPageSlug(slug:string):slug is RequiredPageSlug{return requiredPageSpecs.some(page=>page.slug===slug);}
export function revenueModelText(brief:Brief):string {return brief.pricing.length?`Proposed revenue comes from these draft offers: ${brief.pricing.map(entry=>`${entry.name} at ${entry.price}`).join('; ')}. These amounts are suggestions, not confirmed business prices. The owner must confirm pricing, costs, staff, partners, and delivery capacity before publication.`:'Possible revenue comes from the services the owner chooses to sell. Pricing, costs, staff, partners, and delivery capacity require owner confirmation.';}

function fallbackItems(slug:RequiredPageSlug,brief:Brief):{title:string;text:string}[]{
 switch(slug){
  case '/privacy-policy':return [
   {title:'Who is responsible',text:`${brief.name} should confirm the legal name and a working privacy contact address before publishing this notice.`},
   {title:'Information visitors submit',text:'When a contact form is enabled, it asks for a name, email address, and message. A phone number is optional.'},
   {title:'How enquiries are handled',text:'Where the contact form is available, messages are stored by the site backend so the business can respond. A static HTML export has no built-in form backend. The business must confirm the storage location and any connected form service.'},
   {title:'Retention and sharing',text:'The business must set a retention period, describe its hosting and form-service recipients, and check whether data is transferred to another country.'},
   {title:'Your choices',text:'Ask the business for access, correction, deletion, or other rights that apply to your information. The business must provide a working contact method and review the applicable law.'},
  ];
  case '/gdpr-policy':return [
   {title:'When this policy applies',text:'This draft describes data protection topics for visitors where the GDPR or related law applies. The business must confirm its role and applicable jurisdiction.'},
   {title:'Contact-form data',text:'Where a contact form is enabled, visitors can submit a name, email address, optional phone number, and message. The business uses the submission to handle the enquiry.'},
   {title:'Lawful basis and retention',text:'The business must identify and document its lawful basis for each use, its retention period, and any recipients or international transfers before publishing.'},
   {title:'Individual rights',text:'Depending on the circumstances, visitors may have rights of access, correction, deletion, restriction, objection, and portability. The business must provide a working contact method for requests.'},
   {title:'Complaints and changes',text:'Visitors may be able to complain to a relevant data protection authority. The business should identify the authority and update this notice when its processing changes.'},
  ];
  case '/cookie-policy':return [
   {title:'This website',text:`${brief.name} includes a cookie notice and no analytics, advertising, or third-party tracking scripts by default. Node.js and PHP exports include a contact form; static HTML requires an external form service.`},
   {title:'Notice preference',text:`When you close the cookie notice, ${brief.name} saves that choice in your browser's local storage, if available, so the notice stays closed on this site. This is not a cookie. Clear this site's browser storage to show the notice again.`},
   {title:'Cookies and other services',text:'The included website code does not set cookies. Hosting services or later additions such as analytics, advertising, or embedded media may do so. The business must audit those services and update this policy before using them.'},
   {title:'Visitor choices',text:'The notice does not turn tracking on or off because no non-essential tracking is included by default. If that changes, the business must review whether consent controls are required before those tools run.'},
  ];
  case '/business-model':return [
   {title:'Value proposition',text:`Proposed focus: ${brief.description||`${brief.category} services`} for people in ${brief.city}, ${brief.country}. The owner should refine this positioning.`},
   {title:'Potential customers',text:`The draft audience includes people looking for ${brief.category.toLowerCase()} and related services in the area. Confirm the target customer segments.`},
   {title:'Services',text:`The proposed offer includes ${brief.services.join(', ')}. Keep only services the business actually provides.`},
   {title:'Customer journey',text:'Visitors can review the website and, where a contact form is enabled, send an enquiry. The business should define how enquiries become confirmed work or bookings.'},
   {title:'Revenue and operations',text:revenueModelText(brief)},
  ];
 }
}

export function buildRequiredPages(brief:Brief):SitePage[]{return requiredPageSpecs.map(({slug,title})=>{
 const draft=slug==='/business-model'?'Proposed business model — review before using.':'Draft policy — review and complete before publishing.';
 return {id:crypto.randomUUID(),slug,title,objective:`Explain ${title.toLowerCase()} for ${brief.name}`.slice(0,400),seo:{title:`${title} | ${brief.name}`.slice(0,160),description:`Read the draft ${title.toLowerCase()} for ${brief.name}. Review and confirm details before publishing.`.slice(0,320),ogTitle:`${title} | ${brief.name}`.slice(0,160),ogDescription:`Draft ${title.toLowerCase()} for ${brief.name}. Review before publishing.`.slice(0,320)},sections:[{id:`required-${slug.slice(1)}`,type:'features',variant:'features-rows',eyebrow:'For your review',title,body:draft,cta:'',href:'',imageId:'',imageIntent:'',items:fallbackItems(slug,brief).map(item=>({...item,image:'',href:'',factRef:''}))}]};
 });}
