export function suggestedDomain(name:string):string {
 const characters=[...name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')];
 for(let size=Math.min(characters.length,60);size>0;size--){
  try{const host=new URL(`https://${characters.slice(0,size).join('')}.com`).hostname;if(host.split('.')[0].length<=63)return host;}catch{/* Try a shorter label. */}
 }
 const hash=[...name].reduce((value,char)=>(value*31+char.codePointAt(0)!)>>>0,0);
 return `site${hash.toString(36)}.com`;
}

export function siteOrigin(domain:string):string {
 if(!domain)return '';
 try{const url=new URL(domain);return url.protocol==='https:'||url.protocol==='http:'&&url.hostname==='localhost'?url.origin:'';}catch{return '';}
}

export function suggestedBusinessEmail(name:string,siteDomain=''):string {
 let domain=suggestedDomain(name);
 if(siteOrigin(siteDomain)){const host=new URL(siteDomain).hostname;if(host.includes('.'))domain=host;}
 return domain?`hello@${domain}`:'';
}
