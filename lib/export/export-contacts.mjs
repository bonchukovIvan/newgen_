import {DatabaseSync} from 'node:sqlite';
import {existsSync} from 'node:fs';
const file=process.argv[2]||'data/contacts.sqlite';
if(!existsSync(file)){console.error(`Contact database not found: ${file}`);process.exit(1);}
const db=new DatabaseSync(file,{readOnly:true});
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const columns=['id','name','email','phone','message','created_at','webhook_status'];
console.log(columns.map(quote).join(','));
for(const row of db.prepare('SELECT id,name,email,phone,message,created_at,webhook_status FROM contacts ORDER BY id').all())console.log(columns.map(key=>quote(row[key])).join(','));
db.close();
