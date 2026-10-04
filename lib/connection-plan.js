// Planning only. These values are never used to fetch arbitrary URLs or alter DNS.
export function publicHttpsOrigin(value){
  if(typeof value!=='string'||value.length>2048)throw Error('نشانی HTTPS معتبر وارد کنید.');
  let url;
  try{url=new URL(value.trim());}catch{throw Error('نشانی را کامل و با https:// وارد کنید.');}
  const host=url.hostname.toLowerCase().replace(/\.$/,'');
  if(host.length>253||host.split('.').some(label=>!/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/.test(label)))throw Error('نام دامنه معتبر نیست.');
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/'||!host.includes('.')||/^[\d.]+$/.test(host)||host.includes(':')||/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host))throw Error('دامنهٔ عمومی HTTPS را بدون مسیر، پورت یا اطلاعات ورود وارد کنید.');
  url.hostname=host;
  return url.origin;
}

export function buildConnectionPlan({backend,frontend,domain}){
  const backendOrigin=publicHttpsOrigin(backend),frontendOrigin=publicHttpsOrigin(frontend),domainOrigin=publicHttpsOrigin(domain);
  if(backendOrigin===frontendOrigin||backendOrigin===domainOrigin)throw Error('بک‌اند باید نشانی مستقلی داشته باشد؛ دامنه‌ای که به فرانت متصل می‌شود نمی‌تواند نشانی بک‌اند بماند.');
  if(frontendOrigin===domainOrigin)throw Error('برای آزمون پیش از اتصال دامنه، یک نشانی موقت جدا وارد کنید.');
  return {version:1,mode:'external-woocommerce',backend:backendOrigin,temporaryFrontend:frontendOrigin,publicFrontend:domainOrigin,verified:false,
    environment:{WOOCOMMERCE_URL:backendOrigin,STORE_CHECKOUT_ENABLED:'false'},
    steps:[
      {id:'backend',title:'آماده‌سازی بک‌اند مستقل',detail:'روی هاست فعلی، HTTPS و نشانی مستقل بک‌اند را آماده کنید. پیش از تغییر نشانی وردپرس از داده‌ها و تنظیمات نسخهٔ پشتیبان بگیرید؛ محصولات، تصاویر و ورود مدیر را روی نشانی جدید آزمایش کنید.'},
      {id:'connector',title:'نصب و بررسی اتصال',detail:'افزونهٔ صفحه‌ساز و اتصال حساب، سفارش و بازگشت درگاه را مطابق راهنمای همین پروژه نصب کنید. ووکامرس تنها برای ورود مشتری و پرداخت هدلس کافی نیست. رمز و کلید مدیریتی را در تنظیمات عمومی فرانت نگذارید.'},
      {id:'preview',title:'ساخت فرانت روی نشانی موقت',detail:'پروژه را با متغیرهای پیشنهادی مستقر کنید. محصولات و دسته‌ها، ورود و عضویت، کوپن، ارسال و بازگشت موفق و ناموفق درگاه را بررسی کنید. ثبت سفارش تا تأیید این آزمون‌ها خاموش بماند.'},
      {id:'domain',title:'اتصال دامنه پس از آزمون',detail:'دامنه را در پروژهٔ پاستا اضافه کنید و فقط رکورد نمایش‌داده‌شده در همان پنل را اعمال کنید. رکورد قبلی را برای بازگشت نگه دارید؛ MX و رکوردهای ایمیل را حذف نکنید. پس از صدور TLS، نشانی مجاز فرانت و بازگشت درگاه را به‌روز کنید.'},
      {id:'launch',title:'بررسی نهایی و شروع فروش',detail:'مسیرهای قدیمی محصولات و دسته‌ها را به نشانی درست هدایت کنید. یک خرید آزمایشی کامل، حساب مشتری و خالی‌شدن سبد را روی دامنهٔ اصلی بررسی کنید؛ سپس ثبت سفارش را فعال کنید. وردپرس روی هاست فعلی می‌ماند؛ مهاجرت آن مرحله‌ای جداست.'},
    ]};
}
