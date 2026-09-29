<?php
// Currency support without a theme or an unrelated localization plugin.
defined('ABSPATH') || exit;
add_filter('woocommerce_currencies',function($currencies){$currencies['IRT']='تومان';return $currencies;});
add_filter('woocommerce_currency_symbol',function($symbol,$currency){return $currency==='IRT'?'تومان':$symbol;},10,2);

// Some Woo Store API versions format order totals with two decimals while
// declaring the shop's zero-decimal currency. Rebuild only the authorized
// receipt total from the persisted order, never from a submitted amount.
add_filter('rest_post_dispatch',function($response,$server,$request){
 if(!($response instanceof WP_REST_Response)||$response->get_status()!==200||!preg_match('#^/wc/store/v1/order/([1-9][0-9]*)$#',$request->get_route(),$match))return $response;
 $data=$response->get_data();
 if(!is_array($data)||(int)($data['id']??0)!==(int)$match[1]||!isset($data['totals']))return $response;
 $order=wc_get_order((int)$match[1]);if(!$order)return $response;
 $totals=(array)$data['totals'];$minor=$totals['currency_minor_unit']??null;
 if(!is_int($minor)||$minor<0||$minor>6||($totals['currency_code']??'')!==$order->get_currency())return $response;
 $totals['total_price']=number_format((float)$order->get_total()*10**$minor,0,'.','');
 $data['totals']=$totals;$response->set_data($data);return $response;
},10,3);
