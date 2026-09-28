'use client';
import { useState } from 'react';
import Icon from './icons';
export default function PasswordInput(props) { const [visible,setVisible]=useState(false); return <span className="password-field"><input {...props} aria-label={props['aria-label'] || (props.name==='confirm'?'تکرار رمز عبور':'رمز عبور')} type={visible?'text':'password'}/><button type="button" aria-label={visible?'پنهان‌کردن رمز عبور':'نمایش رمز عبور'} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Icon name="eye"/></button></span>; }
