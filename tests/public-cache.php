<?php
define('ABSPATH', __DIR__);
$filters=[];$actions=[];$options=[];$transients=[];$_COOKIE=[];
function add_filter($n,$f){global $filters;$filters[$n]=$f;}
function add_action($n,$f){global $actions;$actions[$n]=$f;}
function get_option($n,$d=''){global $options;return $options[$n]??$d;}
function add_option($n,$v){global $options;$options[$n]=$v;}
function update_option($n,$v){global $options;$options[$n]=$v;}
function is_user_logged_in(){return false;}
function get_transient($n){global $transients;return $transients[$n]??false;}
function set_transient($n,$v,$ttl){global $transients;if($ttl!==60)throw new Exception('TTL');$transients[$n]=$v;}
function wp_json_encode($v){return json_encode($v);}
class WP_REST_Response {
 function __construct(public $data,public $status=200,public $headers=[]){}
 function get_status(){return $this->status;}
 function get_headers(){return $this->headers;}
 function get_data(){return $this->data;}
 function header($n,$v){$this->headers[$n]=$v;}
}
class Request {
 function __construct(public $route='/wc/store/v1/products',public $method='GET',public $headers=[],public $params=[]){}
 function get_route(){return $this->route;}
 function get_method(){return $this->method;}
 function get_header($n){return $this->headers[$n]??'';}
 function get_query_params(){return $this->params;}
}
require __DIR__.'/../wordpress/mu-plugins/khanechin-public-cache.php';
function check($ok){if(!$ok)throw new Exception('Cache regression');}
$r=new Request();$pre=$filters['rest_pre_dispatch'];$post=$filters['rest_post_dispatch'];
check($pre(null,null,$r)===null);
$r->params=['category'=>[16]]; // Native REST sanitization happens after pre_dispatch.
$post(new WP_REST_Response(['products'=>[1]]),null,$r);
$r->params=[];
check($pre(null,null,$r)->get_headers()['X-Paasta-Public-Cache']==='HIT');
$before=khc_revision();khc_invalidate();check($before!==khc_revision());check($pre(null,null,$r)===null);
foreach(['/wc/store/v1/cart','/wc/store/v1/checkout','/wc/store/v1/order/1','/paasta-headless/v1/preview/read','/khanechin/v1/me'] as $route)check(khc_key(new Request($route))===null);
foreach(['authorization','cart-token','nonce','x-wp-nonce'] as $header)check(khc_key(new Request(headers:[$header=>'private']))===null);
check(khc_key(new Request(method:'POST'))===null);
check(khc_key(new Request(params:['context'=>'edit']))===null);
check(khc_key(new Request(params:['type'=>'variation','parent'=>'42']))===null);
$_COOKIE=['session'=>'private'];check(khc_key($r)===null);$_COOKIE=[];
$slots=[];for($i=0;$i<1000;$i++)$slots[khc_slot(hash('sha256',(string)$i))]=true;check(count($slots)<=64);
$pre(null,null,$r);$post(new WP_REST_Response(['error'=>1],500),null,$r);check($pre(null,null,$r)===null);
$pre(null,null,$r);$post(new WP_REST_Response(['private'=>1],200,['Set-Cookie'=>'secret']),null,$r);check($pre(null,null,$r)===null);
echo "Public response cache: invalidation, private boundaries, errors and bounds passed\n";
