<?php
/**
 * Short-lived customer sessions for the separate headless storefront.
 */
defined( 'ABSPATH' ) || exit;

const KHANECHIN_SESSION_TTL = 12 * HOUR_IN_SECONDS;

function khanechin_customer_from_request( $request ) {
    $header = $request->get_header( 'authorization' );
    if ( ! is_string( $header ) || ! preg_match( '/^Bearer ([a-f0-9]{64})$/', $header, $matches ) ) {
        return null;
    }
    $id = get_transient( 'khanechin_session_' . hash( 'sha256', $matches[1] ) );
    $user = $id ? get_user_by( 'id', (int) $id ) : false;
    return $user && in_array( 'customer', (array) $user->roles, true ) ? $user : null;
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'khanechin/v1', '/login', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            $login = trim( (string) $request->get_param( 'login' ) );
            $password = (string) $request->get_param( 'password' );
            if ( strlen( $login ) > 254 || strlen( $password ) > 1024 || ! $login || ! $password ) {
                return new WP_Error( 'invalid_login', 'نام کاربری یا رمز عبور درست نیست.', array( 'status' => 401 ) );
            }
            $ip = (string) ( $_SERVER['REMOTE_ADDR'] ?? '' );
            $limit_key = 'khanechin_login_' . hash( 'sha256', strtolower( $login ) );
            $ip_key = 'khanechin_login_ip_' . hash( 'sha256', $ip );
            $attempts = (int) get_transient( $limit_key );
            $ip_attempts = (int) get_transient( $ip_key );
            if ( $attempts >= 5 || $ip_attempts >= 30 ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های ورود زیاد بوده است. ۱۵ دقیقه دیگر دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $user = wp_authenticate( $login, $password );
            if ( is_wp_error( $user ) || ! in_array( 'customer', (array) $user->roles, true ) ) {
                set_transient( $limit_key, $attempts + 1, 15 * MINUTE_IN_SECONDS );
                set_transient( $ip_key, $ip_attempts + 1, 15 * MINUTE_IN_SECONDS );
                return new WP_Error( 'invalid_login', 'نام کاربری یا رمز عبور درست نیست.', array( 'status' => 401 ) );
            }
            delete_transient( $limit_key );
            $token = bin2hex( random_bytes( 32 ) );
            set_transient( 'khanechin_session_' . hash( 'sha256', $token ), $user->ID, KHANECHIN_SESSION_TTL );
            return array( 'token' => $token, 'expires_in' => KHANECHIN_SESSION_TTL );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/me', array(
        'methods' => array( 'GET', 'POST' ),
        'permission_callback' => function ( $request ) { return khanechin_customer_from_request( $request ) ? true : new WP_Error( 'unauthorized', 'ورود لازم است.', array( 'status' => 401 ) ); },
        'callback' => function ( $request ) {
            $user = khanechin_customer_from_request( $request );
            $orders = function_exists( 'wc_get_orders' ) ? wc_get_orders( array( 'customer_id' => $user->ID, 'limit' => 20, 'orderby' => 'date', 'order' => 'DESC' ) ) : array();
            return array(
                'name' => $user->display_name,
                'email' => $user->user_email,
                'orders' => array_map( function ( $order ) {
                    return array( 'id' => $order->get_id(), 'status' => wc_get_order_status_name( $order->get_status() ), 'total' => $order->get_total(), 'currency' => $order->get_currency(), 'date' => $order->get_date_created() ? $order->get_date_created()->date( 'Y-m-d' ) : '' );
                }, $orders ),
            );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/logout', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            $header = $request->get_header( 'authorization' );
            if ( is_string( $header ) && preg_match( '/^Bearer ([a-f0-9]{64})$/', $header, $matches ) ) {
                delete_transient( 'khanechin_session_' . hash( 'sha256', $matches[1] ) );
            }
            return array( 'ok' => true );
        },
    ) );
} );

add_filter( 'rest_post_dispatch', function ( $response, $server, $request ) {
    if ( strpos( $request->get_route(), '/khanechin/v1/' ) === 0 && $response instanceof WP_REST_Response ) {
        $response->header( 'Cache-Control', 'private, no-store, max-age=0' );
        $response->header( 'Pragma', 'no-cache' );
    }
    return $response;
}, 10, 3 );
