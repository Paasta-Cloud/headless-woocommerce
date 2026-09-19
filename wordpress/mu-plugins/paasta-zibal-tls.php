<?php
/**
 * Keep TLS verification enabled for the official Zibal WooCommerce gateway.
 * Its 2.1.0 HTTP client explicitly disables verification; this small
 * must-use plugin restores WordPress's secure default for Zibal API hosts.
 */
if (!defined('ABSPATH')) {
    exit;
}

add_filter('http_request_args', static function ($args, $url) {
    $parts = wp_parse_url($url);
    if (!is_array($parts)) {
        return $args;
    }
    $host = strtolower($parts['host'] ?? '');
    if (in_array($host, ['gateway.zibal.ir', 'gateway.zibal.io'], true)) {
        $args['sslverify'] = true;
    }
    return $args;
}, 100, 2);
