<?php
namespace Automattic\WooCommerce\StoreApi\Exceptions {class RouteException extends \RuntimeException{function __construct($code,$message,$status){parent::__construct($message,$status);}}}
namespace {
define('ABSPATH',__DIR__);define('HOUR_IN_SECONDS',3600);
$hooks=array();$session=12;$roles=array('customer');
function add_action($name,$callback,$priority=10,$args=1){global $hooks;$hooks[$name]=$callback;}
function add_filter($name,$callback,$priority=10,$args=1){}
function get_transient($key){global $session;return $session;}
function get_user_by($type,$id){global $roles;return (object)array('ID'=>$id,'roles'=>$roles,'display_name'=>'Test','user_email'=>'buyer@example.test');}
function register_rest_route($namespace,$route,$args){global $routes;$routes[$route]=$args;}
function get_user_meta($id,$key,$single){return '';}
function wc_get_order_status_name($status){return $status;}
class OwnedOrder{
 function __construct(public $id,public $owner){}
 function get_id(){return $this->id;}
 function get_meta($key){return $this->owner;}
 function get_status(){return 'processing';}
 function get_total(){return '90';}
 function get_currency(){return 'IRT';}
 function get_date_created(){return null;}
}
function wc_get_orders($query){return isset($query['customer_id'])?array(new OwnedOrder(1,0)):array(new OwnedOrder(2,12),new OwnedOrder(3,99),new OwnedOrder(4,0));}
require __DIR__.'/../wordpress/mu-plugins/khanechin-account.php';
class TestRequest{function __construct(public $header){}function get_header($key){return $this->header;}}
class TestOrder{public $customer=0;function update_meta_data($key,$id){verify($key==='_khanechin_customer_id');$this->customer=$id;}function delete_meta_data($key){$this->customer=0;}}
function verify($value){if(!$value)throw new \RuntimeException('Customer checkout regression');}
$hook=$hooks['woocommerce_store_api_checkout_update_order_from_request'];$order=new TestOrder();
$hook($order,new TestRequest(''));verify($order->customer===0);
$hook($order,new TestRequest('Bearer '.str_repeat('a',64)));verify($order->customer===12);
foreach(array('invalid','expired','administrator') as $case){
 $session=$case==='expired'?false:12;$roles=$case==='administrator'?array('administrator'):array('customer');$order=new TestOrder();
 try{$hook($order,new TestRequest($case==='invalid'?'Bearer invalid':'Bearer '.str_repeat('b',64)));throw new \RuntimeException('Unauthorized customer accepted');}
 catch(\Automattic\WooCommerce\StoreApi\Exceptions\RouteException $error){verify($error->getCode()===401);verify($order->customer===0);}
}
$session=12;$roles=array('customer');$hooks['rest_api_init']();
$result=$routes['/me']['callback'](new TestRequest('Bearer '.str_repeat('a',64)));
verify(array_column($result['orders'],'id')===array(2,1));
define('PAASTA_CONNECTOR_RESPECT_REGISTRATION',true);
$order=new TestOrder();$order->customer=99;
$hook($order,new TestRequest('Basic unrelated'));verify($order->customer===99);
$hook($order,new TestRequest('Bearer third-party-jwt'));verify($order->customer===99);
echo "Checkout binding and unrelated-order isolation passed\n";
}
