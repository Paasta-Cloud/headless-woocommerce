'use client';
// Adapted from VibeFarsi's Switch and Badge registry components.
// JSX + scoped CSS replace Tailwind; controlled/uncontrolled and RTL behavior stay intact.
// Sources: https://vibefarsi.ir/r/components/{switch,badge}.json
import {useState} from 'react';

export function Switch({checked,defaultChecked=false,onCheckedChange,className='',...props}){
 const [internal,setInternal]=useState(defaultChecked);
 const controlled=checked!==undefined,on=controlled?checked:internal;
 return <button {...props} type="button" role="switch" aria-checked={on} className={`vf-switch ${className}`} onClick={()=>{if(!controlled)setInternal(!on);onCheckedChange?.(!on);}}><span/></button>;
}
export function Badge({variant='default',className='',...props}){
 return <span {...props} className={`vf-badge vf-badge-${variant} ${className}`}/>;
}
