<?php
define('ABSPATH',__DIR__);$filters=array();
function add_filter($name,$callback,$priority=10,$args=1){global $filters;$filters[$name]=$callback;}
class WP_REST_Response{function __construct(public $data,public $status=200){}function get_status(){return $this->status;}function get_data(){return $this->data;}function set_data($data){$this->data=$data;}}
class Request{function __construct(public $route){}function get_route(){return $this->route;}}
function wc_get_order($id){return new class{function get_total(){return '162000';}function get_currency(){return 'IRT';}};}
require __DIR__.'/../wordpress/mu-plugins/khanechin-currency.php';
function check($ok){if(!$ok)throw new RuntimeException('Receipt currency regression');}
$filter=$filters['rest_post_dispatch'];
foreach(array(0,2) as $minor){$response=new WP_REST_Response(array('id'=>1,'totals'=>array('currency_minor_unit'=>$minor,'currency_code'=>'IRT','total_price'=>'16200000')));$result=$filter($response,null,new Request('/wc/store/v1/order/1'));check($result->data['totals']['total_price']===($minor===0?'162000':'16200000'));}
foreach(array(array('/wc/store/v1/order/1',403),array('/wc/store/v1/cart',200),array('/wc/store/v1/order/2',200)) as [$route,$status]){$data=array('id'=>1,'totals'=>array('currency_minor_unit'=>0,'currency_code'=>'IRT','total_price'=>'unchanged'));$response=new WP_REST_Response($data,$status);check($filter($response,null,new Request($route))->data===$data);}
echo "Receipt amount precision and authorization boundaries passed\n";
