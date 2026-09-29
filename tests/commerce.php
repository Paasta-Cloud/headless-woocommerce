<?php
define('ABSPATH',__DIR__.'/');define('DB_NAME','fixture');
class WP_Error {function __construct(public $code,public $message,public $data=array()){}}
class WP_REST_Request {
 public $params=array();function __construct(public $method='POST',public $path=''){}
 function set_query_params($data){$this->params=$data;}function set_body_params($data){$this->params=$data;}
 function set_header($key,$value){}function set_body($body){$this->params=json_decode($body,true);}
 function get_param($key){return $this->params[$key]??null;}
}
class Reply {
 function __construct(public $data,public $status=200){}
 function is_error(){return $this->status>=400;}function as_error(){return new WP_Error('native_error','Native error',array('status'=>$this->status));}
 function get_data(){return $this->data;}function get_headers(){return array('X-WP-Total'=>1);}
}
$allowed=true;$options=array();$writes=0;$nativeFailure=false;$validationFailure=false;$optionFailure=false;$filters=array();$orderStatus='pending';$record=array('id'=>12,'name'=>'Original','status'=>'pending');
function add_filter($hook,$callback,$priority,$args){global $filters;$filters[$hook]=$callback;}
function remove_filter($hook,$callback,$priority){global $filters;unset($filters[$hook]);}
function current_user_can($cap){global $allowed;return $allowed;}
function get_current_user_id(){return 7;}function wp_json_encode($value){return json_encode($value);}
function wp_kses_post($value){return strip_tags($value);}
function wp_attachment_is_image($id){return $id===5;}
function phb_manager_error($code,$message,$status=400){return new WP_Error($code,$message,array('status'=>$status));}
function phb_response($value){return new Reply($value);}
function get_option($key){global $options;return $options[$key]??false;}
function add_option($key,$value,$ignored='',$autoload='no'){global $options,$optionFailure;if($optionFailure||isset($options[$key]))return false;$options[$key]=$value;return true;}
function update_option($key,$value,$autoload=false){global $options,$optionFailure;if($optionFailure)return false;$options[$key]=$value;return true;}
class DB {public $prefix='wp_';function prepare($sql,$lock){check(strlen($lock)<=64);return $sql;}function get_var($sql){return 1;}}
$wpdb=new DB();
function rest_do_request($request){global $writes,$record,$nativeFailure,$validationFailure,$filters;if($request->method!=='GET'){if($validationFailure)return new Reply(array(),400);if(isset($filters['rest_dispatch_request'])){ $blocked=$filters['rest_dispatch_request'](null,$request);if($blocked)return new Reply(array(),409);}$writes++;if($nativeFailure)return new Reply(array(),500);$record=array_merge($record,$request->params);}return new Reply($record);}
function wc_get_order($id){return new class{function is_paid(){return false;}function get_payment_method(){return 'zibal';}function get_status(){global $orderStatus;return $orderStatus;}};}
function check($value){if(!$value)throw new RuntimeException('Commerce regression failed');}
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/commerce.php';
function request($values){$r=new WP_REST_Request();$r->set_body_params($values);return phb_commerce($r);}
$key='11111111-1111-4111-8111-111111111111';
$create=array('resource'=>'products','verb'=>'create','values'=>array('name'=>'Draft','status'=>'draft'),'operationKey'=>$key);
check(request($create)->data['id']===12);check($writes===1);
check(request($create)->data['replayed']===true);check($writes===1);
$changed=$create;$changed['values']['name']='Other';check(request($changed)->data['status']===409);check($writes===1);
$allowed=false;check(request(array('resource'=>'products'))->data['status']===403);$allowed=true;
foreach(array('../users','customers','refunds') as $resource)check(request(array('resource'=>$resource)) instanceof WP_Error);
check(request(array('resource'=>'products','verb'=>'delete','id'=>12)) instanceof WP_Error);
check(request(array('resource'=>'products','verb'=>'read','id'=>'12/../../users')) instanceof WP_Error);
$unsafe=$create;$unsafe['operationKey']='22222222-2222-4222-8222-222222222222';$unsafe['values']['images']=array(array('src'=>'http://internal/'));
check(request($unsafe)->code==='invalid_images');check($writes===1);
$update=array('resource'=>'products','verb'=>'update','id'=>12,'revision'=>'stale','values'=>array('name'=>'New'),'operationKey'=>'33333333-3333-4333-8333-333333333333');
check(request($update)->code==='conflict');check($writes===1);
$update['revision']=phb_commerce_revision($record);check(request($update)->data['ok']===true);check($writes===2);
$order=$update;$order['resource']='orders';$order['operationKey']='44444444-4444-4444-8444-444444444444';$order['values']=array('status'=>'completed');$order['revision']=phb_commerce_revision($record);
check(request($order)->code==='unpaid');check($writes===2);
$nativeFailure=true;$failed=$create;$failed['operationKey']='55555555-5555-4555-8555-555555555555';
check(request($failed) instanceof WP_Error);check($writes===3);check(request($failed)->code==='uncertain');check($writes===3);
$safe=phb_commerce_public('gateways',array('id'=>'zibal','settings'=>array('merchant'=>array('type'=>'text','value'=>'hidden'),'password'=>array('type'=>'password','value'=>'hidden'),'title'=>array('type'=>'text','value'=>'Title'))));
check($safe['settings']['merchant']['value']==='');check($safe['settings']['password']['value']==='');check($safe['settings']['merchant']['configured']===true);check($safe['settings']['title']['value']==='Title');
$shipping=phb_commerce_public('zone-methods',array('id'=>3,'settings'=>array('api_key'=>array('type'=>'text','value'=>'hidden'),'cost'=>array('type'=>'text','value'=>'25'))));
check($shipping['settings']['api_key']['value']==='');check($shipping['settings']['cost']['value']==='25');
$nativeFailure=false;$validationFailure=true;$invalid=$create;$invalid['operationKey']='66666666-6666-4666-8666-666666666666';
check(request($invalid) instanceof WP_Error);check($writes===3);
check(request(array('resource'=>'products','verb'=>'operation','operationKey'=>$invalid['operationKey']))->data['operation']['status']==='unknown');
$validationFailure=false;check(request($invalid)->data['ok']===true);check($writes===4);
$orderStatus='refunded';$order['values']=array('status'=>'on-hold');$order['revision']=phb_commerce_revision($record);check(request($order)->code==='terminal_order');
check(!isset($filters['rest_dispatch_request']));
check(request(array('resource'=>'locations','verb'=>'read','id'=>0)) instanceof WP_Error);
check(request(array('resource'=>'locations','verb'=>'create','values'=>array('locations'=>array()),'operationKey'=>$key)) instanceof WP_Error);
$locations=array('resource'=>'locations','verb'=>'update','id'=>3,'revision'=>phb_commerce_revision($record),'values'=>array('locations'=>array(array('type'=>'state','code'=>'IR:THR'))),'operationKey'=>'77777777-7777-4777-8777-777777777777');
check(request($locations)->data['ok']===true);
$locations['values']['locations'][0]['code']='http://private/';check(request($locations)->code==='invalid_locations');
$late=$create;$late['operationKey']='88888888-8888-4888-8888-888888888888';$beforeWrites=$writes;
check(request(array('resource'=>'products','verb'=>'resolve','operationKey'=>$late['operationKey']))->data['status']==='abandoned');
check(request($late) instanceof WP_Error);check($writes===$beforeWrites);
check(request(array('resource'=>'products','verb'=>'resolve','operationKey'=>$failed['operationKey']))->code==='manual_review');
check(request(array('resource'=>'products','verb'=>'resolve','operationKey'=>$failed['operationKey'],'acknowledged'=>true))->data['resolved']===true);
check(request($failed) instanceof WP_Error);check($writes===$beforeWrites);
check(!phb_commerce_private_setting('gateways','instructions'));check(phb_commerce_private_setting('gateways','merchant'));
$optionFailure=true;
check(request(array('resource'=>'products','verb'=>'resolve','operationKey'=>'99999999-9999-4999-8999-999999999999'))->data['status']===503);
$optionFailure=false;
echo "Commerce authorization, replay, conflict and gateway-secret checks passed\n";
