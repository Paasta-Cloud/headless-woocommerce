<?php
/** Native gateway hand-off and signed WordPress customer-session exchange. */
defined('ABSPATH') || exit;

function pnc_cart_session_handler($handler){
    $session='Automattic\\WooCommerce\\StoreApi\\SessionHandler';
    $jwt='Automattic\\WooCommerce\\StoreApi\\Utilities\\JsonWebToken';
    if(!in_array($handler,['WC_Session_Handler',$session],true))return $handler;
    $route=$_GET['rest_route']??'';
    if(!$route){$path=parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH);$prefix='/wp-json';$at=is_string($path)?strpos($path,$prefix.'/'):false;if($at!==false)$route=substr($path,$at+strlen($prefix));}
    if(!is_string($route)||!preg_match('#^/wc/store/v1/(?:cart(?:/[a-z-]+)?|checkout)/?$#D',$route))return $handler;
    $token=$_SERVER['HTTP_CART_TOKEN']??'';
    if(!is_string($token)||strlen($token)>4096||!class_exists($jwt)||!class_exists($session))return $handler;
    try{return $jwt::validate($token,'@'.wp_salt())?$session:$handler;}catch(Throwable $error){return $handler;}
}
// Some themes initialize Woo's cookie session before REST selects its token
// session. Select the *same native class* early, only after core JWT validation.
// Do not replace custom session providers or touch non-Store-API requests.
add_filter('woocommerce_session_handler','pnc_cart_session_handler',PHP_INT_MAX);

function pnc_customer($user) {
    return $user && in_array('customer',(array)$user->roles,true)
        && !array_intersect(['administrator','shop_manager','editor','author','contributor'],(array)$user->roles);
}
function pnc_session_exchange($request) {
    if (khanechin_rate_limited('native_exchange',30,900)) return new WP_Error('rate_limited','کمی بعد دوباره تلاش کنید.',['status'=>429]);
    $cookie=$request->get_param('cookie');
    if (!is_string($cookie) || strlen($cookie)>2048) return new WP_Error('invalid_session','ورود تأیید نشد.',['status'=>401]);
    // Core checks signature, expiry, password fragment and native revocation.
    $id=wp_validate_auth_cookie($cookie,'logged_in');
    $user=$id ? get_user_by('id',$id) : false;
    if (!pnc_customer($user) || '0'===(string)get_user_meta($id,'khanechin_verified',true)) return new WP_Error('invalid_session','ورود تأیید نشد.',['status'=>401]);
    $token=bin2hex(random_bytes(32));
    set_transient('khanechin_session_'.hash('sha256',$token),$id,KHANECHIN_SESSION_TTL);
    return new WP_REST_Response(['token'=>$token,'expires_in'=>KHANECHIN_SESSION_TTL],200,['Cache-Control'=>'no-store']);
}
add_action('rest_api_init',static function(){
    register_rest_route('khanechin/v1','/native-auth-guard',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>static function($request){
        $login=$request->get_param('login');
        if(!is_string($login)||strlen($login)>254||!$login)return new WP_Error('invalid_login','ورود تأیید نشد.',['status'=>401]);
        if(khanechin_rate_limited('native_auth_ip',100,900)||khanechin_rate_limited('native_auth_'.hash('sha256',strtolower($login)),5,900))return new WP_Error('rate_limited','کمی بعد دوباره تلاش کنید.',['status'=>429]);
        return new WP_REST_Response(['ok'=>true],200,['Cache-Control'=>'no-store']);
    }]);
    register_rest_route('khanechin/v1','/native-session',['methods'=>'POST','permission_callback'=>'__return_true','callback'=>'pnc_session_exchange']);
    register_rest_route('khanechin/v1','/commerce',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>static function(){
        $methods=[];
        foreach(WC()->payment_gateways()->payment_gateways() as $id=>$gateway) {
            if($gateway->enabled==='yes' && in_array($id,['cod','WC_ZPal','WC_Gateway_SnappPay','WC_Gateway_Zibal'],true)) $methods[]=['id'=>$id,'title'=>wp_strip_all_tags($gateway->get_title()),'description'=>wp_strip_all_tags($gateway->get_description())];
        }
        return new WP_REST_Response(['methods'=>$methods,'frontend'=>khanechin_frontend_url()],200,['Cache-Control'=>'no-store']);
    }]);
});
function pnc_mark_order($order,$request) {
    $frontend=khanechin_frontend_url();
    if($frontend && hash_equals($frontend,(string)$request->get_header('x-paasta-frontend'))) {
        $order->update_meta_data('_paasta_frontend_origin',$frontend);
        $expected=$request->get_param('expected_total');
        if(!is_string($expected)||!preg_match('/^\d{1,16}$/D',$expected))throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException('paasta_invalid_total','مبلغ نهایی معتبر نیست.',409);
        $GLOBALS['pnc_expected_totals'][$order->get_id()]=$expected;
    }
}
add_action('woocommerce_store_api_checkout_update_order_from_request','pnc_mark_order',20,2);
function pnc_check_total($order){
    if(!isset($GLOBALS['pnc_expected_totals'][$order->get_id()]))return;
    $raw=(string)wc_add_number_precision($order->get_total());
    if($raw!==$GLOBALS['pnc_expected_totals'][$order->get_id()])throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException('paasta_total_changed','مبلغ تغییر کرده است؛ دوباره محاسبه و تأیید کنید.',409);
}
// This native hook runs after final order calculation and before process_payment.
add_action('woocommerce_store_api_checkout_order_processed','pnc_check_total',PHP_INT_MAX);
add_action('woocommerce_store_api_cart_update_customer_from_request',static function($customer,$request){
    $method=$request->get_param('payment_method');if($method===null)return;
    $gateways=WC()->payment_gateways()->get_available_payment_gateways();
    if(!is_string($method)||!isset($gateways[$method]))throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException('paasta_invalid_payment','روش پرداخت در دسترس نیست.',409);
    WC()->session->set('chosen_payment_method',$method);
},20,2);
function pnc_headless_order($order) {
    $frontend=khanechin_frontend_url();
    return $order && $frontend && $order->get_type()==='shop_order' && hash_equals($frontend,(string)$order->get_meta('_paasta_frontend_origin'));
}
add_filter('woocommerce_get_return_url',static function($url,$order){return pnc_headless_order($order) ? khanechin_frontend_url().'/order/'.(int)$order->get_id() : $url;},30,2);
add_filter('wp_redirect',static function($location){
    // Native plugins supply wc_order on their verified callback. This only
    // chooses a receipt page; the frontend still reads the persisted status.
    $id=$_GET['wc_order']??'';
    if(is_string($id)&&ctype_digit($id)&&pnc_headless_order(wc_get_order((int)$id)))$GLOBALS['khanechin_return_order']=(int)$id;
    return $location;
},15);
function pnc_payment_order($id,$key) {
    if(!is_scalar($id) || !ctype_digit((string)$id) || !is_string($key) || !preg_match('/^wc_order_[A-Za-z0-9]{8,64}$/D',$key)) return false;
    $order=wc_get_order((int)$id);
    return pnc_headless_order($order) && $order->needs_payment() && hash_equals($order->get_order_key(),$key) ? $order : false;
}
// Server-to-server POST: ID alone grants nothing; the native order key is required.
add_action('template_redirect',static function(){
    if(!isset($_GET['paasta_payment_start'])) return;
    nocache_headers();
    if(($_SERVER['REQUEST_METHOD']??'')!=='POST') {status_header(405);exit;}
    $order=pnc_payment_order($_POST['order_id']??'',wp_unslash($_POST['key']??''));
    if(!$order) {status_header(404);exit;}
    $expected=$_POST['expected_total']??null;
    if(!is_string($expected)||!preg_match('/^\d{1,16}$/D',$expected)||(string)wc_add_number_precision($order->get_total())!==$expected){status_header(409);exit;}
    $method=$order->get_payment_method();$gateways=WC()->payment_gateways()->payment_gateways();
    if(!in_array($method,['WC_ZPal','WC_Gateway_SnappPay','WC_Gateway_Zibal'],true) || !isset($gateways[$method]) || $gateways[$method]->enabled!=='yes' || !has_action('woocommerce_receipt_'.$method)) {status_header(409);exit;}
    global $wpdb;
    $lock='pnc_'.substr(hash('sha256',DB_NAME.':'.$order->get_id()),0,60);
    if((string)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,0)',$lock))!=='1') {status_header(409);exit;}
    register_shutdown_function(static function()use($wpdb,$lock){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));});
    if($method==='WC_Gateway_SnappPay') $_POST['snapppay_submit']='1';
    ob_start();do_action('woocommerce_receipt_'.$method,$order->get_id());ob_end_clean();
    status_header(502);exit; // No gateway Location: never leak a WordPress page.
},0);
