<?php
/**
 * Short-lived customer sessions, registration with email verification, and
 * password recovery for the separate headless storefront.
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

/**
 * HTTPS origin of the headless frontend, set via the khanechin_frontend_url
 * option (the same option khanechin-return.php uses). Empty when unset.
 */
function khanechin_frontend_base() {
    $configured = trim( (string) get_option( 'khanechin_frontend_url' ) );
    if ( $configured === '' ) {
        return '';
    }
    $host = wp_parse_url( $configured, PHP_URL_HOST );
    $scheme = wp_parse_url( $configured, PHP_URL_SCHEME );
    return ( $scheme === 'https' && is_string( $host ) && $host !== '' ) ? 'https://' . $host : '';
}

/**
 * Small fixed-window limiter per bucket and client IP.
 */
function khanechin_rate_limited( $bucket, $limit, $seconds ) {
    $key = 'khanechin_' . $bucket . '_' . hash( 'sha256', (string) ( $_SERVER['REMOTE_ADDR'] ?? '' ) );
    $count = (int) get_transient( $key );
    if ( $count >= $limit ) {
        return true;
    }
    set_transient( $key, $count + 1, $seconds );
    return false;
}

/**
 * Sends the account verification link. Only ever opens over the configured
 * HTTPS frontend; the token itself is stored hashed and used once.
 */
function khanechin_send_verification( $user_id, $email ) {
    $frontend = khanechin_frontend_base();
    if ( $frontend === '' ) {
        return new WP_Error( 'frontend_missing', 'نشانی فرانت‌اند فروشگاه در وردپرس تنظیم نشده است.', array( 'status' => 503 ) );
    }
    $token = bin2hex( random_bytes( 32 ) );
    $key = 'khanechin_verify_' . hash( 'sha256', $token );
    set_transient( $key, (int) $user_id, DAY_IN_SECONDS );
    $link = $frontend . '/verify?token=' . $token;
    $body = "برای تأیید حساب فروشگاه، روی پیوند زیر بزنید:\n\n" . $link . "\n\nاگر شما این حساب را نساخته‌اید، این پیام را نادیده بگیرید.";
    if ( ! wp_mail( $email, 'تأیید حساب فروشگاه', $body ) ) {
        delete_transient( $key );
        return new WP_Error( 'mail_failed', 'ارسال ایمیل ممکن نشد. تنظیم ایمیل فروشگاه (SMTP) را بررسی کنید.', array( 'status' => 502 ) );
    }
    return true;
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
            if ( '0' === (string) get_user_meta( $user->ID, 'khanechin_verified', true ) ) {
                return new WP_Error( 'khanechin_unverified', 'ایمیل شما تأیید نشده است. پیوند تأیید را از صندوق ایمیل خود باز کنید.', array( 'status' => 403 ) );
            }
            delete_transient( $limit_key );
            $token = bin2hex( random_bytes( 32 ) );
            set_transient( 'khanechin_session_' . hash( 'sha256', $token ), $user->ID, KHANECHIN_SESSION_TTL );
            return array( 'token' => $token, 'expires_in' => KHANECHIN_SESSION_TTL );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/register', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( khanechin_rate_limited( 'register', 3, HOUR_IN_SECONDS ) ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های ثبت‌نام زیاد بوده است. بعداً دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $email = sanitize_email( (string) $request->get_param( 'email' ) );
            $password = (string) $request->get_param( 'password' );
            if ( ! is_email( $email ) || strlen( $password ) < 8 || strlen( $password ) > 1024 ) {
                return new WP_Error( 'invalid_input', 'ایمیل معتبر و رمز دست‌کم ۸ نویسه لازم است.', array( 'status' => 400 ) );
            }
            if ( username_exists( $email ) || email_exists( $email ) ) {
                return new WP_Error( 'email_taken', 'این ایمیل قبلاً ثبت شده است. وارد شوید یا رمز عبور را بازیابی کنید.', array( 'status' => 409 ) );
            }
            $user_id = function_exists( 'wc_create_new_customer' )
                ? wc_create_new_customer( $email, '', $password, array( 'source' => 'khanechin-headless' ) )
                : false;
            if ( is_wp_error( $user_id ) || ! $user_id ) {
                $user_id = wp_insert_user( array(
                    'user_login' => $email,
                    'user_email' => $email,
                    'user_pass' => $password,
                    'role' => 'customer',
                ) );
            }
            if ( is_wp_error( $user_id ) ) {
                return new WP_Error( 'registration_failed', 'ساخت حساب ممکن نشد. دوباره تلاش کنید.', array( 'status' => 502 ) );
            }
            update_user_meta( (int) $user_id, 'khanechin_verified', '0' );
            $sent = khanechin_send_verification( (int) $user_id, $email );
            if ( is_wp_error( $sent ) ) {
                if ( ! function_exists( 'wp_delete_user' ) ) {
                    require_once ABSPATH . 'wp-admin/includes/user.php';
                }
                wp_delete_user( (int) $user_id );
                return $sent;
            }
            return array( 'ok' => true, 'message' => 'حساب ساخته شد. پیوند تأیید به ایمیل شما ارسال شد.' );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/verify', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( khanechin_rate_limited( 'verify', 20, 15 * MINUTE_IN_SECONDS ) ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $token = (string) $request->get_param( 'token' );
            if ( ! preg_match( '/^[a-f0-9]{64}$/', $token ) ) {
                return new WP_Error( 'invalid_token', 'پیوند تأیید معتبر نیست یا منقضی شده است.', array( 'status' => 400 ) );
            }
            $key = 'khanechin_verify_' . hash( 'sha256', $token );
            $user_id = get_transient( $key );
            if ( ! $user_id || ! get_user_by( 'id', (int) $user_id ) ) {
                return new WP_Error( 'invalid_token', 'پیوند تأیید معتبر نیست یا منقضی شده است.', array( 'status' => 400 ) );
            }
            delete_transient( $key );
            update_user_meta( (int) $user_id, 'khanechin_verified', '1' );
            return array( 'ok' => true );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/resend', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( khanechin_rate_limited( 'resend', 5, 15 * MINUTE_IN_SECONDS ) ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $email = sanitize_email( (string) $request->get_param( 'email' ) );
            if ( is_email( $email ) ) {
                $user = get_user_by( 'email', $email );
                if ( $user && '0' === (string) get_user_meta( $user->ID, 'khanechin_verified', true ) ) {
                    $sent = khanechin_send_verification( $user->ID, $user->user_email );
                    if ( is_wp_error( $sent ) ) {
                        error_log( 'khanechin resend failed for user ' . (int) $user->ID . ': ' . $sent->get_error_code() );
                    }
                }
            }
            // The answer stays identical whether or not the account exists, so
            // this route cannot be used to probe registered addresses.
            return array( 'ok' => true, 'message' => 'اگر حسابی تأییدنشده با این ایمیل باشد، پیوند تازه برایش ارسال شد.' );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/lost-password', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( khanechin_rate_limited( 'lost', 5, 15 * MINUTE_IN_SECONDS ) ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $email = sanitize_email( (string) $request->get_param( 'email' ) );
            if ( is_email( $email ) ) {
                $user = get_user_by( 'email', $email );
                $frontend = khanechin_frontend_base();
                if ( $user && $frontend !== '' ) {
                    $reset_key = get_password_reset_key( $user );
                    if ( ! is_wp_error( $reset_key ) ) {
                        $link = $frontend . '/reset?login=' . rawurlencode( $user->user_login ) . '&key=' . rawurlencode( $reset_key );
                        wp_mail( $user->user_email, 'بازیابی رمز عبور فروشگاه', "برای تعیین رمز تازه روی پیوند زیر بزنید:\n\n" . $link . "\n\nاگر شما درخواست نداده بودید، این پیام را نادیده بگیرید." );
                    }
                }
            }
            return array( 'ok' => true, 'message' => 'اگر این ایمیل در فروشگاه ثبت شده باشد، پیوند بازیابی برایتان ارسال شد.' );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/reset-password', array(
        'methods' => 'POST',
        'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( khanechin_rate_limited( 'reset', 10, 15 * MINUTE_IN_SECONDS ) ) {
                return new WP_Error( 'rate_limited', 'تلاش‌های زیاد بوده است. کمی بعد دوباره امتحان کنید.', array( 'status' => 429 ) );
            }
            $login = trim( (string) $request->get_param( 'login' ) );
            $key = (string) $request->get_param( 'key' );
            $password = (string) $request->get_param( 'password' );
            if ( ! $login || strlen( $login ) > 254 || $key === '' || strlen( $key ) > 128 || strlen( $password ) < 8 || strlen( $password ) > 1024 ) {
                return new WP_Error( 'invalid_input', 'رمز تازه دست‌کم ۸ نویسه لازم است.', array( 'status' => 400 ) );
            }
            $user = check_password_reset_key( $key, $login );
            if ( is_wp_error( $user ) || ! $user ) {
                return new WP_Error( 'invalid_key', 'پیوند بازیابی معتبر نیست یا منقضی شده است. دوباره درخواست بدهید.', array( 'status' => 400 ) );
            }
            wp_set_password( $password, $user->ID );
            // Owning the reset link proves control of the mailbox; complete any
            // pending verification at the same time.
            if ( '0' === (string) get_user_meta( $user->ID, 'khanechin_verified', true ) ) {
                update_user_meta( $user->ID, 'khanechin_verified', '1' );
            }
            return array( 'ok' => true );
        },
    ) );
    register_rest_route( 'khanechin/v1', '/me', array(
        'methods' => 'POST',
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
