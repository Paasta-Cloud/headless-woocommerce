<?php
/**
 * Plugin Name: صفحه‌ساز فروشگاه هدلس پاستا
 * Description: مدیریت بلوکی صفحهٔ اصلی، هویت بصری و منوهای فرانت‌اند مستقل؛ همراه با پیش‌نمایش امن و تاریخچهٔ وردپرس.
 * Version: 1.6.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 */
if (!defined('ABSPATH')) exit;
require_once __DIR__ . '/schema.php';
require_once __DIR__ . '/manage.php';
require_once __DIR__ . '/commerce.php';

function phb_types() { return array('site-settings','hero','banners','categories','products','text-image','features','faq','spacer'); }
function phb_register() {
    wp_register_style('paasta-builder',plugins_url('editor.css',__FILE__),array(),filemtime(__DIR__.'/editor.css'));
    register_post_type('paasta_design', array(
        'labels'=>array('name'=>'طراحی فروشگاه','singular_name'=>'طراحی فروشگاه','edit_item'=>'ویرایش فروشگاه هدلس','all_items'=>'صفحه‌ساز فروشگاه'),
        'public'=>false,'show_ui'=>true,'show_in_menu'=>true,'show_in_rest'=>true,'menu_icon'=>'dashicons-layout',
        'supports'=>array('title','editor','revisions'),'map_meta_cap'=>false,
        'capabilities'=>array('edit_post'=>'manage_options','read_post'=>'manage_options','delete_post'=>'do_not_allow','edit_posts'=>'manage_options','edit_others_posts'=>'manage_options','publish_posts'=>'manage_options','read_private_posts'=>'manage_options','delete_posts'=>'do_not_allow','create_posts'=>'do_not_allow'),
    ));
    foreach (phb_types() as $type) register_block_type('paasta/'.$type, array('api_version'=>3,'editor_style'=>'paasta-builder','attributes'=>array('values'=>array('type'=>'object','default'=>new stdClass())),'render_callback'=>function(){return '';}));
}
add_action('init', 'phb_register');

function phb_serialize($design) {
    $blocks = array(array('blockName'=>'paasta/site-settings','attrs'=>array('values'=>$design['settings'],'lock'=>array('move'=>true,'remove'=>true)),'innerBlocks'=>array(),'innerHTML'=>'','innerContent'=>array()));
    foreach ($design['sections'] as $section) { $type=$section['type']; unset($section['type']); $blocks[]=array('blockName'=>'paasta/'.$type,'attrs'=>array('values'=>$section),'innerBlocks'=>array(),'innerHTML'=>'','innerContent'=>array()); }
    return serialize_blocks($blocks);
}
function phb_parse($content) {
    if (!is_string($content) || strlen($content)>200000) throw new InvalidArgumentException('حجم طراحی بیش از حد مجاز است.');
    $settings=null; $sections=array();
    foreach (parse_blocks($content) as $block) {
        if (!$block['blockName'] && trim($block['innerHTML'] ?? '')==='') continue;
        $name=$block['blockName']; $type=substr((string)$name,7);
        if (strpos((string)$name,'paasta/')!==0 || !in_array($type,phb_types(),true) || !empty($block['innerBlocks'])) throw new InvalidArgumentException('فقط بلوک‌های اختصاصی فروشگاه در این صفحه مجازند.');
        $values=$block['attrs']['values'] ?? array();
        if (!is_array($values)) throw new InvalidArgumentException('تنظیمات بلوک معتبر نیست.');
        if ($type==='site-settings') { if ($settings!==null) throw new InvalidArgumentException('بلوک تنظیمات کلی فقط یک بار مجاز است.'); $settings=$values; }
        else { $values['type']=$type; $sections[]=$values; }
    }
    if ($settings===null || count($sections)>40) throw new InvalidArgumentException('یک بلوک تنظیمات کلی و حداکثر ۴۰ سکشن لازم است.');
    return phb_clean_design(array('version'=>1,'settings'=>$settings,'sections'=>$sections));
}
function phb_activate() {
    if (!post_type_exists('paasta_design')) phb_register();
    if (get_post((int)get_option('paasta_design_id'))) return;
    $design=phb_defaults();
    $design['settings']['frontendUrl']=phb_url(get_option('khanechin_frontend_url',''),true);
    $id=wp_insert_post(array('post_type'=>'paasta_design','post_title'=>'طراحی فروشگاه','post_status'=>'publish','post_content'=>wp_slash(phb_serialize($design))),true);
    if (!is_wp_error($id)) update_option('paasta_design_id',$id,false);
}
register_activation_hook(__FILE__, 'phb_activate');
add_filter('allowed_block_types_all',function($allowed,$context){return !empty($context->post) && $context->post->post_type==='paasta_design' ? array_map(function($type){return 'paasta/'.$type;},phb_types()) : $allowed;},10,2);
add_filter('block_categories_all',function($categories,$context){if(!empty($context->post)&&$context->post->post_type==='paasta_design')array_unshift($categories,array('slug'=>'paasta-store','title'=>'بلوک‌های فروشگاه'));return $categories;},10,2);
add_filter('rest_pre_insert_paasta_design',function($post,$request){
    if (isset($post->post_content)) { try { phb_parse($post->post_content); } catch (InvalidArgumentException $error) { return new WP_Error('invalid_design',$error->getMessage(),array('status'=>400)); } }
    return $post;
},10,2);
add_action('enqueue_block_editor_assets',function(){
    $screen=get_current_screen();if(!$screen||$screen->post_type!=='paasta_design')return;
    wp_enqueue_media();
    wp_enqueue_script('paasta-builder',plugins_url('editor.js',__FILE__),array('wp-blocks','wp-element','wp-block-editor','wp-components','wp-data','wp-api-fetch','wp-plugins','wp-editor'),filemtime(__DIR__.'/editor.js'),true);
    wp_add_inline_script('paasta-builder','window.PaastaBuilder='.wp_json_encode(array('defaults'=>phb_defaults()),JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');
    wp_enqueue_style('paasta-builder',plugins_url('editor.css',__FILE__),array(),filemtime(__DIR__.'/editor.css'));
});
add_filter('upload_mimes',function($mimes){if(current_user_can('manage_options')){$mimes['woff']='font/woff';$mimes['woff2']='font/woff2';}return $mimes;});
function phb_response($data) { $response=new WP_REST_Response($data);$response->header('Cache-Control','private, no-store, max-age=0');$response->header('X-Robots-Tag','noindex, nofollow');return $response; }
add_action('rest_api_init',function(){
    register_rest_route('paasta-headless/v1','/design',array('methods'=>'GET','permission_callback'=>'__return_true','callback'=>function(){
        $post=get_post((int)get_option('paasta_design_id'));
        if(!$post||$post->post_type!=='paasta_design'||$post->post_status!=='publish')return new WP_Error('design_unavailable','طراحی منتشرشده در دسترس نیست.',array('status'=>404));
        try{return phb_response(phb_parse($post->post_content));}catch(InvalidArgumentException $error){return new WP_Error('invalid_design','طراحی منتشرشده معتبر نیست.',array('status'=>503));}
    }));
    register_rest_route('paasta-headless/v1','/preview',array('methods'=>'POST','permission_callback'=>function(){return current_user_can('manage_options');},'callback'=>function($request){
        try{$design=phb_parse($request->get_param('content'));}catch(InvalidArgumentException $error){return new WP_Error('invalid_design',$error->getMessage(),array('status'=>400));}
        $front=$design['settings']['frontendUrl'];
        if(!$front || !empty(parse_url($front,PHP_URL_QUERY)) || !empty(parse_url($front,PHP_URL_FRAGMENT)) || !in_array(parse_url($front,PHP_URL_PATH),array(null,'','/'),true))return new WP_Error('missing_frontend','نشانی HTTPS ریشهٔ فرانت‌اند را در تنظیمات کلی وارد کنید.',array('status'=>400));
        $token=bin2hex(random_bytes(32));
        set_transient('phb_preview_'.hash('sha256',$token),$design,10*MINUTE_IN_SECONDS);
        return phb_response(array('url'=>rtrim($front,'/').'/preview#'.$token,'expiresIn'=>600));
    }));
    register_rest_route('paasta-headless/v1','/preview/read',array('methods'=>'POST','permission_callback'=>'__return_true','callback'=>function($request){
        $token=$request->get_param('token');
        if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token))return new WP_Error('invalid_preview','پیوند پیش‌نمایش معتبر نیست.',array('status'=>403));
        $design=get_transient('phb_preview_'.hash('sha256',$token));
        if(!$design)return new WP_Error('expired_preview','پیش‌نمایش منقضی شده؛ از ویرایشگر دوباره پیش‌نمایش بسازید.',array('status'=>410));
        return phb_response($design);
    }));
});
