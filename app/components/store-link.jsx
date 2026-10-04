'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useDemoNavigation} from './demo-boundary';
// Keep the shared storefront alive. Prefetch only on intent, not every tile.
export default function StoreLink({href,onMouseEnter,onFocus,...props}){
 const [intent,setIntent]=useState(false);
 const demoNavigate=useDemoNavigation();
 if(demoNavigate&&typeof href==='string'&&!href.startsWith('#'))return <a {...props} href={`#demo-${encodeURIComponent(href)}`} onClick={event=>{event.preventDefault();demoNavigate(href);}}/>;
 if(typeof href!=='string'||!href.startsWith('/')||href.startsWith('//'))return <a href={href} onMouseEnter={onMouseEnter} onFocus={onFocus} {...props}/>;
 return <Link href={href} prefetch={intent?null:false} onMouseEnter={event=>{setIntent(true);onMouseEnter?.(event);}} onFocus={event=>{setIntent(true);onFocus?.(event);}} {...props}/>;
}
