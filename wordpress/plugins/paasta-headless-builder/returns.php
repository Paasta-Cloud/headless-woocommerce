<?php
// A review case is not a WooCommerce refund. This module never transfers money,
// changes order/payment status, sends mail, or restores stock.
if (!defined('ABSPATH')) exit;

function phb_return_customer($request) {
    $user=function_exists('khanechin_customer_from_request')?khanechin_customer_from_request($request):null;
    return $user&&in_array('customer',(array)$user->roles,true)
        &&!array_diff((array)$user->roles,array('customer','subscriber'))
        &&!user_can($user,'manage_woocommerce')&&!user_can($user,'manage_options')?$user:null;
}
function phb_return_customer_permission($request) {
    return phb_return_customer($request)?true:phb_manager_error('unauthorized','برای پیگیری مرجوعی وارد حساب مشتری شوید.',401);
}
function phb_return_view($order,$record,$manager) {
    $public=$record?array_intersect_key($record,array_flip(array('status','reason','createdAt','decisionAt','note'))):null;
    return phb_response(array('case'=>$public,'revision'=>hash('sha256',wp_json_encode($record)),
        'canRequest'=>!$record&&in_array($order->get_status(),array('processing','completed'),true),
        'canDecide'=>$manager&&($record['status']??'')==='requested',
        'automaticRefund'=>false));
}
function phb_returns($request,$manager=false) {
    try{return phb_returns_inner($request,$manager);}
    catch(Throwable $error){return phb_manager_error('unavailable','پیگیری مرجوعی در دسترس نیست؛ نتیجه را دوباره بخوانید.',503);}
}
function phb_returns_inner($request,$manager=false) {
    $customer=null;
    if($manager){
        if(!current_user_can('manage_options')||!current_user_can('manage_woocommerce')||!current_user_can('edit_shop_orders'))return phb_manager_error('forbidden','تأیید مرجوعی فقط برای مدیر مجاز سفارش‌هاست.',403);
    }else{
        $customer=phb_return_customer($request);
        if(!$customer)return phb_return_customer_permission($request);
    }
    $body=$request->get_json_params();
    if(!is_array($body)||array_diff(array_keys($body),array('verb','orderId','operationKey','reason','decision','note','revision','confirmed')))
        return phb_manager_error('invalid_request','اطلاعات درخواست معتبر نیست.');
    $verb=$body['verb']??'read';$id=$body['orderId']??null;
    if(!is_int($id)||$id<1||$id>2147483647||!in_array($verb,$manager?array('read','decide'):array('read','request'),true))return phb_manager_error('invalid_request','عملیات درخواست معتبر نیست.');
    $allowed=$verb==='read'?array('verb','orderId'):($manager?array('verb','orderId','operationKey','decision','note','revision','confirmed'):array('verb','orderId','operationKey','reason','confirmed'));
    if(array_diff(array_keys($body),$allowed))return phb_manager_error('invalid_request','فیلدهای درخواست معتبر نیستند.');
    $order=function_exists('wc_get_order')?wc_get_order($id):null;
    if(!$order||$order->get_type()!=='shop_order'||(!$manager&&(!function_exists('khanechin_customer_owns_order')||!khanechin_customer_owns_order($order,$customer->ID))))return phb_manager_error('not_found','این سفارش در دسترس نیست.',404);
    $existing=$order->get_meta('_paasta_return_case')?:null;
    if(!$manager&&$existing&&($existing['customer']??0)!==$customer->ID)return phb_manager_error('not_found','این پرونده در حساب شما در دسترس نیست.',404);
    if($verb==='read')return phb_return_view($order,$existing,$manager);
    $key=$body['operationKey']??'';
    if(!is_string($key)||!preg_match('/^[a-f0-9-]{36}$/D',$key)||($body['confirmed']??false)!==true)return phb_manager_error('confirmation_required','ابتدا درخواست و پیام تأیید را بررسی کنید.');
    $text=$body[$manager?'note':'reason']??'';
    if(!is_string($text)||strlen($text)>8000||preg_match_all('/./us',$text)>1000||!trim(sanitize_textarea_field($text)))return phb_manager_error('invalid_text','توضیحی بین ۱ تا ۱۰۰۰ نویسه بنویسید.');
    $text=sanitize_textarea_field($text);
    if($manager&&(!in_array($body['decision']??'',array('approved','rejected'),true)||!is_string($body['revision']??null)))return phb_manager_error('invalid_decision','نتیجهٔ بررسی معتبر نیست.');
    $actor=$manager?get_current_user_id():$customer->ID;
    $fingerprint=hash('sha256',wp_json_encode(array($actor,$verb,$id,$text,$body['decision']??null)));
    // Different administrators and operation keys still serialize on this order.
    global $wpdb;$lock='phb-return:'.substr(hash('sha256',DB_NAME.':'.$wpdb->prefix.':'.$id),0,50);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,3)',$lock))!==1)return phb_manager_error('busy','درخواست دیگری در حال ثبت است؛ ابتدا نتیجه را دوباره بخوانید.',409);
    try {
        $order=wc_get_order($id);$order->read_meta_data(true);
        if(!$manager&&!khanechin_customer_owns_order($order,$customer->ID))return phb_manager_error('not_found','این سفارش در دسترس نیست.',404);
        $record=$order->get_meta('_paasta_return_case')?:null;
        if(!$manager&&$record&&($record['customer']??0)!==$customer->ID)return phb_manager_error('not_found','این پرونده در حساب شما در دسترس نیست.',404);
        $keyField=$manager?'decisionKey':'requestKey';$fingerprintField=$manager?'decisionFingerprint':'requestFingerprint';
        if($record&&($record[$keyField]??'')===$key){
            if(($record[$fingerprintField]??'')!==$fingerprint)return phb_manager_error('reused_key','این شناسه برای درخواست دیگری استفاده شده است.',409);
            return phb_return_view($order,$record,$manager);
        }
        if(!$manager){
            if($record)return phb_manager_error('exists','برای این سفارش درخواست ثبت شده است؛ نتیجه را دوباره بخوانید.',409);
            if(!in_array($order->get_status(),array('processing','completed'),true))return phb_manager_error('ineligible','ثبت درخواست برای وضعیت فعلی این سفارش در دسترس نیست.',409);
            $record=array('status'=>'requested','reason'=>$text,'createdAt'=>gmdate('c'),'customer'=>$actor,'requestKey'=>$key,'requestFingerprint'=>$fingerprint);
        }else{
            if(!$record||$record['status']!=='requested'||!hash_equals(hash('sha256',wp_json_encode($record)),$body['revision']))return phb_manager_error('conflict','درخواست تغییر کرده است؛ پیش از تصمیم‌گیری نتیجه را دوباره بخوانید.',409);
            $record=array_merge($record,array('status'=>$body['decision'],'note'=>$text,'decisionAt'=>gmdate('c'),'manager'=>$actor,'decisionKey'=>$key,'decisionFingerprint'=>$fingerprint));
        }
        $order->update_meta_data('_paasta_return_case',$record);
        $order->save_meta_data();
        $order->read_meta_data(true);
        if($order->get_meta('_paasta_return_case')!==$record)return phb_manager_error('uncertain','ثبت قطعی تأیید نشد؛ پیش از تکرار، نتیجه را دوباره بخوانید.',503);
        return phb_return_view($order,$record,$manager);
    }catch(Throwable $error){return phb_manager_error('uncertain','نتیجهٔ ثبت مشخص نیست؛ پیش از تکرار، نتیجه را دوباره بخوانید.',503);}
    finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
}
add_action('rest_api_init',function(){
    register_rest_route('khanechin/v1','/customer-return',array('methods'=>'POST','permission_callback'=>'phb_return_customer_permission','callback'=>function($request){return phb_returns($request);}));
});
