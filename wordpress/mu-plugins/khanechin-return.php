<?php
/** Route verified Zibal return pages to the headless storefront. */
if (!defined('ABSPATH')) { exit; }

function khanechin_frontend_url() {
    $configured = get_option('khanechin_frontend_url', '');
    $url = wp_parse_url($configured);
    if (!is_array($url) || ($url['scheme'] ?? '') !== 'https' || empty($url['host']) || !empty($url['user']) || !empty($url['pass']) || !empty($url['query']) || !empty($url['fragment'])) return '';
    return 'https://' . $url['host'] . (isset($url['port']) ? ':' . (int) $url['port'] : '');
}

add_filter('woocommerce_get_return_url', static function ($url, $order) {
    if (!$order || $order->get_payment_method() !== 'WC_Gateway_Zibal') return $url;
    $frontend = khanechin_frontend_url();
    return $frontend ? $frontend . '/order/' . (int) $order->get_id() : $url;
}, 10, 2);

add_filter('allowed_redirect_hosts', static function ($hosts) {
    $frontend = khanechin_frontend_url();
    if ($frontend) $hosts[] = wp_parse_url($frontend, PHP_URL_HOST);
    return array_unique($hosts);
});
