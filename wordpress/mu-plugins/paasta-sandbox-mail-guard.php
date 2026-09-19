<?php
/**
 * Keep missing PHP mail() from fatally interrupting sandbox payment callbacks.
 * This is not an email delivery service. Remove it after configuring SMTP.
 */
if (!defined('ABSPATH')) {
    exit;
}

// Do not expose a raw stack trace or customer details if another callback fails.
$zibal = get_option('woocommerce_WC_Gateway_Zibal_settings', []);
if (($zibal['sandbox'] ?? '') === 'yes' && ($zibal['pin'] ?? '') === 'zibal') {
    ini_set('display_errors', '0');
}

add_filter('pre_wp_mail', static function ($result) {
    if (null !== $result || function_exists('mail')) {
        return $result;
    }

    $zibal = get_option('woocommerce_WC_Gateway_Zibal_settings', []);
    if (($zibal['sandbox'] ?? '') !== 'yes' || ($zibal['pin'] ?? '') !== 'zibal') {
        return $result;
    }

    error_log('Sandbox email not sent: PHP mail transport is unavailable. Configure SMTP before accepting real orders.');
    return false;
}, 100);
