<?php
// Reuse the guarded native-controller fixture; real block parsing is checked on WordPress.
require __DIR__.'/commerce.php';
$contentRoutes=array();$parsed=array();
function add_action($name,$fn){$fn();}
function register_rest_route($namespace,$route,$args){global $contentRoutes;$contentRoutes[$route]=$args;}
function is_wp_error($value){return $value instanceof WP_Error;}
function wp_strip_all_tags($value){return strip_tags($value);}
function esc_html($value){return htmlspecialchars($value,ENT_QUOTES,'UTF-8');}
function parse_blocks($value){global $parsed;return $parsed;}
function wp_get_attachment_image_url($id,$size){return 'https://fixture.invalid/image.jpg';}
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/content.php';
$nativeCaps=array('edit_posts');$record=array('id'=>21,'title'=>array('raw'=>'Title'),'content'=>array('raw'=>''),'excerpt'=>array('raw'=>''),'slug'=>'fixture','status'=>'draft','type'=>'post','modified_gmt'=>'2026-10-08T00:00:00');
$parsed=array(array('blockName'=>'core/paragraph','innerHTML'=>'<p>Text</p>','attrs'=>array()));
check(phb_content_blocks('')['editable']);
$parsed[0]['innerHTML']='<p><strong>Rich text</strong></p>';check(!phb_content_blocks('')['editable']);
foreach(array('core/latest-posts','core/block') as $name){$parsed=array(array('blockName'=>$name,'innerHTML'=>'','attrs'=>array()));check(!phb_content_blocks('')['editable']);}
$parsed=array(array('blockName'=>'core/paragraph','innerHTML'=>'<p>Text</p>','attrs'=>array('align'=>'center')));check(!phb_content_blocks('')['editable']);
$values=phb_content_values(array('blocks'=>array(array('type'=>'p','text'=>'<script>alert(1)</script>'))));
check(str_contains($values['content'],'&lt;script&gt;'));check(!str_contains($values['content'],'<script>'));
foreach(array(array('type'=>'script','text'=>'x'),array('type'=>'p','text'=>'x','html'=>'unsafe')) as $block)check(phb_content_values(array('blocks'=>array($block))) instanceof WP_Error);
check(phb_content_values(array('featured_media'=>99)) instanceof WP_Error);
check(phb_content_values(array('status'=>'trash')) instanceof WP_Error);
$options['woocommerce_checkout_page_id']=21;check(phb_content_protected(21));check(!phb_content_protected(22));
$update=array('resource'=>'pages','verb'=>'update','id'=>21,'values'=>array('title'=>'Other'),'operationKey'=>wp_key(),'revision'=>phb_commerce_revision($record));
check(request($update)->code==='protected_page');
$update['resource']='posts';$update['values']=array('blocks'=>array(array('type'=>'p','text'=>'Replacement')));$beforeWrites=$writes;
check(request($update)->code==='rich_content');check($writes===$beforeWrites);
$update['values']=array('author'=>1);check(request($update)->code==='invalid_fields');
check(request(array('resource'=>'paasta_design','verb'=>'list')) instanceof WP_Error);
check(request(array('resource'=>'posts','verb'=>'read','id'=>21))->data['item']['title']==='Title');check($lastRequest->path==='/wp/v2/posts/21');
$nativeCaps=array('manage_woocommerce');check(request(array('resource'=>'posts','verb'=>'list'))->data['status']===403);
function wp_key(){return 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';}
echo "Content safety regressions passed\n";
