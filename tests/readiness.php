<?php
define('ABSPATH',__DIR__);$caps=['manage_options','manage_woocommerce'];$options=[];$gateways=[];$methods=[];
function current_user_can($cap){return in_array($cap,$GLOBALS['caps'],true);}
function phb_manager_error($code,$message,$status){return ['error'=>$code,'status'=>$status];}
function phb_response($data){return $data;}
function get_option($key,$fallback=''){return $GLOBALS['options'][$key]??$fallback;}
function wp_parse_url($url,$part=-1){return parse_url($url,$part);}
function home_url($path){return 'https://backend.example.test/';}
function wc_get_products(){}
function khanechin_customer_from_request(){}
function khanechin_customer_orders(){}
class FixtureWoo{function payment_gateways(){return new class{function payment_gateways(){return $GLOBALS['gateways'];}};}}
function WC(){return new FixtureWoo();}
class WC_Shipping_Zones{static function get_zones(){return [['shipping_methods'=>$GLOBALS['methods']]];}static function get_zone($id){return new class{function get_shipping_methods($enabled){return [];}};}}
function check($value){if(!$value)throw new RuntimeException('Readiness regression');}
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/readiness.php';
foreach([[],['read'],['manage_options'],['manage_woocommerce']] as $role){$caps=$role;check(phb_readiness()['status']===403);}
$caps=['manage_options','manage_woocommerce'];
$result=phb_readiness();check($result['checks']['frontend']==='blocked'&&$result['checks']['payments']==='blocked');
foreach(['http://shop.test','https://backend.example.test','https://user:secret@shop.test','https://shop.test/path','https://shop.test/?secret=x'] as $url){$options['khanechin_frontend_url']=$url;check(phb_readiness()['checks']['frontend']==='blocked');}
$options['khanechin_frontend_url']='https://shop.example.test/';
$gateways=['WC_Gateway_Zibal'=>(object)['enabled'=>'yes','secret'=>'private-merchant'],'other'=>(object)['enabled'=>'no']];
$methods=[(object)['enabled'=>'yes']];
$result=phb_readiness();check($result['checks']['frontend']==='configured'&&$result['checks']['payments']==='configured'&&$result['checks']['shipping']==='configured');
foreach(['email','domain','purchase','restore'] as $key)check($result['checks'][$key]==='review');
check(!str_contains(json_encode($result),'private-merchant')&&!str_contains(json_encode($result),'shop.example.test'));
$gateways['other']->enabled='yes';check(phb_readiness()['checks']['other_gateways']==='review');
echo "Readiness respects actual management capabilities, reports only configuration and exposes no credentials\n";
