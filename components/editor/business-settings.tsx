"use client";
import {useState} from 'react';
import {Brief,briefSchema} from '@/lib/validation/site';
import {api} from '@/lib/client';
export function BusinessSettings({id,brief,onSaved,beforeSave}:{id:string;brief:Brief;onSaved:()=>Promise<void>;beforeSave:()=>Promise<void>}) {
 const[draft,setDraft]=useState(brief),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const field=(key:keyof Brief,value:unknown)=>setDraft(current=>({...current,[key]:value,...(key==='address'?{addressVerified:false}:key==='phone'?{phoneVerified:false}:key==='email'?{emailVerified:false}:{})}));
 return <details className="item-editor"><summary>Edit business information</summary><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await beforeSave();await api('/api/projects/'+id+'/settings',{method:'POST',body:JSON.stringify(briefSchema.parse(draft))});await onSaved();}catch(error){setError(error instanceof Error?error.message:'Unable to save');}finally{setBusy(false);}}}>
 {(['name','category','city','country','address','phone','email','placeId','placeUrl','language','style'] as const).map(key=><label key={key}>{key}<input value={draft[key]} onChange={e=>field(key,e.target.value)}/></label>)}
 <label className="checkbox-label"><input type="checkbox" checked={draft.addressVerified} onChange={e=>field('addressVerified',e.target.checked)}/>I have confirmed this business owns or uses the address above</label>
 {!draft.addressVerified&&draft.address&&<p className="panel-description">This is a real address suggested for the draft. It stays out of the public website until you confirm it.</p>}
 <label className="checkbox-label"><input type="checkbox" checked={draft.phoneVerified} disabled={!draft.phone} onChange={e=>field('phoneVerified',e.target.checked)}/>I have confirmed this business uses the phone number above</label>
 {!draft.phoneVerified&&draft.phone&&<p className="panel-description">This phone number came from Google Places and may belong to another business. It stays off the public website until confirmed.</p>}
 <label className="checkbox-label"><input type="checkbox" checked={draft.emailVerified} disabled={!draft.email||/\.example$/i.test(draft.email)} onChange={e=>field('emailVerified',e.target.checked)}/>I have confirmed this email address works for my business</label>
 {!draft.emailVerified&&draft.email&&<p className="panel-description">Replace the generated .example email with an address on a domain you own, then confirm it.</p>}
 <label>Primary color<input type="color" value={draft.primary} onChange={e=>field('primary',e.target.value)}/></label>
 <label>Color mode<select value={draft.dark?'dark':'light'} onChange={e=>field('dark',e.target.value==='dark')}><option value="light">Light</option><option value="dark">Dark</option></select></label>
 <label>Voice<select value={draft.tone} onChange={e=>field('tone',e.target.value)}>{['professional','friendly','premium','technical','bold','playful','luxury','minimal','authoritative'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Image strategy<select value={draft.imageStrategy} onChange={e=>field('imageStrategy',e.target.value)}>{['mixed','pexels','gpt-image-2','comfyui','google','manual'].map(x=><option key={x}>{x}</option>)}</select></label>
 <label>Target pages<input type="number" min={1} max={20} value={draft.pageCount} onChange={e=>field('pageCount',Number(e.target.value))}/></label>
 <label>Business description<textarea rows={4} value={draft.description} onChange={e=>field('description',e.target.value)}/></label>
 <label>Services, separated by commas<textarea value={draft.services.join(', ')} onChange={e=>field('services',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))}/></label>
 <label>Opening hours<textarea value={draft.facts.hours||''} onChange={e=>field('facts',{...draft.facts,hours:e.target.value})}/></label>
 <label>Testimonials: name | quote, one per line<textarea rows={3} defaultValue={draft.testimonials.map(x=>x.name+' | '+x.quote).join('\n')} onBlur={e=>field('testimonials',e.target.value.split('\n').filter(Boolean).map(line=>{const [name,...quote]=line.split('|');return {name:name.trim(),quote:quote.join('|').trim()};}))}/></label>
 <label>Team: name | role, one per line<textarea rows={3} defaultValue={draft.team.map(x=>x.name+' | '+x.role).join('\n')} onBlur={e=>field('team',e.target.value.split('\n').filter(Boolean).map(line=>{const [name,...role]=line.split('|');return {name:name.trim(),role:role.join('|').trim()};}))}/></label>
 <label>Pricing: name | price | description<textarea rows={3} defaultValue={draft.pricing.map(x=>[x.name,x.price,x.description].join(' | ')).join('\n')} onBlur={e=>field('pricing',e.target.value.split('\n').filter(Boolean).map(line=>{const [name,price,...description]=line.split('|');return {name:name.trim(),price:price?.trim()||'',description:description.join('|').trim()};}))}/></label>
 <p className="panel-description">Only supply information you have independently confirmed. Business facts, language, and colors update the current site. Tone, image strategy, target pages, description, and services guide future generation; regenerate the site to update existing copy or compose new sections.</p>
 {error&&<p role="alert" className="notice error">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Saving…':'Save business details'}</button></form></details>;
}
