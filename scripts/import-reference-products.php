<?php
// Run as the WordPress site's Unix identity, never root. CSV is produced by reference-products.mjs.
if (PHP_SAPI !== 'cli' || count($argv) !== 3) exit(64);
if (function_exists('posix_geteuid') && posix_geteuid() === 0) throw new RuntimeException('Run as the site identity, not root');
$root = realpath($argv[1]);
if (!$root || !is_file($root . '/wp-load.php')) throw new RuntimeException('WordPress root missing');
define('WP_USE_THEMES', false);
require $root . '/wp-load.php';
if (!class_exists('WC_Product_Simple') || get_woocommerce_currency() !== 'IRT') throw new RuntimeException('WooCommerce in toman required');
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
$file = fopen($argv[2], 'r');
if (!$file) throw new RuntimeException('CSV missing');
$header = fgetcsv($file, 0, ',', '"', '');
$header[0] = ltrim($header[0], "\xEF\xBB\xBF");
$count = 0;
while (($row = fgetcsv($file, 0, ',', '"', '')) !== false) {
    $item = array_combine($header, $row);
    if (!preg_match('/^dinaha-reference-\d+$/', $item['SKU'])) throw new RuntimeException('Unexpected SKU');
    $id = wc_get_product_id_by_sku($item['SKU']);
    $product = $id ? wc_get_product($id) : new WC_Product_Simple();
    // Existing imported products remain merchant-owned. Only recover a missing image on retries.
    if (!$id) {
        $product->set_name($item['Name']);
        $product->set_sku($item['SKU']);
        $product->set_status('publish');
        $product->set_regular_price($item['Regular price']);
        $product->set_stock_status('outofstock');
        $categories = [];
        foreach (explode(', ', $item['Categories']) as $name) {
            $term = term_exists($name, 'product_cat');
            if (!$term) $term = wp_insert_term($name, 'product_cat');
            if (is_wp_error($term)) throw new RuntimeException('Category creation failed');
            $categories[] = (int) (is_array($term) ? $term['term_id'] : $term);
        }
        $product->set_category_ids($categories);
        $product->update_meta_data('_khanechin_demo_source', 'https://dinaha.i-design.ir/');
        $id = $product->save();
    }
    $url = $item['Images'];
    if (!$product->get_image_id() && $url) {
        if (parse_url($url, PHP_URL_SCHEME) !== 'https' || parse_url($url, PHP_URL_HOST) !== 'dinaha.i-design.ir') throw new RuntimeException('Unexpected image origin');
        $image = media_sideload_image($url, $id, $item['Name'], 'id');
        if (is_wp_error($image)) throw new RuntimeException('Reference image import failed: ' . $image->get_error_code());
        $product->set_image_id($image);
        $product->save();
    }
    $count++;
    echo json_encode(['imported' => $count, 'id' => $id]) . "\n";
}
$category = term_exists('نمونه صنایع‌دستی', 'product_cat');
echo json_encode(['total' => $count, 'categoryId' => (int) $category['term_id']]) . "\n";
