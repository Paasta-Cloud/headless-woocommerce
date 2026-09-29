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

// Capture only the order supplied by the gateway after its callback validation.
// Do not redirect in this hook: the gateway must release its verification lock.
add_action('WC_Gateway_Zibal_Return_from_Gateway_Failed', static function ($id) {
    $order = wc_get_order($id);
    if ($order && $order->get_payment_method() === 'WC_Gateway_Zibal') {
        $GLOBALS['khanechin_return_order'] = (int) $order->get_id();
    }
});

function khanechin_storefront_redirect($location) {
    $frontend = khanechin_frontend_url();
    if (!$frontend || !is_string($location)) return $location;
    $target = wp_parse_url($location);
    if (!is_array($target) || !empty($target['user']) || !empty($target['pass'])) return $location;
    foreach (['cart', 'checkout'] as $page) {
        $page_id = (int) get_option('woocommerce_' . $page . '_page_id', 0);
        if (!$page_id) continue;
        $native = wp_parse_url(get_permalink($page_id));
        // Match exact native pages, never the order-pay bridge, APIs or gateway.
        if (!$native || ($target['scheme'] ?? '') !== ($native['scheme'] ?? '') ||
            ($target['host'] ?? '') !== ($native['host'] ?? '') ||
            ($target['port'] ?? null) !== ($native['port'] ?? null) ||
            rtrim($target['path'] ?? '/', '/') !== rtrim($native['path'] ?? '/', '/')) continue;
        // Plain-permalink installations distinguish pages using page_id.
        parse_str($native['query'] ?? '', $native_query);
        parse_str($target['query'] ?? '', $target_query);
        if (isset($native_query['page_id']) && ($target_query['page_id'] ?? null) !== $native_query['page_id']) continue;
        $id = $GLOBALS['khanechin_return_order'] ?? 0;
        return $frontend . ($id ? '/order/' . (int) $id : '/' . $page);
    }
    return $location;
}
add_filter('wp_redirect', 'khanechin_storefront_redirect', 20);

// Direct visits and old gateway links must not render the native Woo pages.
add_action('template_redirect', static function () {
    if (!khanechin_frontend_url() || is_admin() || wp_doing_ajax() ||
        !function_exists('is_cart') || is_wc_endpoint_url()) return;
    if (is_cart() || is_checkout()) {
        nocache_headers();
        wp_safe_redirect(khanechin_frontend_url() . (is_cart() ? '/cart' : '/checkout'), 302);
        exit;
    }
}, 1);
