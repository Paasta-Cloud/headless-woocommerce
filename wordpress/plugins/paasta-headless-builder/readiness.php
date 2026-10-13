<?php
// Read-only configuration evidence, never a guarantee of payment/mail delivery.
if (!defined('ABSPATH')) exit;
function phb_readiness() {
    if (!current_user_can('manage_options') || !current_user_can('manage_woocommerce')) return phb_manager_error('forbidden','دسترسی مدیریت فروشگاه لازم است.',403);
    $woo=function_exists('WC') && function_exists('wc_get_products');
    $front=(string)get_option('khanechin_frontend_url','');
    $parsed=wp_parse_url($front);
    $frontend=is_array($parsed)&&($parsed['scheme']??'')==='https'&&!empty($parsed['host'])&&empty($parsed['user'])&&empty($parsed['pass'])&&empty($parsed['query'])&&empty($parsed['fragment'])&&empty($parsed['port'])&&in_array($parsed['path']??'',array('','/'),true)&&strtolower($parsed['host'])!==strtolower((string)wp_parse_url(home_url('/'),PHP_URL_HOST));
    $gateways=array();
    if($woo)foreach(WC()->payment_gateways()->payment_gateways() as $id=>$gateway)if($gateway->enabled==='yes')$gateways[]=$id;
    $supported=array_intersect($gateways,array('cod','WC_Gateway_Zibal'));
    $shipping=false;
    if(class_exists('WC_Shipping_Zones')){
        $zones=WC_Shipping_Zones::get_zones();
        $shipping=count(WC_Shipping_Zones::get_zone(0)->get_shipping_methods(true))>0;
        foreach($zones as $zone)foreach(($zone['shipping_methods']??array()) as $method)if($method->enabled==='yes')$shipping=true;
    }
    $checks=array(
        'woocommerce'=>$woo?'configured':'blocked',
        'frontend'=>$frontend?'configured':'blocked',
        'account'=>function_exists('khanechin_customer_from_request')?'configured':'blocked',
        'history'=>function_exists('khanechin_customer_orders')?'configured':'blocked',
        'payments'=>count($supported)>0?'configured':'blocked',
        'other_gateways'=>count(array_diff($gateways,array('cod','WC_Gateway_Zibal')))>0?'review':'configured',
        'shipping'=>$shipping?'configured':'review',
        'email'=>'review',
        'domain'=>'review',
        'purchase'=>'review',
        'restore'=>'review',
    );
    return phb_response(array('checks'=>$checks,'checkedAt'=>gmdate('c')));
}
