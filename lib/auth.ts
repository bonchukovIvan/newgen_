import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {db} from '@/lib/db';
export const auth=betterAuth({database:prismaAdapter(db,{provider:'postgresql'}),baseURL:process.env.BETTER_AUTH_URL,secret:process.env.BETTER_AUTH_SECRET,emailAndPassword:{enabled:true,minPasswordLength:12,disableSignUp:process.env.ALLOW_SIGNUP==='false'},rateLimit:{enabled:true,storage:'memory'},advanced:{database:{generateId:()=>crypto.randomUUID()}}});
