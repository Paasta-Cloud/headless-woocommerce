<?php
namespace Automattic\WooCommerce\StoreApi\Exceptions {class RouteException extends \RuntimeException{function __construct($code,$message,$status){parent::__construct($message,$status);}}}
namespace {
define('ABSPATH',__DIR__);define('KHANECHIN_SESSION_TTL',43200);
$actions=[];$filters=[];$routes=[];$limited=false;$roles=['customer'];$signed=true;$issued=[];$verified='';
function add_action($name,$callback,...$rest){$GLOBALS['actions'][$name]=$callback;}
function add_filter($name,$callback,...$rest){$GLOBALS['filters'][$name]=$callback;}
function register_rest_route($ns,$path,$config){$GLOBALS['routes'][$path]=$config;}
function khanechin_rate_limited(...$args){return $GLOBALS['limited'];}
function wp_validate_auth_cookie($cookie,$scheme){if($scheme!=='logged_in')throw new Exception('Wrong cookie scheme');return $GLOBALS['signed']&&$cookie==='signed-native-cookie'?12:false;}
function get_user_by($field,$id){return (object)['ID'=>$id,'roles'=>$GLOBALS['roles']];}
function get_user_meta(...$args){return $GLOBALS['verified'];}
function set_transient($key,$value,$ttl){$GLOBALS['issued'][$key]=$value;}
function khanechin_frontend_url(){return 'https://front.example.test';}
function wc_get_order($id){return $GLOBALS['orders'][$id]??false;}
function wp_strip_all_tags($value){return strip_tags($value);}
function wc_add_number_precision($value){return (int)$value;}
class WP_Error {function __construct(public $code,public $message,public $data){}}
class WP_REST_Response {function __construct(public $data,public $status,public $headers){}}
class NativeRequest {function __construct(public $body=[]){}function get_param($name){return $this->body[$name]??null;}function get_header($name){return $this->body[$name]??'';}}
class NativeOrder {
 public $meta=[];public $paid=false;
 function get_type(){return 'shop_order';}function get_id(){return 7;}function get_total(){return '100';}function get_order_key(){return 'wc_order_123456789';}function needs_payment(){return !$this->paid;}
 function update_meta_data($name,$value){$this->meta[$name]=$value;}function get_meta($name){return $this->meta[$name]??'';}
}
require __DIR__.'/../wordpress/mu-plugins/paasta-native-commerce.php';
$actions['rest_api_init']();
function check_native($ok){if(!$ok)throw new RuntimeException('Native commerce regression');}
$request=new NativeRequest(['cookie'=>'signed-native-cookie']);
check_native(pnc_session_exchange(new NativeRequest(['cookie'=>'forged'])) instanceof WP_Error);
foreach([['administrator'],['shop_manager'],['customer','administrator'],['subscriber']] as $role){$roles=$role;check_native(pnc_session_exchange($request) instanceof WP_Error);}
check_native(count($issued)===0);$roles=['customer'];$signed=false;check_native(pnc_session_exchange($request) instanceof WP_Error);$signed=true;
$limited=true;check_native(pnc_session_exchange($request)->data['status']===429);$limited=false;
$verified='0';check_native(pnc_session_exchange($request) instanceof WP_Error);$verified='';
$result=pnc_session_exchange($request);check_native($result->status===200&&preg_match('/^[a-f0-9]{64}$/',$result->data['token'])&&count($issued)===1&&$result->headers['Cache-Control']==='no-store');
$orders=[7=>new NativeOrder()];$order=$orders[7];
check_native(!pnc_payment_order(7,'wc_order_123456789'));
pnc_mark_order($order,new NativeRequest(['x-paasta-frontend'=>'https://evil.test']));check_native(!$order->meta);
pnc_mark_order($order,new NativeRequest(['x-paasta-frontend'=>'https://front.example.test','expected_total'=>'100']));
pnc_check_total($order);$GLOBALS['pnc_expected_totals'][7]='101';
$rejected=false;try{pnc_check_total($order);}catch(\Automattic\WooCommerce\StoreApi\Exceptions\RouteException $error){$rejected=$error->getCode()===409;}
check_native($rejected);$GLOBALS['pnc_expected_totals'][7]='100';
check_native(pnc_payment_order(7,'wc_order_123456789')===$order);check_native(!pnc_payment_order(7,'wc_order_invalid123'));check_native(!pnc_payment_order(8,'wc_order_123456789'));
$order->paid=true;check_native(!pnc_payment_order(7,'wc_order_123456789'));
check_native($filters['woocommerce_get_return_url']('https://backend.test/checkout',$order)==='https://front.example.test/order/7');
echo "Native signed customer session, role isolation, order-key and persisted-return checks passed\n";
}
