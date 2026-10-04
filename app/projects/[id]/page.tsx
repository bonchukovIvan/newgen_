import {headers} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {auth} from '@/lib/auth';
import {db} from '@/lib/db';
import {Editor} from '@/components/editor/editor';
export default async function ProjectPage({params}:{params:Promise<{id:string}>}){const session=await auth.api.getSession({headers:await headers()});if(!session)redirect('/login');const {id}=await params;if(!await db.project.findFirst({where:{id,userId:session.user.id}}))notFound();return <Editor id={id}/>;}
