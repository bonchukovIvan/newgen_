import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHmac} from 'node:crypto';
await mkdir('data',{recursive:true});
const db=new DatabaseSync('data/contacts.sqlite');
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, message TEXT, created_at TEXT, webhook_status TEXT); CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER, expires INTEGER)');
const root=path.resolve('public');
const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; img-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'"};
http.createServer(async(req,res)=>{
 function send(status,body,type='text/html; charset=utf-8'){res.writeHead(status,{...headers,'Content-Type':type});res.end(body);}
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='POST'&&url.pathname==='/api/contact'){
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,'Origin not allowed');
   const ip=process.env.TRUST_PROXY==='true'?String(req.headers['x-forwarded-for']||'').split(',')[0]:req.socket.remoteAddress;
   const now=Date.now();const limit=db.prepare('SELECT * FROM limits WHERE key=?').get(ip);
   if(limit&&limit.expires>now&&limit.count>=5)return send(429,'Too many messages. Please try again later.');
   db.prepare('INSERT INTO limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, expires=excluded.expires').run(ip,limit&&limit.expires>now?limit.count+1:1,limit&&limit.expires>now?limit.expires:now+600000);
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16000)return send(413,'Message too large');}
   let data;try{data=req.headers['content-type']?.includes('application/json')?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));}catch{return send(400,'Invalid message');}
   const success=()=>send(200,'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Message received</title><body style="font-family:system-ui;padding:10%"><h1>Thank you for getting in touch.</h1><p>Your message has been received.</p><a href="/">Back to website</a></body></html>');
   if(data.website)return success();
   if(typeof data.name!=='string'||data.name.trim().length<2||data.name.length>100||typeof data.email!=='string'||data.email.length>254||!/^\S+@\S+\.\S+$/.test(data.email)||typeof data.message!=='string'||data.message.trim().length<10||data.message.length>5000||(data.phone&& (typeof data.phone!=='string'||data.phone.length>50)))return send(400,'Please provide a name, valid email and a message of 10–5000 characters.');
   const record={name:data.name,email:data.email,phone:data.phone||'',message:data.message,createdAt:new Date().toISOString()};
   const inserted=db.prepare('INSERT INTO contacts(name,email,phone,message,created_at,webhook_status) VALUES(?,?,?,?,?,?)').run(record.name,record.email,record.phone,record.message,record.createdAt,'stored');
   if(process.env.CONTACT_WEBHOOK_URL){try{const body=JSON.stringify(record);const response=await fetch(process.env.CONTACT_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Axogen-Signature':createHmac('sha256',process.env.CONTACT_WEBHOOK_SECRET||'').update(body).digest('hex')},body,redirect:'error',signal:AbortSignal.timeout(10000)});db.prepare('UPDATE contacts SET webhook_status=? WHERE id=?').run(response.ok?'delivered':'failed',inserted.lastInsertRowid);}catch{db.prepare('UPDATE contacts SET webhook_status=? WHERE id=?').run('failed',inserted.lastInsertRowid);}}
   return success();
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(405,'Method not allowed');
  const pathname=decodeURIComponent(url.pathname);let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep))return send(404,'Not found');
  if(!path.extname(file))file=path.join(file,'index.html');
  const data=await readFile(file);const ext=path.extname(file);send(200,req.method==='HEAD'?'':data,({'.html':'text/html; charset=utf-8','.css':'text/css','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain'})[ext]||'application/octet-stream');
 }catch(error){if(error.code==='ENOENT')send(404,'Page not found');else{console.error(error);send(500,'Unable to complete request');}}
}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Website ready'));
