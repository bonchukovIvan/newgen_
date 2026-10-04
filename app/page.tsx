import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth';
import {Dashboard} from '@/components/dashboard';
import {isMock} from '@/lib/env';
export const dynamic='force-dynamic';
export default async function Home(){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect('/login');return <Dashboard name={session.user.name} mock={isMock()}/>;}
