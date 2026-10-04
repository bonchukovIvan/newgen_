import {db} from '@/lib/db';
import {createHmac} from 'node:crypto';
import {contactSchema} from '@/lib/validation/site';
export async function submitContact(projectId:string,input:unknown){const data=contactSchema.parse(input);if(data.website)return {ok:true};const record=await db.contactSubmission.create({data:{projectId,name:data.name,email:data.email,phone:data.phone,message:data.message,webhookStatus:process.env.CONTACT_WEBHOOK_URL?'pending':'disabled'}});
 if(process.env.CONTACT_WEBHOOK_URL){try{const body=JSON.stringify(record);const response=await fetch(process.env.CONTACT_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Axogen-Signature':createHmac('sha256',process.env.CONTACT_WEBHOOK_SECRET||'').update(body).digest('hex')},body,signal:AbortSignal.timeout(10000),redirect:'error'});await db.contactSubmission.update({where:{id:record.id},data:{webhookStatus:response.ok?'delivered':'failed'}});}catch{await db.contactSubmission.update({where:{id:record.id},data:{webhookStatus:'failed'}});}}
 return {ok:true};}
