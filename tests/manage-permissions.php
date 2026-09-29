<?php
define('ABSPATH',__DIR__.'/');
define('DB_NAME','test');
$sessions=array();$users=array();$registered=array();
class WP_Error {public function __construct(public $code,public $message,public $data=array()) {}}
class Request {public function __construct(public $token){} public function get_header($name){return 'Bearer '.$this->token;}}
function add_action($name,$callback){$callback();}
function register_rest_route($namespace,$route,$args){global $registered;$registered[$route]=$args;}
function get_transient($key){global $sessions;return $sessions[$key]??false;}
function set_transient($key,$value,$ttl){global $sessions;$sessions[$key]=$value;}
class TestDB {
 public $prefix='wp_';public $locked=true;public $released=0;
 public function prepare($sql,$lock){check(strlen($lock)<=64);return $sql;}
 public function get_var($sql){if(strpos($sql,'RELEASE_LOCK')!==false){$this->released++;return 1;}return $this->locked?1:0;}
}
function get_user_by($field,$id){global $users;return $users[$id]??false;}
function user_can($user,$cap){return !empty($user->admin);}
function wp_set_current_user($id){}
function check($condition){if(!$condition)throw new RuntimeException('Manager authorization regression');}
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/manage.php';
$token=str_repeat('a',64);$key='phb_manager_'.hash('sha256',$token);$request=new Request($token);
check(phb_manager_permission($request)->data['status']===401);
$users[1]=(object)array('ID'=>1,'user_pass'=>'hash','admin'=>true);
$sessions[$key]=array('id'=>1,'password'=>hash('sha256','hash'));
check(phb_manager_permission($request)===true);
$users[1]->admin=false;check(phb_manager_permission($request)->data['status']===401);
$users[1]->admin=true;$users[1]->user_pass='changed';check(phb_manager_permission($request)->data['status']===401);
$users[1]->user_pass='hash';unset($sessions[$key]);check(phb_manager_permission($request)->data['status']===401);
$sessions['khanechin_session_'.hash('sha256',$token)]=array('id'=>1);check(phb_manager_user($request)===false);
check(phb_manager_user(new Request('invalid'))===false);
foreach($registered as $path=>$route){check($route['methods']==='POST');if($path!=='/manage/login')check($route['permission_callback']==='phb_manager_permission');}
$wpdb=new TestDB();$_SERVER['REMOTE_ADDR']='192.0.2.1';
for($i=0;$i<5;$i++)check(phb_manager_allow_attempt('Admin')===true);
check(phb_manager_allow_attempt('admin')===false);check($wpdb->released===6);
$wpdb->locked=false;check(phb_manager_allow_attempt('another')===false);check($wpdb->released===6);
echo "Manager permission regressions passed\n";
