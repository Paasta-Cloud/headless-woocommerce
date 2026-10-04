<?php
define('ABSPATH',__DIR__);
function add_action(...$args){}
function wp_parse_url($value){return parse_url($value);}
require __DIR__.'/../wordpress/plugins/paasta-headless-connector/paasta-headless-connector.php';
function check_connector($condition){if(!$condition)throw new RuntimeException('Connector origin validation failed');}
check_connector(paasta_connector_origin('https://SHOP.ir./')==='https://shop.ir');
foreach(array('http://shop.ir','https://user:pass@shop.ir','https://shop.ir/path','https://shop.ir/?token=x','https://shop.ir/#key','https://127.0.0.1','https://[::1]','https://shop..ir') as $value)check_connector(paasta_connector_origin($value)==='');
echo "Connector origin checks passed\n";

class WooCommerce {}
class WP_Error {}
$options=array();$save_failure=false;$init_failure=false;$parse_failure=false;$option_failure=false;
function current_user_can($cap){return $cap==='manage_options';}
function check_admin_referer($name){}
function wp_unslash($value){return $value;}
function home_url($path){return 'https://backend.shop.ir/';}
function get_option($key,$default=false){global $options;return $options[$key]??$default;}
function update_option($key,$value,...$rest){global $options,$option_failure;if(!$option_failure)$options[$key]=$value;}
function get_post($id){return $id===1?(object)array('post_content'=>'{}'):null;}
function phb_activate(){global $options,$init_failure;if(!$init_failure)$options['paasta_design_id']=1;}
function phb_parse($content){global $parse_failure;if($parse_failure)throw new RuntimeException('private detail');return array('settings'=>array());}
function phb_clean_design($design){return $design;}
function phb_manager_write($design,$hash){global $save_failure;return $save_failure?new WP_Error():true;}
function get_bloginfo($key){return 'Store';}
function is_wp_error($value){return $value instanceof WP_Error;}
function esc_html($value){return htmlspecialchars($value);}
function esc_attr($value){return htmlspecialchars((string)$value);}
function wp_nonce_field($name){}
function submit_button($label){}
function run_connector_page(){ob_start();paasta_connector_page();return ob_get_clean();}
$_SERVER['REQUEST_METHOD']='POST';$_POST=array('frontend'=>'https://shop.ir','confirm'=>'1');
foreach(array('init_failure','save_failure','parse_failure','option_failure') as $failure){
    $options=array();$$failure=true;$html=run_connector_page();$$failure=false;
    check_connector(get_option('paasta_connector_enabled')!=='yes');
    check_connector(strpos($html,'notice-error')!==false);
    check_connector(strpos($html,'private detail')===false);
}
$options=array();$html=run_connector_page();
check_connector(get_option('paasta_connector_enabled')==='yes');
check_connector(get_option('khanechin_frontend_url')==='https://shop.ir');
check_connector(strpos($html,'notice-success')!==false);
$options=array();unset($_POST['confirm']);run_connector_page();
check_connector(get_option('paasta_connector_enabled')!=='yes');
echo "Connector explicit consent and failed-save checks passed\n";
