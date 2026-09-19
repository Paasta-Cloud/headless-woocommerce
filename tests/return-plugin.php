<?php
define('ABSPATH', __DIR__);
$filters = [];
function add_filter($name, $callback) { global $filters; $filters[$name] = $callback; }
function get_option($name, $default = '') { return $name === 'khanechin_frontend_url' ? 'https://shop.example.com' : $default; }
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
