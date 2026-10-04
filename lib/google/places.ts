import {track} from '@/lib/usage';
import type {Brief} from '@/lib/validation/site';
export interface PlaceResult {id:string;displayName?:{text:string};formattedAddress?:string;nationalPhoneNumber?:string;websiteUri?:string;googleMapsUri?:string;location?:{latitude:number;longitude:number};regularOpeningHours?:{weekdayDescriptions:string[]};rating?:number;userRatingCount?:number;photos?:{name:string;authorAttributions?:{displayName:string;uri:string}[]}[];}
export interface SuggestedPlace {address:string;city:string;country:string;phone:string;}
interface AddressCandidate {formattedAddress?:string;internationalPhoneNumber?:string;nationalPhoneNumber?:string;addressComponents?:{longText:string;types:string[]}[];}
export function chooseSuggestedPlace(places:AddressCandidate[],country:string):SuggestedPlace|null {
 const matches=places.map(place=>{
  const part=(type:string)=>place.addressComponents?.find(component=>component.types.includes(type))?.longText||'';
  return {address:place.formattedAddress||'',city:part('locality')||part('postal_town')||part('administrative_area_level_2'),country:part('country'),phone:place.internationalPhoneNumber||place.nationalPhoneNumber||''};
 }).filter(place=>place.address&&place.city&&place.country.toLocaleLowerCase()===country.trim().toLocaleLowerCase());
 return matches.length?matches[Math.floor(Math.random()*matches.length)]:null;
}
export async function suggestBusinessAddress(category:string,country:string,projectId:string):Promise<SuggestedPlace|null> {
 if(!process.env.GOOGLE_PLACES_API_KEY)return null;
 const response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'X-Goog-Api-Key':process.env.GOOGLE_PLACES_API_KEY,'Content-Type':'application/json','X-Goog-FieldMask':'places.formattedAddress,places.addressComponents,places.internationalPhoneNumber,places.nationalPhoneNumber'},body:JSON.stringify({textQuery:`${category} in ${country}`,pageSize:20}),signal:AbortSignal.timeout(15000)});
 await track(projectId,'google-places','address-suggestion');
 if(!response.ok)throw new Error(`Google Places returned ${response.status}`);
 const data=await response.json() as {places?:AddressCandidate[]};
 return chooseSuggestedPlace(data.places||[],country);
}
export async function lookupPlace(brief:Brief,projectId:string):Promise<PlaceResult|null> {
 if(!process.env.GOOGLE_PLACES_API_KEY)return null;
 const headers={'X-Goog-Api-Key':process.env.GOOGLE_PLACES_API_KEY,'Content-Type':'application/json','X-Goog-FieldMask':'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,googleMapsUri,location,regularOpeningHours,rating,userRatingCount,photos'};
 let id=brief.placeId;
 if(!id&&brief.placeUrl){const url=new URL(brief.placeUrl);id=url.searchParams.get('query_place_id')||url.searchParams.get('place_id')||'';}
 let response:Response;
 if(id){if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('Invalid Google Place ID');response=await fetch(`https://places.googleapis.com/v1/places/${id}`,{headers,signal:AbortSignal.timeout(15000)});}
 else{response=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{...headers,'X-Goog-FieldMask':headers['X-Goog-FieldMask'].split(',').map(x=>'places.'+x).join(',')},body:JSON.stringify({textQuery:[brief.name,brief.address,brief.city,brief.country].filter(Boolean).join(' '),pageSize:1}),signal:AbortSignal.timeout(15000)});}
 await track(projectId,'google-places','lookup');if(!response.ok)throw new Error(`Google Places returned ${response.status}`);
 const data=await response.json();return id?data:data.places?.[0]||null;
}
// Google content is retrieved for review, never persisted or exported as permanent business data.
// An owner can supply independently confirmed facts through the business settings.
export async function googlePhoto(placeId:string,projectId:string):Promise<{url:string;attribution:string}|null>{
 if(!process.env.GOOGLE_PLACES_API_KEY)return null;
 const response=await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,{headers:{'X-Goog-Api-Key':process.env.GOOGLE_PLACES_API_KEY,'X-Goog-FieldMask':'photos'},signal:AbortSignal.timeout(15000)});
 await track(projectId,'google-places','photo');if(!response.ok)return null;const data=await response.json();const photo=data.photos?.[0];if(!photo)return null;
 const media=await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&skipHttpRedirect=true`,{headers:{'X-Goog-Api-Key':process.env.GOOGLE_PLACES_API_KEY},signal:AbortSignal.timeout(15000)});
 if(!media.ok)return null;return {url:(await media.json()).photoUri,attribution:(photo.authorAttributions||[]).map((a:{displayName:string})=>a.displayName).join(', ')};
}
