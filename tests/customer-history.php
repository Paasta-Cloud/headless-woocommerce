<?php
// Reuse the actual customer-role boundary and historical ownership regression.
require __DIR__.'/customer-profile.php';
function wp_salt($scheme){return 'isolated-fixture-salt';}
function wc_get_orders($args){
    check($GLOBALS['roles']===['customer']);
    check($args['limit']===21 && $args['orderby']==='ID' && $args['type']==='shop_order');
    check(str_starts_with($args['date_created'],'<='));
    $GLOBALS['queries']++;
    $found=array_filter($GLOBALS['orders'],function($order)use($args){
        if($order->native!==$args['customer_id'])return false;
        if($args['customer_id']===0){
            check($args['khanechin_bound_customer']===$GLOBALS['session']);
            check($args['meta_query'][0]['key']==='_khanechin_customer_id');
            return $order->bound===$args['meta_query'][0]['value'];
        }
        check($args['customer_id']===$GLOBALS['session']);
        return true;
    });
    usort($found,fn($a,$b)=>$b->id<=>$a->id);
    return array_slice($found,$args['offset'],$args['limit']);
}
$roles=['customer'];$queries=0;$orders=[];
for($id=1;$id<=61;$id++)$orders[$id]=new FixtureOrder($id,$id%2?12:0,$id%2?0:12);
$orders[99]=new FixtureOrder(99,99,12); // Foreign native owner wins over legacy binding.
$orders[100]=new FixtureOrder(100,12,99); // Conflicting bindings never appear.
$orders[101]=new FixtureOrder(101,0,99); // Another customer's guest order.
$all=[];$cursor='';$pages=0;
do{
    $result=khanechin_customer_orders(new FixtureRequest(['cursor'=>$cursor]));
    check(status($result)===200&&count($result['orders'])<=20);
    foreach($result['orders'] as $order){check(!in_array($order['id'],$all,true));$all[]=$order['id'];}
    $cursor=$result['next_cursor'];$pages++;
    check($pages<=5);
}while($cursor);
check($all===range(61,1)&&$pages===4&&$queries===8);
$first=khanechin_customer_orders(new FixtureRequest([]));$valid=$first['next_cursor'];
$before=$queries;
foreach([['cursor'=>'forged'],['cursor'=>[]],['customer_id'=>99],['cursor'=>str_repeat('a',601)]] as $body)check(status(khanechin_customer_orders(new FixtureRequest($body)))===400);
$session=99;check(status(khanechin_customer_orders(new FixtureRequest(['cursor'=>$valid])))===400);$session=12;
$expired=khanechin_order_cursor(['native'=>0,'legacy'=>0,'at'=>time()-HOUR_IN_SECONDS-1],12);
check(status(khanechin_customer_orders(new FixtureRequest(['cursor'=>$expired])))===400);
check(status(khanechin_customer_orders(new FixtureRequest([],false)))===401);
$roles=['administrator'];check(status(khanechin_customer_orders(new FixtureRequest([])))===401);$roles=['customer'];
check($queries===$before);
check($routes['/customer-orders']['methods']==='POST'&&$routes['/customer-orders']['permission_callback']==='khanechin_customer_permission');
echo "Bounded history, merged native/legacy ownership, cursor isolation/expiry and customer role passed\n";
