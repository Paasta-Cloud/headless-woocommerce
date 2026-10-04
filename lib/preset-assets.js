// Public visual reference assets, not imported merchant catalog records.
const digital='https://dina.i-design.ir/wp-content/uploads/';
const grocery='https://dinama.i-design.ir/wp-content/uploads/';
const items=(base,rows)=>rows.map(([title,path])=>({title,image:base+path,href:'/shop'}));
export const presetAssets={
 digital:{
  stories:items(digital,[['انواع ساعت هوشمند','2022/08/1596720292-150x150.jpg'],['وقت تعویض گوشی!','2022/08/d7b9666418c2472d33d5259ff3c3cd58b565f99c_1608382880-150x150.jpg'],['لپ‌تاپ گیمینگ و مهندسی','2019/08/ROG-laptops-2019-1-150x150.jpg'],['تکنولوژی همراه شما','2022/08/107db67cf4631a861b617e40dd8e65cb45076246_1659158460-150x150.jpg'],['نقد و بررسی دوربین','2018/12/1-77-150x150.jpg'],['دنیای تکنولوژی','2019/08/photo_2022-08-20_09-06-51-150x150.jpg'],['هم تبلت هم لپ‌تاپ','2022/08/e04772b559fe04379aa0a06ffccdc8e3adfeeab5_1644845131-150x150.jpg'],['برای محیط کار شما','2025/04/asus-pro-art-150x150.jpg'],['زیبایی در دستان شما','2022/08/b8d88de1f1eb5df9c7135568fbcdbfe96eda9f7f_1653305872-150x150.jpg'],['ظرافت در طراحی','2022/08/d4562492539bdae3b792c6a17c74c7ac0617c05a_1636202896-150x150.jpg'],['دوربین‌های DSLR','2025/04/dslr-camera-150x150.jpg'],['گیمینگ بدون محدودیت','2025/04/Redmi-K50-Gaming-Edition-ss-1-150x150.jpg']]),
  slides:items(digital,[['ساعت هوشمند','2022/08/slide4.jpg'],['مک‌بوک پرو','2022/08/slide2.jpg'],['دوربین‌های DSLR','2022/08/slide3.jpg'],['فروش ویژهٔ گوشی','2022/08/slide1.jpg']]),
  banners:items(digital,[['انواع ساعت هوشمند اپل','2022/08/b4.jpg'],['لپ‌تاپ‌های ایسوس','2022/08/b1.jpg']]),
  categories:items(digital,[['گوشی موبایل','2022/08/phone.jpg'],['لپ‌تاپ','2022/08/laptop.jpg'],['تبلت','2022/08/tablet.jpg'],['ساعت هوشمند','2022/08/smartwatch.jpg'],['دوربین عکاسی','2022/08/camera.jpg'],['پرینتر و اسکنر','2022/08/printer.jpg']]),
  editorial:items(digital,[['نسل تازهٔ خودروهای برقی','2019/09/acura-precision-ev-concept-exterior-front-view-lights-off-300x300.jpg'],['دنیای واقعیت مجازی','2019/08/photo_2022-08-20_09-06-43-910x600-1-300x300.jpg'],['ساعت هوشمند و ورزش','2019/09/photo_2022-08-18_15-44-45-910x600-1-300x300.jpg'],['تازه‌های دوربین موبایل','2019/09/ZFjVGSWJgF6LGRtuAXMMM3-1200-80-910x600-1-300x300.jpg']]),
  brands:items(digital,[['کنون','2019/09/logo7.png'],['لنوو','2019/09/logo6.png'],['ام‌اس‌آی','2019/09/logo5.png'],['سونی','2019/09/logo4.png'],['ایسوس','2019/09/logo3.png'],['اپل','2019/09/logo2.png'],['سامسونگ','2019/09/logo1.png'],['نیکون','2019/09/logo8.png']]),
 },
 grocery:{
  stories:items(grocery,[['انرژی‌بخش لحظات شما','2025/04/story-thumb1-150x150.jpg'],['اسموتی خوشمزه','2025/04/delicious-acai-dessert-with-strawberries-150x150.jpg'],['سالم و ارگانیک','2025/04/story-thumb2-150x150.jpg'],['سوپرمارکت شبانه‌روزی','2025/04/story-thumb9-150x150.jpg'],['صبحانهٔ خوشمزه','2025/04/story-thumb3-150x150.jpg'],['ساندویچ سرد','2025/04/juicy-cheeseburger-rustic-wooden-board-150x150.jpg'],['دریافت سفارش','2025/04/story-thumb7-150x150.jpg'],['کالاهای اساسی و خواربار','2025/04/story-thumb4-150x150.jpg'],['صبحانهٔ سریع','2025/04/boiled-ggs-fruits-vegetables-with-juice-150x150.jpg'],['انتخاب سالم','2025/04/story-thumb5-150x150.jpg'],['سبد خانوار','2025/04/story-thumb6-150x150.jpg'],['روش‌های ارسال','2025/04/story-thumb8-150x150.jpg']]),
  slides:items(grocery,[['تنقلات','2025/04/slider4.jpg'],['صبحانه','2025/04/slider3.jpg'],['انواع نوشیدنی','2025/04/slider2.jpg'],['خواربار','2025/04/slider1.jpg']]),
  banners:items(grocery,[['لوازم بهداشتی','2025/04/ads4.jpg'],['کنسرو و غذای آماده','2025/04/ads3.jpg'],['محصولات لبنی','2025/04/ads2.jpg'],['محصولات پروتئینی','2025/04/ads1.jpg']]),
  wide:items(grocery,[['آجیل و خشکبار','2025/04/adsw1.jpg'],['انواع خرما','2025/04/adsw2.jpg']]),
  secondary:items(grocery,[['انواع عسل','2025/04/adsx4.jpg'],['میوهٔ تازه','2025/04/adsx1.jpg'],['بهداشت خانه','2025/04/adsx2.jpg'],['مادر و کودک','2025/04/adsx3.jpg']]),
  editorial:items(grocery,[['بهترین غذاها برای کاهش کلسترول','2019/09/Best-fat-300x200.jpg'],['کاهش وزن با بذر کتان','2019/08/ac-image-Am1565960955jM-300x200.jpeg'],['روش‌های خشک‌کردن آلبالو','2019/08/web-alo-300x200.png'],['آشنایی با خواص عسل','2019/09/web-honey-300x200.png']]),
  brands:items(grocery,[['بن‌مانو','2021/08/bonmano.png'],['طبیعت','2021/08/tabiaat.png'],['کاله','2021/08/kale.png'],['لادن','2021/08/ladan.png'],['زرماکارون','2021/08/zar.png'],['میهن','2021/08/mihan.png'],['چی‌توز','2021/08/chitoz.png'],['گلستان','2021/08/golestan.png']]),
 }
};
