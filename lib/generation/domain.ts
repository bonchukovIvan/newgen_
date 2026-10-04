export function suggestedDomain(name:string):string {
 const label=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,60);
 return label?`${label}.com`:'';
}

export function suggestedBusinessEmail(name:string):string {
 const domain=suggestedDomain(name);
 return domain?`hello@${domain}`:'';
}
