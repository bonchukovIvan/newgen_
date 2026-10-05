import type {SitePage} from '@/lib/validation/site';

const length=(value:string)=>Array.from(value).length;
const normalize=(value:string)=>value.trim().replace(/\s+/g,' ').toLocaleLowerCase();
const brandCount=(value:string,brand:string)=>{
 const escaped=brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return [...value.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'giu'))].length;
};

export function validateH1(h1:string,brand:string,title?:string):void {
 if(length(h1)<40||length(h1)>60)throw new Error('H1 must be 40–60 characters.');
 if(brandCount(h1,brand))throw new Error('H1 must omit the business name.');
 if(title&&normalize(h1)===normalize(title))throw new Error('H1 must differ from the SEO title.');
}

export function validateSearchMetadata(page:SitePage,brand:string):void {
 const {title,description}=page.seo;
 const h1=page.sections[0].title;
 if(length(title)>80||!title.endsWith(` | ${brand}`))throw new Error(`SEO title must end with " | ${brand}" and be at most 80 characters.`);
 validateH1(h1,brand,title);
 if(length(description)<170||length(description)>180)throw new Error('SEO description must be 170–180 characters.');
 if(brandCount(description,brand)!==1)throw new Error('SEO description must mention the business name exactly once.');
 if(!/^[^.!?。！？]+[.!?。！？]\s+\p{Extended_Pictographic}\uFE0F?\s+[^.!?。！？]+[.!?。！？]$/u.test(description))throw new Error('SEO description must contain two sentences separated by one thematic emoji.');
}
