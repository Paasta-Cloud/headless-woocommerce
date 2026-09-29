'use client';
import './craft-store.css';
import './theme.css';
import './builder.css';
import StoreShell from './components/store-shell';
import ErrorPage from './error';
export default function GlobalError({retry}){return <html lang="fa" dir="rtl"><head><title>خطا در بارگذاری | خانه‌چین</title></head><body><StoreShell mode="unavailable"><ErrorPage retry={retry}/></StoreShell></body></html>;}
