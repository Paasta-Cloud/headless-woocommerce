<?php
// Currency support without a theme or an unrelated localization plugin.
defined('ABSPATH') || exit;
add_filter('woocommerce_currencies',function($currencies){$currencies['IRT']='تومان';return $currencies;});
add_filter('woocommerce_currency_symbol',function($symbol,$currency){return $currency==='IRT'?'تومان':$symbol;},10,2);
