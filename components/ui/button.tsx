import {Slot} from '@radix-ui/react-slot';
import {clsx} from 'clsx';
import type {ButtonHTMLAttributes} from 'react';
export function Button({asChild=false,className,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{asChild?:boolean}){const Comp=asChild?Slot:'button';return <Comp className={clsx('button',className)} {...props}/>;}
