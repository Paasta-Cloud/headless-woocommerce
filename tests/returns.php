<?php
// Reuse real customer-token/role/ownership functions, not a privileged bypass.
require __DIR__.'/customer-profile.php';
function phb_manager_error($code,$message,$status=400){return new WP_Error($code,$message,['status'=>$status]);}
function phb_response($data){return $data;}
function sanitize_textarea_field($text){return strip_tags($text);}
function user_can($user,$cap){return in_array('administrator',$user->roles,true);}
function current_user_can($cap){return in_array($cap,$GLOBALS['caps'],true);}
function get_current_user_id(){return 27;}
class ReturnOrder extends FixtureOrder {
 public $working=null;public $state='completed';
 function get_status(){return $this->state;}
 function get_meta($key){return $key==='_paasta_return_case'?$this->working:parent::get_meta($key);}
 function update_meta_data($key,$value){check($key==='_paasta_return_case');$this->working=$value;}
 function save_meta_data(){$GLOBALS['returnWrites']++;$GLOBALS['returnDb'][$this->id]=$this->working;if($GLOBALS['uncertainWrite'])throw new RuntimeException('private storage details');}
 function read_meta_data($force){check($force===true);$this->working=$GLOBALS['returnDb'][$this->id]??null;}
 function __call($method,$args){throw new RuntimeException('Unexpected order mutation: '.$method);}
}
$roles=['customer'];$caps=[];$returnDb=[];$returnWrites=0;$uncertainWrite=false;
$orders=[1=>new ReturnOrder(1,12),2=>new ReturnOrder(2,0,12),3=>new ReturnOrder(3,99),4=>new ReturnOrder(4,99,12),5=>new ReturnOrder(5,12,99),6=>new ReturnOrder(6,12,0,'shop_order_refund')];
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/returns.php';$init();
function returns($body,$manager=false,$token=true){return phb_returns(new FixtureRequest($body,$token),$manager);}
$read=['verb'=>'read','orderId'=>1];
check(status(returns($read,false,false))===401);
foreach([3,4,5,6,99] as $id)check(status(returns(['verb'=>'read','orderId'=>$id]))===404);
foreach([['administrator'],['customer','administrator']] as $role){$roles=$role;check(status(returns($read))===401);}
$roles=['customer'];check(returns($read)['canRequest']===true);
$request=['verb'=>'request','orderId'=>1,'reason'=>'Fixture reason','operationKey'=>'11111111-1111-4111-8111-111111111111','confirmed'=>true];
check(status(returns(array_merge($request,['confirmed'=>false])))===400);
check(status(returns(array_merge($request,['decision'=>'approved'])))===400);
check(status(returns(array_merge($request,['amount'=>'1'])))===400);
check(status(returns(array_merge($request,['reason'=>str_repeat('x',1001)])))===400);
$lock=false;check(status(returns($request))===409);$lock=true;check($returnWrites===0);
$saved=returns($request);check($saved['case']['status']==='requested'&&$saved['automaticRefund']===false&&$returnWrites===1);
check(!isset($saved['case']['customer'])&&!isset($saved['case']['requestKey']));
check(returns($request)===$saved&&$returnWrites===1);
check(status(returns(array_merge($request,['reason'=>'Different'])))===409&&$returnWrites===1);
check(status(returns(array_merge($request,['operationKey'=>'22222222-2222-4222-8222-222222222222'])))===409);
$decision=['verb'=>'decide','orderId'=>1,'decision'=>'approved','note'=>'Follow up with store; no refund receipt','revision'=>$saved['revision'],'operationKey'=>'33333333-3333-4333-8333-333333333333','confirmed'=>true];
check(status(returns($decision))===400);check(status(returns($decision,true))===403);
foreach([['manage_woocommerce','edit_shop_orders'],['manage_options','manage_woocommerce']] as $permissions){$caps=$permissions;check(status(returns($decision,true))===403);}
$roles=['administrator'];$caps=['manage_options','manage_woocommerce','edit_shop_orders'];
check(status(returns(array_merge($decision,['confirmed'=>false]),true))===400);
check(status(returns(array_merge($decision,['revision'=>'stale']),true))===409);
$uncertainWrite=true;check(status(returns($decision,true))===503&&$returnWrites===2);$uncertainWrite=false;
$approved=returns($decision,true);check($approved['case']['status']==='approved'&&$returnWrites===2);
check($returnDb[1]['manager']===27&&$returnDb[1]['customer']===12&&isset($returnDb[1]['decisionAt']));
check(status(returns(array_merge($decision,['decision'=>'rejected']),true))===409);
check(status(returns(array_merge($decision,['operationKey'=>'44444444-4444-4444-8444-444444444444']),true))===409);
$roles=['customer'];check(returns($read)['case']['status']==='approved'&&returns($read)['automaticRefund']===false);
check(!isset(returns($read)['case']['manager']));
$request['orderId']=2;$uncertainWrite=true;check(status(returns($request))===503);$uncertainWrite=false;
check(returns($request)['case']['status']==='requested'&&$returnWrites===3);
$roles=['administrator'];$reject=array_merge($decision,['orderId'=>2,'decision'=>'rejected','revision'=>returns(['verb'=>'read','orderId'=>2],true)['revision']]);
check(returns($reject,true)['case']['status']==='rejected'&&$returnWrites===4);check(returns($reject,true)['case']['status']==='rejected'&&$returnWrites===4);$roles=['customer'];
$orders[8]=new ReturnOrder(8,12);$orders[8]->state='pending';$request['orderId']=8;check(status(returns($request))===409&&$returnWrites===4);
check($orders[1]->get_status()==='completed');
$orders[1]->native=99;$session=99;check(status(returns($read))===404);$session=12;$orders[1]->native=12;
check($routes['/customer-return']['methods']==='POST'&&$routes['/customer-return']['permission_callback']==='phb_return_customer_permission');
echo "Returns: ownership, actual roles, manager confirmation, lock, conflict, persistence/replay and no financial mutations passed\n";
