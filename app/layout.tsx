import type {Metadata} from 'next';
import './globals.css';
import '@/components/site/site.css';
export const metadata:Metadata={title:{default:'Axogen — your website workspace',template:'%s · Axogen'},description:'Turn a business brief into a thoughtfully designed website.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
