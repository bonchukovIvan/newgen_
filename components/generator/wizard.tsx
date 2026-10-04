"use client";
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Loader2,Sparkles,X} from 'lucide-react';
import {NewProjectInput,newProjectSchema,effectivePageCount} from '@/lib/validation/site';
import {api} from '@/lib/client';

const defaults:NewProjectInput=newProjectSchema.parse({category:'Local services',country:'United Kingdom'});
const languages=['English','French','German','Spanish','Italian','Portuguese','Ukrainian','Polish','Dutch','Japanese','Arabic'];

export function Wizard({onClose,onCreated}:{onClose:()=>void;onCreated:(id:string)=>void}){
 const[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const{register,handleSubmit,setValue,watch}=useForm<NewProjectInput>({defaultValues:{...defaults,category:''}});
 const size=watch('size');
 async function generate(values:NewProjectInput){
  setError('');setBusy(true);
  try{const data=newProjectSchema.parse(values);const project=await api<{id:string}>('/api/projects',{method:'POST',body:JSON.stringify(data)});onCreated(project.id);}
  catch(e){setError(e instanceof Error?e.message:'Could not create project');}
  finally{setBusy(false);}
 }
 return <div className="modal-backdrop"><section className="wizard wizard-single" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
  <form className="wizard-content" onSubmit={handleSubmit(generate)}>
   <button type="button" className="icon-button wizard-close" onClick={onClose} aria-label="Close creation form"><X size={20}/></button>
   <p className="eyebrow">A NEW BEGINNING</p><h2 id="wizard-title">Create your website</h2>
   <p className="muted">Tell us the industry, location, and size. AI will build the business details, design, copy, and images.</p>
   <div className="wizard-fields">
    <div className="field-row"><label>Industry / category<input {...register('category',{required:true,minLength:2})} placeholder="e.g. Gaming lounge" autoFocus/></label><label>Country<input {...register('country',{required:true})} placeholder="United Kingdom"/></label></div>
    <div className="field-row"><label>Website size<select {...register('size',{onChange:e=>{const next=e.target.value;if(next==='Landing page')setValue('pageCount',1);else if(next==='Small site')setValue('pageCount',3);else if(next==='Large')setValue('pageCount',Math.max(8,watch('pageCount')||8));}})}><option>Landing page</option><option>Small site</option><option>Standard</option><option>Large</option><option>Custom</option></select></label>
     {size!=='Landing page'&&size!=='Small site'&&<label>Number of pages<input type="number" min={size==='Large'?8:1} max={20} {...register('pageCount',{valueAsNumber:true,min:size==='Large'?8:1,max:20})}/></label>}
    </div>
    <p className="muted">{size==='Landing page'?'One page with services and a contact form.':size==='Small site'?'Three pages: Home, Services, and Contact.':size==='Large'?'At least eight separate pages.':`The site will have ${effectivePageCount(size||'Standard',watch('pageCount')||5)} separate pages.`}</p>
    <label>Website language<select {...register('language')}>{languages.map(language=><option key={language}>{language}</option>)}</select></label>
    <div className="notice"><Sparkles size={18}/><span>AI will choose the colors, fonts, layouts, imagery, name, services, and voice. Review generated business facts before publishing.</span></div>
   </div>
   {error&&<p className="notice error" role="alert">{error}</p>}
   <div className="wizard-footer"><button type="button" className="button ghost" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={busy}>{busy?<Loader2 className="spin" size={16}/>:<Sparkles size={16}/>} {busy?'Creating project…':'Generate website'}</button></div>
  </form>
 </section></div>;
}
