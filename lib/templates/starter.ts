import {Brief,Site,Section,briefSchema,effectivePageCount} from '@/lib/validation/site';
import {SectionType,variantFor} from '@/lib/templates/registry';
import {createTheme,designDirection} from '@/lib/templates/themes';
import {businessFromBrief} from '@/lib/generation/facts';
import {buildRequiredPages} from '@/lib/generation/required-pages';
import {suggestedDomain} from '@/lib/generation/domain';
export const demoBrief=briefSchema.parse({name:'NovaForge Esports',category:'Gaming lounge',city:'Manchester',country:'United Kingdom',services:['PC Gaming','Console Gaming','Esports Events','Private Events','Coaching'],style:'Gaming',dark:true,tone:'bold',primary:'#a38aff',pageCount:6,imageStrategy:'mixed',description:'A place for Manchester players to get together, find their next game, and enjoy playing in person.'});
export function newSection(type:SectionType,index=0):Section {return {id:crypto.randomUUID(),type,variant:variantFor(type,index),eyebrow:'',title:type==='cta'?'Tell us what you need':type.charAt(0).toUpperCase()+type.slice(1),body:'',cta:'Get in touch',href:'/contact',imageId:'',imageIntent:'',items:[]};}
function section(type:SectionType,title:string,body:string,seed:number):Section {return {...newSection(type,seed),title,body};}
export type SupplementalType='audience'|'useCases'|'highlights'|'comparison';
export function supplementalSection(type:SupplementalType,b:Brief,seed=0):Section {
 const titles={audience:'Who this is for.',useCases:'Ways to use our services.',highlights:'Explore the options.',comparison:'Compare your options.'};
 const descriptions={audience:'Explore the service topics that match what you are planning.',useCases:'Start with the situation that fits your enquiry.',highlights:'A closer look at the available service topics.',comparison:'Compare the service topics and ask us what each would involve.'};
 const result=section(type,titles[type],descriptions[type],seed);
 result.items=b.services.slice(0,6).map(topic=>({title:topic,text:type==='comparison'?`Ask about the scope, timing, and price of ${topic.toLowerCase()}.`:type==='audience'?`If you are considering ${topic.toLowerCase()}, tell us what you need so we can discuss the options.`:type==='useCases'?`Planning something involving ${topic.toLowerCase()}? Share the details and ask what is possible.`:`Learn more about ${topic.toLowerCase()} and the options available for your plans.`,href:'',image:'',factRef:''}));
 return result;
}
export function starterSite(b:Brief,seed=0):Site {
 seed += [...b.name+b.style].reduce((sum,c)=>sum+c.charCodeAt(0),0);
 const direction=designDirection(b.style,seed);
 const gaming=/gaming|esport/i.test(b.category),business=businessFromBrief(b);
 const count=effectivePageCount(b.size,b.pageCount);
 const articleNames=b.services.map((_,i)=>`Article ${i+1}`);
 const names=b.websiteType==='blog'?['Home','Blog','Contact',...articleNames,'About']:['Home','Services','About','Pricing','Contact',...(gaming?['Events']:['Gallery']),...b.services];
 const unique=count===2?['Home','Contact']:count===3?['Home',b.websiteType==='blog'?'Blog':'Services','Contact']:count===4&&b.websiteType==='business'?['Home','Services','Pricing','Contact']:[...new Set(names)].slice(0,count);
 while(unique.length<count)unique.push(`Service guide ${unique.length-3}`);
 const pages=unique.map((name,i)=>{
  const slug=i===0?'/':'/'+(name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`service-${i}`);
  const hero=section('hero',i===0?(gaming?`PC and console gaming in ${b.city}.`:`${b.category} in ${b.city}.`):name,i===0?(b.description||`${b.name} offers ${b.services.slice(0,3).join(', ')}. Contact us to discuss your plans.`):`${name} at ${b.name} in ${b.city}.`,seed+i);
  hero.imageIntent=`${b.category} ${i===0?'wide environment':'detail of '+name.toLowerCase()}, commercial editorial photography, ${b.style}, no text, no logos`;hero.cta=i===0?(b.websiteType==='blog'?'Read the articles':'Explore our services'):'Get in touch';hero.href=i===0?(b.websiteType==='blog'?(unique.includes('Blog')?'/blog':'#blog-0'):(count<=2?'#services':'/services')):(count===1?'#contact':'/contact');
  const services=section('services',gaming?'Ways to play.':'Our services.',`${b.name} offers ${b.services.slice(0,3).join(', ')}.`,seed+i);
  services.id='services-'+i;services.items=b.services.map(title=>({title,text:`Talk to us about ${title.toLowerCase()} and the options that fit your plans.`,href:count===1?'#contact':'/contact',image:'',factRef:''}));
  const about=section('about',gaming?'Good games. Better company.':`A local approach to ${b.category.toLowerCase()}.`,b.description||`${b.name} brings ${b.services.slice(0,2).join(' and ').toLowerCase()} to ${b.city}. Get in touch to discuss what you need.`,seed+i);
  about.eyebrow='A little about us';about.imageIntent=`${b.category} environment, natural detail, ${b.style}, no logos`;
  const faq=section('faq','A few things you might be wondering.','Start here, or contact us with a specific question.',seed+i);
  faq.items=[{title:'How can I find out more?',text:'Use the contact form to tell us what you have in mind. Include your preferred dates and any questions.',href:'',image:'',factRef:''},{title:'Which services can I ask about?',text:`Ask us about ${b.services.join(', ')}.`,href:'',image:'',factRef:''},{title:'Where are you based?',text:`We are based in ${b.city}, ${b.country}. Contact us for directions before visiting.`,href:'',image:'',factRef:''}];
  const contact=section('contact','Contact us.','Send a message with your question or plans.',seed+i);contact.id='contact-'+i;
  const cta=section('cta','Ask about our services.',`Contact us about ${b.services[0].toLowerCase()}.`,seed+i);cta.href=count===1?'#contact':'/contact';
  const articleIndex=articleNames.indexOf(name);
  if(articleIndex>=0){hero.title=b.services[articleIndex];hero.body=`Read about ${b.services[articleIndex].toLowerCase()} from ${b.name}.`;}
  const articles=section('blog','Latest articles.',`Explore topics in ${b.category.toLowerCase()}.`,seed+i);
  articles.id=`blog-${i}`;
  articles.items=b.services.map((topic,j)=>({title:topic,text:`A closer look at ${topic.toLowerCase()} and what to consider.`,href:unique.includes(articleNames[j])?`/article-${j+1}`:'',image:'',factRef:''})).filter(item=>item.href).slice(0,20);
  if(!articles.items.length)articles.items=b.services.slice(0,3).map(topic=>({title:topic,text:`A closer look at ${topic.toLowerCase()} and what to consider.`,href:'',image:'',factRef:''}));
  const price=section('pricing','Pricing.',b.pricing.some(entry=>entry.suggested)?'Suggested prices for planning. Confirm amounts, scope, and availability before publishing.':'Explore the prices below or ask for a tailored quote.',seed+i);
  price.cta='Ask for a quote';price.href=count===1?'#contact':'/contact';
  price.items=b.pricing.map((x,j)=>({title:x.name,text:business.facts[`pricing-${j}`].value,factRef:`pricing-${j}`,href:count===1?'#contact':'/contact',image:''}));
  const supplemental=supplementalSection((['audience','useCases','highlights','comparison'] as const)[seed%4],b,seed+i);
  let sections=i===0?[hero,services,about,faq,cta]:name==='Services'?[hero,services,cta]:name==='About'?[hero,about,cta]:name==='Contact'?[contact]:name==='FAQ'?[hero,faq,cta]:[hero,services,cta];
  if(b.websiteType==='blog'){
   if(i===0)sections=[hero,articles,about,cta];
   else if(name==='Blog')sections=[hero,articles,cta];
   else if(articleIndex>=0){const article=section('features',b.services[articleIndex],`A guide to ${b.services[articleIndex].toLowerCase()}.`,seed+i);article.items=[{title:'Overview',text:`Learn about ${b.services[articleIndex].toLowerCase()} and the options to discuss.`,image:'',href:'',factRef:''},{title:'Questions to ask',text:`Contact ${b.name} for details about ${b.services[articleIndex].toLowerCase()}.`,image:'',href:'',factRef:''}];sections=[hero,article,cta];}
  }else if(i===0)sections=[hero,services,about,supplemental,price,faq,cta];
  if(name==='Gallery'){const gallery=section('gallery','A closer look.','Illustrative imagery for our services.',seed);gallery.imageIntent=`${b.category} atmosphere and details`;sections=[hero,gallery,cta];}
  if(name==='Pricing')sections=[hero,price,cta];
  if(i===0&&b.testimonials.length){const t=section('testimonials','In their own words.','',seed);t.items=b.testimonials.map((x,j)=>({title:x.name,text:business.facts[`testimonial-${j}`].value,factRef:`testimonial-${j}`,image:'',href:''}));sections.splice(3,0,t);}
  if(name==='About'&&b.team.length){const t=section('team','Meet the people.','',seed);t.items=b.team.map((x,j)=>({title:x.name,text:business.facts[`team-${j}`].value,factRef:`team-${j}`,image:'',href:''}));sections.splice(2,0,t);}
  if(count===1)sections.push(contact);
  const title=(articleIndex>=0?b.services[articleIndex]:name).slice(0,100);
  return {id:crypto.randomUUID(),slug,title,objective:`Help visitors understand ${title.toLowerCase()} and contact the business`,seo:{title:`${name==='Home'?b.category:title} in ${b.city} | ${b.name}`.slice(0,160),description:`Explore ${name==='Home'?b.services.join(', '):title.toLowerCase()} at ${b.name} in ${b.city}. Get in touch to discuss your needs.`.slice(0,320),ogTitle:`${b.name} · ${title}`.slice(0,160),ogDescription:(b.description||`${b.category} in ${b.city}`).slice(0,320)},sections};
 });
 const domain=suggestedDomain(b.name);
 return {schemaVersion:1,language:b.language,business,theme:createTheme(b.style,b.dark,b.primary,seed),navigation:direction.navigation,footer:direction.footer,pages:[...pages,...buildRequiredPages(b)],assets:[],faviconId:'',domain:domain?`https://${domain}`:'',warnings:['Privacy, GDPR, and cookie pages are drafts. Confirm legal details and contact information before publishing.','The suggested domain is unverified. Confirm ownership and configure the matching mailbox before publishing.']};
}
