import {db} from '../lib/db';
import {processJob} from '../lib/generation/pipeline';
import {validateEnv} from '../lib/env';
import {randomUUID} from 'node:crypto';
validateEnv();const owner=randomUUID();let running=true;
process.on('SIGTERM',()=>{running=false;});process.on('SIGINT',()=>{running=false;});
async function main(){console.log('Axogen generation worker ready');while(running){try{
 const jobs=await db.$queryRaw<{id:string}[]>`UPDATE "GenerationJob" SET "status"='RUNNING',"leaseOwner"=${owner},"leaseUntil"=NOW()+INTERVAL '2 minutes',"attempts"="attempts"+1 WHERE "id"=(SELECT "id" FROM "GenerationJob" WHERE "status"='QUEUED' OR ("status"='RUNNING' AND "leaseUntil"<NOW()) ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING "id"`;
 if(jobs[0]){const heartbeat=setInterval(()=>{void db.generationJob.updateMany({where:{id:jobs[0].id,leaseOwner:owner,status:'RUNNING'},data:{leaseUntil:new Date(Date.now()+120000)}}).catch(console.error);},20000);try{await processJob(jobs[0].id,owner);}finally{clearInterval(heartbeat);}}
 else await new Promise(r=>setTimeout(r,1500));
 }catch(error){console.error('Worker error',error);await new Promise(r=>setTimeout(r,3000));}}
 await db.$disconnect();}
void main();
