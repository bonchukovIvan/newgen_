import {auth} from '../lib/auth';
import {db,json} from '../lib/db';
import {demoBrief} from '../lib/templates/starter';
async function main(){
 const email=process.env.SEED_EMAIL,password=process.env.SEED_PASSWORD;
 if(!email||!password||password.length<12)throw new Error('Set SEED_EMAIL and SEED_PASSWORD (at least 12 characters) before seeding.');
 let user=await db.user.findUnique({where:{email}});
 if(!user){const result=await auth.api.signUpEmail({body:{name:'Demo workspace',email,password}});user=await db.user.findUniqueOrThrow({where:{id:result.user.id}});}
 const existing=await db.project.findFirst({where:{userId:user.id,name:demoBrief.name}});
 if(!existing){await db.project.create({data:{userId:user.id,name:demoBrief.name,brief:json(demoBrief),status:'QUEUED',jobs:{create:{payload:json({scope:'site',force:false})}}}});}
 console.log('NovaForge example queued. Sign in with your configured seed credentials. Start npm run worker to generate it.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
