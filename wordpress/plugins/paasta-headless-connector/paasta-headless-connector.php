<?php
/**
 * Plugin Name: اتصال فروشگاه هدلس پاستا
 * Description: اتصال حساب مشتری، سفارش، بازگشت زیبال و صفحه‌ساز به فرانت مستقل. بدون انتقال محصولات یا تغییر دامنهٔ وردپرس.
 * Version: 1.1.0
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * License: GPL-2.0-or-later
 */
defined('ABSPATH') || exit;
// The release archive places reviewed shared modules under modules/ and builder/.
// Existing MU installations take precedence; never register their hooks twice.
add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) return;
    if(get_option('paasta_connector_enabled')==='yes'){
        if(!defined('PAASTA_CONNECTOR_RESPECT_REGISTRATION'))define('PAASTA_CONNECTOR_RESPECT_REGISTRATION',true);
        foreach (array('khanechin-account.php'=>'khanechin_customer_from_request','khanechin-return.php'=>'khanechin_frontend_url') as $file=>$symbol) {
            if (!function_exists($symbol)) require_once __DIR__.'/modules/'.$file;
        }
    }
    if (!function_exists('phb_register')) require_once __DIR__.'/builder/paasta-headless-builder.php';
}, 30);

function paasta_connector_origin($value) {
    if (!is_string($value) || strlen($value)>500) return '';
    $url=wp_parse_url(trim($value));
    if (!is_array($url) || ($url['scheme']??'')!=='https' || empty($url['host']) || !empty($url['user']) || !empty($url['pass']) || !empty($url['port']) || !empty($url['query']) || !empty($url['fragment']) || !in_array($url['path']??'',array('','/'),true)) return '';
    $host=strtolower(rtrim($url['host'],'.'));
    if (filter_var($host,FILTER_VALIDATE_IP) || strpos($host,'.')===false || !filter_var($host,FILTER_VALIDATE_DOMAIN,FILTER_FLAG_HOSTNAME)) return '';
    return 'https://'.$host;
}

add_action('admin_menu',function(){add_options_page('اتصال هدلس پاستا','اتصال هدلس پاستا','manage_options','paasta-headless-connection','paasta_connector_page');});
function paasta_connector_page(){
    if(!current_user_can('manage_options'))return;
    $notice='';$error='';
    if($_SERVER['REQUEST_METHOD']==='POST'){
        check_admin_referer('paasta_headless_connection');
        $front=paasta_connector_origin(wp_unslash($_POST['frontend']??''));
        if(!class_exists('WooCommerce') || !function_exists('phb_activate'))$error='ابتدا ووکامرس و نسخهٔ کامل افزونهٔ اتصال را فعال کنید.';
        elseif(!$front || $front===paasta_connector_origin(home_url('/'))) $error='نشانی HTTPS فرانت باید با نشانی وردپرس متفاوت باشد.';
        elseif(empty($_POST['confirm']))$error='تغییر مقصد لینک‌های حساب و پرداخت را تأیید کنید.';
        else {
            try {
            // Initialize only after explicit admin consent. Existing documents stay intact.
            $fresh=!get_post((int)get_option('paasta_design_id'));
            phb_activate();
            $post=get_post((int)get_option('paasta_design_id'));
            if($post&&function_exists('phb_parse')){
                $design=phb_parse($post->post_content);$design['settings']['frontendUrl']=$front;
                if($fresh){$design['settings']['name']=get_bloginfo('name');$design['settings']['tagline']=get_bloginfo('description');$design['settings']['announcement']='';$design['settings']['announcementNote']='';$design['settings']['footerText']='';$design['settings']['footerNote']='';$design['sections']=array(array('type'=>'categories','title'=>'دسته‌بندی‌های فروشگاه'),array('type'=>'products','title'=>'محصولات فروشگاه','source'=>'all','limit'=>48,'showFilters'=>true));$design=phb_clean_design($design);}
                $saved=phb_manager_write($design,hash('sha256',$post->post_content));
                if(is_wp_error($saved))$error='طراحی ذخیره نشد؛ نشانی اتصال تغییر نکرده است. صفحه را تازه کنید و دوباره تلاش کنید.';
            }else{$error='سند طراحی ساخته نشد؛ نشانی اتصال تغییر نکرده است. دسترسی پایگاه داده را بررسی کنید.';
            }
            if(!$error){update_option('khanechin_frontend_url',$front,false);if(get_option('khanechin_frontend_url')!==$front){$error='نشانی ذخیره نشد؛ اتصال فعال نشده است. دسترسی پایگاه داده را بررسی کنید.';}else{update_option('paasta_connector_enabled','yes',false);if(get_option('paasta_connector_enabled')!=='yes')$error='فعال‌سازی اتصال تأیید نشد؛ تنظیمات پایگاه داده را بررسی کنید.';else $notice='نشانی فرانت ذخیره شد. پیش از شروع فروش، ورود و هر دو نتیجهٔ پرداخت را آزمایش کنید.';}}
            } catch (Throwable $exception) {$error='ذخیرهٔ اتصال کامل نشد. تنظیمات را بازبینی کنید؛ پیام خطای خصوصی در این صفحه نمایش داده نمی‌شود.';}
        }
    }
    echo '<div class="wrap" dir="rtl"><h1>اتصال فروشگاه هدلس پاستا</h1><p>ووکامرس روی همین هاست می‌ماند. این افزونه DNS، دامنهٔ وردپرس، محصولات و سفارش‌ها را منتقل نمی‌کند.</p>';
    if($notice)echo '<div class="notice notice-success"><p>'.esc_html($notice).'</p></div>';
    if($error)echo '<div class="notice notice-error"><p>'.esc_html($error).'</p></div>';
    echo '<form method="post">';wp_nonce_field('paasta_headless_connection');
    echo '<p><label for="paasta-front">نشانی HTTPS فرانت</label></p><input id="paasta-front" name="frontend" type="url" required maxlength="500" dir="ltr" class="regular-text" value="'.esc_attr(get_option('khanechin_frontend_url','')).'"><p><label><input type="checkbox" name="confirm" value="1" required> تأیید می‌کنم لینک‌های حساب و بازگشت زیبال به این فرانت هدایت شوند.</label></p>';
    submit_button('ذخیرهٔ اتصال');echo '</form><p>پشتیبانی بازگشت پرداخت در این نسخه برای زیبال است؛ سازگاری سایر درگاه‌ها تضمین نمی‌شود. ارسال ایمیل به تنظیمات معتبر ایمیل همین هاست نیاز دارد؛ افزونه ارسال موفق را شبیه‌سازی نمی‌کند.</p></div>';
}
