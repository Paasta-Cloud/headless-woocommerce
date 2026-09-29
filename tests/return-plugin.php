<?php
define('ABSPATH', __DIR__);
$filters = [];
function add_filter($name, $callback) { global $filters; $filters[$name] = $callback; }
$options = ['khanechin_frontend_url' => 'https://shop.example.com', 'woocommerce_cart_page_id' => 1, 'woocommerce_checkout_page_id' => 2];
function get_option($name, $default = '') { global $options; return $options[$name] ?? $default; }
function add_action($name, $callback) { global $actions; $actions[$name] = $callback; }
function get_permalink($id) { return 'https://wp.example.com/' . ($id === 1 ? 'cart' : 'checkout') . '/'; }
function wc_get_order($id) { return $id === 29 ? new TestOrder() : false; }
function wp_parse_url($url, $component = -1) { return parse_url($url, $component); }
class TestOrder {
    function get_payment_method() { return 'WC_Gateway_Zibal'; }
    function get_id() { return 29; }
}
require __DIR__ . '/../wordpress/mu-plugins/khanechin-return.php';
$url = $filters['woocommerce_get_return_url']('https://wp.example.com/checkout/order-received/29/', new TestOrder());
$hosts = $filters['allowed_redirect_hosts'](['wp.example.com']);
if ($url !== 'https://shop.example.com/order/29' || !in_array('shop.example.com', $hosts, true)) {
    fwrite(STDERR, "Return URL integration failed\n");
    exit(1);
}
echo "Return URL integration passed\n";
function check_redirect($input, $expected) {
    if (khanechin_storefront_redirect($input) !== $expected) throw new Exception('Unexpected redirect: ' . $input);
}
check_redirect('https://wp.example.com/cart/', 'https://shop.example.com/cart');
check_redirect('https://wp.example.com/checkout/?wc_status=failed', 'https://shop.example.com/checkout');
foreach (['https://wp.example.com/checkout/order-pay/29/?key=secret', 'https://gateway.zibal.ir/start/123', 'https://evil.example/cart/', 'https://wp.example.com/wp-json/', 'https://wp.example.com:8443/cart/'] as $url) check_redirect($url, $url);
$actions['WC_Gateway_Zibal_Return_from_Gateway_Failed'](29);
check_redirect('https://wp.example.com/checkout/', 'https://shop.example.com/order/29');
check_redirect('https://wp.example.com/cart/', 'https://shop.example.com/order/29');
unset($GLOBALS['khanechin_return_order']);
$actions['WC_Gateway_Zibal_Return_from_Gateway_Failed'](999);
check_redirect('https://wp.example.com/cart/', 'https://shop.example.com/cart');
$options['khanechin_frontend_url'] = 'http://shop.example.com';
check_redirect('https://wp.example.com/cart/', 'https://wp.example.com/cart/');
echo "Failure redirects, gateway boundaries and missing configuration passed\n";
