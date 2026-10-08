<?php
// Plain-text Gutenberg blocks: no executable HTML, shortcodes or cross-site embeds.
if (!defined('ABSPATH')) exit;
function phb_content_protected($id){
    foreach(array('woocommerce_cart_page_id','woocommerce_checkout_page_id','woocommerce_myaccount_page_id','woocommerce_shop_page_id','page_on_front','page_for_posts','wp_page_for_privacy_policy') as $key)if((int)get_option($key)===(int)$id&&$id>0)return true;
    return false;
}
function phb_content_text($value){return html_entity_decode(wp_strip_all_tags((string)$value),ENT_QUOTES|ENT_HTML5,'UTF-8');}
function phb_content_blocks($raw){
    $items=array();$editable=true;
    foreach(parse_blocks($raw) as $block){
        $name=$block['blockName']??null;$level=$block['attrs']['level']??2;
        if($name===null&&!trim($block['innerHTML']??'')&&empty($block['innerBlocks']))continue;
        if(array_diff(array_keys($block['attrs']??array()),$name==='core/heading'?array('level'):array()))$editable=false;
        // Never flatten existing rich content on save. Metadata stays editable.
        if(!in_array($name,array('core/paragraph','core/heading'),true)||!empty($block['innerBlocks'])||preg_match('/<(?!\/?(?:p|h[23])>)[^>]+>/i',$block['innerHTML'])||($name==='core/heading'&&!in_array($level,array(2,3),true)))$editable=false;
        $items[]=array('type'=>$name==='core/heading'&&in_array($level,array(2,3),true)?'h'.$level:'p','text'=>phb_content_text($block['innerHTML']??''));
    }
    return array('blocks'=>$items,'editable'=>$editable&&count($items)<=80);
}
function phb_content_values($values){
    foreach(array('title','slug','excerpt') as $field)if(isset($values[$field])){
        if(!is_string($values[$field])||strlen($values[$field])>($field==='excerpt'?10000:1000))return phb_manager_error('invalid_content','عنوان یا خلاصه بیش از حد طولانی است.');
        $values[$field]=sanitize_textarea_field($values[$field]);
    }
    if(isset($values['status'])&&!in_array($values['status'],array('draft','publish','pending','private'),true))return phb_manager_error('invalid_status','وضعیت انتشار معتبر نیست.');
    if(isset($values['featured_media'])&&(!is_int($values['featured_media'])||$values['featured_media']<0||($values['featured_media']>0&&!wp_attachment_is_image($values['featured_media']))))return phb_manager_error('invalid_images','تصویر باید از کتابخانهٔ همین فروشگاه باشد.');
    if(array_key_exists('blocks',$values)){
        if(!is_array($values['blocks'])||!array_is_list($values['blocks'])||count($values['blocks'])>80)return phb_manager_error('invalid_blocks','حداکثر ۸۰ بخش متن مجاز است.');
        $content='';foreach($values['blocks'] as $block){
            if(!is_array($block)||array_diff(array_keys($block),array('type','text'))||!in_array($block['type']??'',array('p','h2','h3'),true)||!is_string($block['text']??null)||strlen($block['text'])>10000)return phb_manager_error('invalid_blocks','ساختار بخش متن معتبر نیست.');
            $text=esc_html($block['text']);$tag=$block['type'];$heading=$tag!=='p';$name=$heading?'heading':'paragraph';$attrs=$heading?' {"level":'.substr($tag,1).'}':'';
            $content.='<!-- wp:'.$name.$attrs.' --><'.$tag.'>'.$text.'</'.$tag.'><!-- /wp:'.$name.' -->' . "\n";
        }
        if(strlen($content)>180000)return phb_manager_error('invalid_blocks','حجم محتوا بیش از حد مجاز است.');
        unset($values['blocks']);$values['content']=$content;
    }
    return $values;
}
function phb_content_item($data){
    if(!isset($data['id']))return array_map('phb_content_item',$data);
    $raw=$data['content']['raw']??'';$parsed=phb_content_blocks($raw);$media=(int)($data['featured_media']??0);
    return array('id'=>$data['id'],'title'=>phb_content_text($data['title']['raw']??$data['title']['rendered']??''),'slug'=>$data['slug'],'status'=>$data['status'],'excerpt'=>phb_content_text($data['excerpt']['raw']??''),'featured_media'=>$media,'image'=>$media?wp_get_attachment_image_url($media,'large'):'','modified'=>$data['modified_gmt'],'blocks'=>$parsed['blocks'],'editable'=>$parsed['editable'],'protected'=>($data['type']??'')==='page'&&phb_content_protected($data['id']));
}
add_action('rest_api_init',function(){
    register_rest_route('paasta-headless/v1','/content',array('methods'=>'GET','permission_callback'=>'__return_true','callback'=>function($request){
        $type=$request->get_param('type')==='page'?'page':'post';$page=max(1,min(100,(int)$request->get_param('page')));$slug=$request->get_param('slug');
        if($slug!==null&&(!is_string($slug)||strlen($slug)>1000))return phb_manager_error('invalid_slug','نشانی معتبر نیست.');
        $query=new WP_Query(array('post_type'=>$type,'post_status'=>'publish','has_password'=>false,'posts_per_page'=>$slug?1:12,'paged'=>$page,'name'=>$slug?:'','orderby'=>'date','order'=>'DESC'));
        $items=array();foreach($query->posts as $post){if($type==='page'&&phb_content_protected($post->ID))continue;
            $parsed=phb_content_blocks($post->post_content);$image=get_post_thumbnail_id($post->ID);
            $items[]=array('id'=>$post->ID,'slug'=>$post->post_name,'title'=>phb_content_text($post->post_title),'excerpt'=>phb_content_text($post->post_excerpt),'date'=>$post->post_date_gmt,'image'=>$image?wp_get_attachment_image_url($image,'large'):'','blocks'=>$slug?$parsed['blocks']:array());
        }
        return new WP_REST_Response(array('items'=>$items,'total'=>(int)$query->found_posts),200,array('Cache-Control'=>'public, max-age=0, must-revalidate'));
    }));
});
