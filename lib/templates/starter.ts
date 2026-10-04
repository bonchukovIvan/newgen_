import {Brief,Site,Section,briefSchema,effectivePageCount} from '@/lib/validation/site';
import {SectionType,variantFor} from '@/lib/templates/registry';
import {createTheme} from '@/lib/templates/themes';
import {businessFromBrief} from '@/lib/generation/facts';
export const demoBrief=briefSchema.parse({name:'NovaForge Esports',category:'Gaming lounge',city:'Manchester',country:'United Kingdom',services:['PC Gaming','Console Gaming','Esports Events','Private Events','Coaching'],style:'Gaming',dark:true,tone:'bold',primary:'#a38aff',pageCount:6,imageStrategy:'mixed',description:'A place for Manchester players to get together, find their next game, and enjoy playing in person.'});
export function newSection(type:SectionType,index=0):Section {return {id:crypto.randomUUID(),type,variant:variantFor(type,index),eyebrow:'',title:type==='cta'?'Let’s talk about what you need':type.charAt(0).toUpperCase()+type.slice(1),body:'',cta:'Get in touch',href:'/contact',imageId:'',imageIntent:'',items:[]};}
function section(type:SectionType,title:string,body:string,seed:number):Section {return {...newSection(type,seed),title,body};}
export function starterSite(b:Brief,seed=0):Site {
 seed += [...b.name+b.style].reduce((sum,c)=>sum+c.charCodeAt(0),0);
 const gaming=/gaming|esport/i.test(b.category),business=businessFromBrief(b);
 const count=effectivePageCount(b.size,b.pageCount);
 const names=['Home','Services','About','Contact',...(b.pricing.length?['Pricing']:['FAQ']),...(gaming?['Events']:['Gallery']),...b.services];
 const unique=count===2?['Home','Contact']:count===3?['Home','Services','Contact']:[...new Set(names)].slice(0,count);
 while(unique.length<count)unique.push(`Service guide ${unique.length-3}`);
 const pages=unique.map((name,i)=>{
  const slug=i===0?'/':'/'+(name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`service-${i}`);
  const hero=section('hero',i===0?(gaming?'Your next great game starts here.':`${b.category}, with you in mind.`):name,i===0?(b.description||`Explore ${b.services.slice(0,3).join(', ')} in ${b.city}. Tell us what you have in mind.`):`Explore ${name.toLowerCase()} at ${b.name} in ${b.city}.`,seed+i);
  hero.eyebrow=`${b.city} · ${b.category}`;hero.imageIntent=`${b.category} ${i===0?'wide environment':'detail of '+name.toLowerCase()}, commercial editorial photography, ${b.style}, no text, no logos`;hero.cta=i===0?'Explore our services':'Get in touch';hero.href=i===0?(count<=2?'#services':'/services'):(count===1?'#contact':'/contact');
  const services=section('services',gaming?'Find your way to play.':'Built around what you need.',`Explore what ${b.name} has to offer.`,seed+i);
  services.id='services-'+i;services.items=b.services.map(title=>({title,text:`Talk to us about ${title.toLowerCase()} and the options that fit your plans.`,href:count===1?'#contact':'/contact',image:'',factRef:''}));
  const about=section('about',gaming?'Good games. Better company.':`A local approach to ${b.category.toLowerCase()}.`,b.description||`${b.name} brings ${b.services.slice(0,2).join(' and ').toLowerCase()} to ${b.city}. Get in touch to discuss what you need.`,seed+i);
  about.eyebrow='A little about us';about.imageIntent=`${b.category} environment, natural detail, ${b.style}, no logos`;
  const faq=section('faq','A few things you might be wondering.','Start here, or contact us with a specific question.',seed+i);
  faq.items=[{title:'How can I find out more?',text:'Use the contact form to tell us what you have in mind. Include your preferred dates and any questions.',href:'',image:'',factRef:''},{title:'Which services can I ask about?',text:`Ask us about ${b.services.join(', ')}.`,href:'',image:'',factRef:''},{title:'Where are you based?',text:`We are based in ${b.city}, ${b.country}. Contact us for directions before visiting.`,href:'',image:'',factRef:''}];
  const contact=section('contact','Let’s make it happen.','Tell us a little about what you need. We’ll take it from there.',seed+i);contact.id='contact-'+i;
  const cta=section('cta',gaming?'Ready when you are.':'Let’s take the next step.',`Have a question about ${b.services[0].toLowerCase()}? Get in touch.`,seed+i);cta.href=count===1?'#contact':'/contact';
  let sections=i===0?[hero,services,about,faq,cta]:name==='Services'?[hero,services,cta]:name==='About'?[hero,about,cta]:name==='Contact'?[contact]:name==='FAQ'?[hero,faq,cta]:[hero,services,cta];
  if(name==='Gallery'){const gallery=section('gallery','A closer look.','Illustrative imagery for our services.',seed);gallery.imageIntent=`${b.category} atmosphere and details`;sections=[hero,gallery,cta];}
  if(name==='Pricing'){const price=section('pricing','Choose what fits.','Prices supplied by the business.',seed);price.items=b.pricing.map((x,j)=>({title:x.name,text:business.facts[`pricing-${j}`].value,factRef:`pricing-${j}`,href:'/contact',image:''}));sections=[hero,price,cta];}
  if(i===0&&b.testimonials.length){const t=section('testimonials','In their own words.','',seed);t.items=b.testimonials.map((x,j)=>({title:x.name,text:business.facts[`testimonial-${j}`].value,factRef:`testimonial-${j}`,image:'',href:''}));sections.splice(3,0,t);}
  if(name==='About'&&b.team.length){const t=section('team','Meet the people.','',seed);t.items=b.team.map((x,j)=>({title:x.name,text:business.facts[`team-${j}`].value,factRef:`team-${j}`,image:'',href:''}));sections.splice(2,0,t);}
  if(count===1)sections.push(contact);
  return {id:crypto.randomUUID(),slug,title:name,objective:`Help visitors understand ${name.toLowerCase()} and contact the business`,seo:{title:`${name==='Home'?b.category:name} in ${b.city} | ${b.name}`.slice(0,160),description:`Explore ${name==='Home'?b.services.join(', '):name.toLowerCase()} at ${b.name} in ${b.city}. Get in touch to discuss your needs.`.slice(0,320),ogTitle:`${b.name} · ${name}`,ogDescription:(b.description||`${b.category} in ${b.city}`).slice(0,320)},sections};
 });
 return {schemaVersion:1,language:b.language,business,theme:createTheme(b.style,b.dark,b.primary),navigation:gaming?'split':'inline',footer:'columns',pages,assets:[],domain:'',warnings:[]};
}
