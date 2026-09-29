<?php
/** Plugin Name: Paasta headless public response cache */
if (!defined('ABSPATH')) exit;

function khc_revision() {
    $value = get_option('khc_public_revision', '');
    if (!preg_match('/^[a-f0-9]{32}$/', $value)) {
        add_option('khc_public_revision', bin2hex(random_bytes(16)), '', false);
        $value = get_option('khc_public_revision');
    }
    return $value;
}
function khc_invalidate() { update_option('khc_public_revision', bin2hex(random_bytes(16)), false); }

add_action('rest_api_init', static function () {
    register_rest_route('paasta-cache/v1', '/revision', [
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => static function () {
            return new WP_REST_Response(['revision' => khc_revision()], 200, ['Cache-Control' => 'no-store']);
        },
    ]);
});

// Only anonymous, context-free public requests are eligible. Never cache any
// authenticated/session/cart/order/preview request, even on a public route.
function khc_key($request) {
    if ($request->get_method() !== 'GET' || is_user_logged_in() || !empty($_COOKIE) ||
        $request->get_header('authorization') || $request->get_header('cart-token') ||
        $request->get_header('nonce') || $request->get_header('x-wp-nonce')) return null;
    $route = $request->get_route();
    if ($route !== '/paasta-headless/v1/design' && !preg_match('#^/wc/store/v1/products(?:/[1-9][0-9]*)?$#D', $route)) return null;
    $params = $request->get_query_params();
    unset($params['_']); // Builder's historical cache-buster is not content.
    foreach ($params as $name => $value) {
        if (!in_array($name, ['per_page', 'page', 'category', 'type', 'parent', 'orderby', 'order'], true) || !is_scalar($value)) return null;
    }
    ksort($params);
    return hash('sha256', $route . '?' . http_build_query($params) . ':' . khc_revision());
}
function khc_slot($key) { return 'khc_public_' . (hexdec(substr($key, 0, 2)) % 64); }
add_filter('rest_pre_dispatch', static function ($result, $server, $request) {
    if ($result !== null || !($key = khc_key($request))) return $result;
    $GLOBALS['khc_requests'][spl_object_id($request)] = $key;
    $hit = get_transient(khc_slot($key));
    if (!is_array($hit) || $hit['key'] !== $key) return $result;
    return new WP_REST_Response($hit['data'], 200, $hit['headers'] + ['X-Paasta-Public-Cache' => 'HIT']);
}, 10, 3);
add_filter('rest_post_dispatch', static function ($response, $server, $request) {
    $key = $GLOBALS['khc_requests'][spl_object_id($request)] ?? null;
    unset($GLOBALS['khc_requests'][spl_object_id($request)]);
    if (!$key || $key !== khc_key($request) || $response->get_status() !== 200) return $response;
    $headers = $response->get_headers();
    if (isset($headers['X-Paasta-Public-Cache'])) return $response;
    foreach ($headers as $name => $value) if (strtolower($name) === 'set-cookie') return $response;
    foreach (headers_list() as $header) if (stripos($header, 'Set-Cookie:') === 0) return $response;
    $data = $response->get_data();
    if (strlen(wp_json_encode($data)) > 262144) return $response;
    // Fixed 64 slots: arbitrary public query strings cannot grow cache storage.
    // Collisions are safe misses; TTL also bounds changes from third-party hooks.
    set_transient(khc_slot($key), ['key' => $key, 'data' => $data, 'headers' => $headers], 60);
    $response->header('X-Paasta-Public-Cache', 'MISS');
    return $response;
}, 10, 3);

foreach (['woocommerce_after_product_object_save', 'woocommerce_product_set_stock', 'woocommerce_variation_set_stock', 'woocommerce_product_set_stock_status', 'woocommerce_variation_set_stock_status', 'created_term', 'edited_term', 'delete_term'] as $hook) {
    add_action($hook, 'khc_invalidate');
}
function khc_post_change($id) {
    if (in_array(get_post_type($id), ['product', 'product_variation', 'paasta_design', 'attachment'], true)) khc_invalidate();
}
add_action('save_post', 'khc_post_change', 100);
add_action('before_delete_post', 'khc_post_change');
foreach (['updated_post_meta', 'added_post_meta', 'deleted_post_meta'] as $hook) {
    add_action($hook, static function ($meta_id, $post_id) { khc_post_change($post_id); }, 10, 2);
}
add_action('updated_option', static function ($name) {
    if (strpos($name, 'woocommerce_') === 0 || in_array($name, ['paasta_design_id', 'WPLANG'], true)) khc_invalidate();
});
