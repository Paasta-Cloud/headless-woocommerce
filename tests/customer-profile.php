<?php
define('ABSPATH',__DIR__);define('HOUR_IN_SECONDS',3600);define('DB_NAME','fixture');
$routes=[];$roles=['customer'];$session=12;$meta=[];$saves=0;$fail=false;$lock=true;
function add_action($n,$f,$p=10,$a=1){if($n==='rest_api_init')$GLOBALS['init']=$f;}
function add_filter(...$args){}
function register_rest_route($ns,$path,$args){$GLOBALS['routes'][$path]=$args;}
function get_transient($key){return $GLOBALS['session'];}
function get_user_by($type,$id){return (object)['ID'=>$id,'roles'=>$GLOBALS['roles'],'user_email'=>'fixture@example.test'];}
function get_user_meta($id,$field,$single){return $GLOBALS['meta'][$id][$field]??'';}
function wp_json_encode($value){return json_encode($value);}
function sanitize_text_field($value){return strip_tags($value);}
function wp_cache_delete(...$args){}
function wc_get_order_status_name($s){return $s;}
class WP_Error{function __construct(public $code,public $message,public $data){}function get_error_data(){return $this->data;}}
class FixtureDb{public $prefix='fixture_';function prepare($sql,$value){return $sql;}function get_var($sql){return str_contains($sql,'RELEASE_LOCK')?1:($GLOBALS['lock']?1:0);}}
$wpdb=new FixtureDb();
class WC_Customer{public $values=[];function __construct(public $id){}function __call($method,$args){$this->values[substr($method,4)]=$args[0];}function save(){$GLOBALS['saves']++;foreach($this->values as $key=>$v)$GLOBALS['meta'][$this->id][$key]=$v;if($GLOBALS['fail'])throw new RuntimeException('private failure after persisted write');}}
class FixtureRequest{function __construct(public $body=[],public $token=true){}function get_header($n){return $this->token?'Bearer '.str_repeat('a',64):'';}function get_json_params(){return $this->body;}function get_param($k){return $this->body[$k]??null;}}
class FixtureOrder{
 function __construct(public $id,public $native,public $bound=0,public $type='shop_order'){}
 function get_id(){return $this->id;}function get_type(){return $this->type;}function get_customer_id(){return $this->native;}function get_meta($k){return $this->bound;}
 function get_status(){return 'processing';}function get_currency(){return 'IRT';}function get_date_created(){return null;}function get_items(){return [];}
 function __call($method,$args){return str_starts_with($method,'get_billing_')?'historic-address':(str_starts_with($method,'get_shipping_')?'': '90');}
}
function wc_get_order($id){return $GLOBALS['orders'][$id]??false;}
require __DIR__.'/../wordpress/mu-plugins/khanechin-account.php';
$init();
function check($ok){if(!$ok)throw new RuntimeException('Customer profile/order regression');}
function status($r){return $r instanceof WP_Error?$r->data['status']:200;}
$user=get_user_by('id',12);$values=array_fill_keys(KHANECHIN_BILLING_FIELDS,'');$values['first_name']='Test';$values['address_1']='New address';
$meta[12]=['billing_country'=>'IR','billing_address_2'=>'Preserved second line'];
$original=khanechin_customer_billing($user);$body=['values'=>$values,'revision'=>khanechin_billing_revision($original)];
check(status(khanechin_save_customer_profile(new FixtureRequest($body,false)))===401);
$roles=['administrator'];check(status(khanechin_save_customer_profile(new FixtureRequest($body)))===401);$roles=['customer'];
foreach([array_merge($body,['user_id'=>99]),array_merge($body,['values'=>array_merge($values,['email'=>'attack@example.test'])]),array_merge($body,['revision'=>'bad'])] as $bad)check(status(khanechin_save_customer_profile(new FixtureRequest($bad)))===400);
check($saves===0);
$saved=khanechin_save_customer_profile(new FixtureRequest($body));check(status($saved)===200&&$saves===1);check($saved['billing']['country']==='IR'&&$saved['billing']['address_2']==='Preserved second line');check(!isset($meta[99]));
check(status(khanechin_save_customer_profile(new FixtureRequest($body)))===200&&$saves===1); // Same desired values never save twice.
$stale=$body;$stale['values']['city']='Stale city';check(status(khanechin_save_customer_profile(new FixtureRequest($stale)))===409&&$saves===1);
$fresh=['revision'=>$saved['billing_revision'],'values'=>array_merge($values,['city'=>'New city'])];$fail=true;
check(status(khanechin_save_customer_profile(new FixtureRequest($fresh)))===503&&$saves===2);
$fail=false;check(status(khanechin_save_customer_profile(new FixtureRequest($fresh)))===200&&$saves===2); // Write happened, replay reconciles without another native hook.
$lock=false;check(status(khanechin_save_customer_profile(new FixtureRequest($fresh)))===409);$lock=true;
$orders=[1=>new FixtureOrder(1,12),2=>new FixtureOrder(2,0,12),3=>new FixtureOrder(3,99),4=>new FixtureOrder(4,99,12),5=>new FixtureOrder(5,12,99),6=>new FixtureOrder(6,0,0),7=>new FixtureOrder(7,12,0,'shop_order_refund')];
foreach([1,2] as $id){$result=khanechin_customer_order_detail(new FixtureRequest(['id'=>$id]));check(status($result)===200&&$result['id']===$id);check($result['billing']['address_1']==='historic-address');check(!isset($result['order_key'])&&!isset($result['transaction_id']));}
foreach([3,4,5,6,7,999] as $id)check(status(khanechin_customer_order_detail(new FixtureRequest(['id'=>$id])))===404);
foreach(['1',0,1.5,9007199254740992] as $id)check(status(khanechin_customer_order_detail(new FixtureRequest(['id'=>$id])))===400);
check(status(khanechin_customer_order_detail(new FixtureRequest(['id'=>1],false)))===401);
$roles=['administrator'];check(status(khanechin_customer_order_detail(new FixtureRequest(['id'=>1])))===401);
foreach(['/profile','/customer-order'] as $path)check($routes[$path]['methods']==='POST'&&$routes[$path]['permission_callback']==='khanechin_customer_permission');
echo "Customer role, profile conflict/replay and historical order isolation passed\n";
