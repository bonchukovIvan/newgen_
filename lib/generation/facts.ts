import type { Brief, Fact, Site, Section } from '@/lib/validation/site';
export function businessFromBrief(b:Brief):Site['business'] {
 const facts:Record<string,Fact>={};
 const suppliedFacts={...b.facts};
 delete suppliedFacts.address;delete suppliedFacts.phone;delete suppliedFacts.email;delete suppliedFacts.googleContactName;delete suppliedFacts.generatedContactSample;
 if(!b.addressVerified){delete suppliedFacts.latitude;delete suppliedFacts.longitude;}
 const hasSample=b.autoGenerate&&b.facts.generatedContactSample==='true';
 for(const [key,value] of Object.entries({...suppliedFacts,name:b.name,category:b.category,city:b.city,country:b.country,address:hasSample?b.address:b.addressVerified?b.address:'',phone:hasSample?b.phone:b.phoneVerified?b.phone:'',email:hasSample?b.email:b.emailVerified&&!/\.example$/i.test(b.email)?b.email:''})) if(value){
  const sampleContact=hasSample&&((key==='address'&&!b.addressVerified)||(key==='phone'&&!b.phoneVerified)||(key==='email'&&!b.emailVerified));
  const generated=b.autoGenerate&&(key==='name'||key==='city'||sampleContact);
  const source=sampleContact?(key==='email'?'Generated email placeholder':`Google Places sample: ${b.facts.googleContactName||'local venue'}`):generated?'AI generated draft':'business owner';
  facts[key]={value,source:source.slice(0,100),classification:generated?'AI_GENERATED':'USER_PROVIDED'};
 }
 b.testimonials.forEach((x,i)=>facts[`testimonial-${i}`]={value:`${x.quote} — ${x.name}`,source:'business owner',classification:'USER_PROVIDED'});
 b.team.forEach((x,i)=>facts[`team-${i}`]={value:`${x.name} — ${x.role}`,source:'business owner',classification:'USER_PROVIDED'});
 b.pricing.forEach((x,i)=>facts[`pricing-${i}`]={value:`${x.name}: ${x.price}. ${x.description}`,source:'business owner',classification:'USER_PROVIDED'});
 return {name:b.name,category:b.category,city:b.city,country:b.country,facts};
}
export function briefForPublication(b:Brief):Brief{const facts={...b.facts};delete facts.googleContactName;delete facts.generatedContactSample;if(!b.addressVerified){delete facts.address;delete facts.latitude;delete facts.longitude;}if(!b.phoneVerified)delete facts.phone;return {...b,address:b.addressVerified?b.address:'',phone:b.phoneVerified?b.phone:'',email:b.emailVerified&&!/\.example$/i.test(b.email)?b.email:'',placeId:b.addressVerified?b.placeId:'',placeUrl:b.addressVerified?b.placeUrl:'',facts};}
export function protectFacts(original:Site['business'],candidate:Site['business']) {
 return {...candidate,...original,facts:{...original.facts}};
}
const restricted=['trustStats','team','testimonials','pricing','logos'];
export function validateEvidence(section:Section,business:Site['business']) {
 if(restricted.includes(section.type)) {
  if(!section.items.length)throw new Error(`${section.type} requires supplied facts`);
  for(const item of section.items) {const fact=business.facts[item.factRef];if(!fact||fact.classification==='AI_GENERATED'||item.text!==fact.value||!fact.value.includes(item.title))throw new Error(`${section.type} contains an unsupported claim`);}
 }
}
export function checkGeneratedCopy(section:Section,business:Site['business']) {
 validateEvidence(section,business);
 const copy=[section.title,section.body,...section.items.flatMap(x=>[x.title,x.text])].join(' ');
 const assertions=/\b(?:award[- ]winning|certified|guaranteed|best in|number one|#1|founded in|established in|since \d{4}|\d[\d,.+]*\s*(?:years|customers|clients|projects|stars|employees|locations|%))\b/ig;
 const known=Object.values(business.facts).filter(f=>f.classification!=='AI_GENERATED').map(f=>f.value.toLowerCase()).join(' ');
 for(const claim of copy.match(assertions)||[])if(!known.includes(claim.toLowerCase()))throw new Error(`Unsupported factual claim: ${claim}`);
}
export function enforceSite(site:Site,original?:Site):Site {
 if(original)site.business=protectFacts(original.business,site.business);
 for(const page of site.pages)for(const section of page.sections)validateEvidence(section,site.business);
 return site;
}
