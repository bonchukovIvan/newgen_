import {auth} from '@/lib/auth';
import {toNextJsHandler} from 'better-auth/next-js';
import {route,rateLimit,clientIp} from '@/lib/http';
const handler=toNextJsHandler(auth);
export const GET=handler.GET;
export function POST(request:Request){return route(async()=>{await rateLimit('auth:'+clientIp(request),30,60);return handler.POST(request);});}
