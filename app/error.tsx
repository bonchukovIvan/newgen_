"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="guide"><h1>Something interrupted your workspace.</h1><p>Please try again. If this continues, check the database connection and application logs.</p><button className="button primary" onClick={reset}>Try again</button></main>;}
