<?php
declare(strict_types=1);

define('ABSPATH', __DIR__);

$guard = null;
function add_filter(string $name, callable $callback, int $priority): void
{
    global $guard;
    if ($name === 'pre_wp_mail' && $priority === 100) {
        $guard = $callback;
    }
}

function get_option(string $name, array $default): array
{
    return ['sandbox' => 'yes', 'pin' => 'zibal'];
}

require __DIR__ . '/../wordpress/mu-plugins/paasta-sandbox-mail-guard.php';

if (!is_callable($guard) || function_exists('mail') || $guard(null) !== false || $guard(true) !== true) {
    fwrite(STDERR, "Sandbox mail guard failed\n");
    exit(1);
}

echo "Sandbox mail guard passed\n";
