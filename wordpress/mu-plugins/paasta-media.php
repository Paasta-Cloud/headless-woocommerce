<?php
/** Preserved originals, precomputed WebP; never resize on a public request. */
defined('ABSPATH') || exit;

function phm_widths($width) {
    $max=min(1920,(int)$width);
    return array_values(array_unique(array_merge(array_filter([160,320,480,640,960,1280],static function($w)use($max){return $w<$max;}),[$max])));
}

function phm_generate($id) {
    $uploads=wp_upload_dir();
    $base=realpath($uploads['basedir']);$source=realpath(get_attached_file($id));
    // Only local, tenant-owned raster attachments. No remote URL fetching.
    if(!$base||!$source||strpos($source,$base.DIRECTORY_SEPARATOR)!==0||!is_file($source))return false;
    $info=wp_getimagesize($source);
    if(!$info||!in_array($info['mime']??'',['image/jpeg','image/png','image/webp'],true)||$info[0]*$info[1]>25000000)return false;
    $fingerprint=hash('sha256',$source.':'.filesize($source).':'.filemtime($source).':webp-v1');
    $saved=get_post_meta($id,'_paasta_media',true);
    if(is_array($saved)&&($saved['fingerprint']??'')===$fingerprint)return $saved;
    $editor=wp_get_image_editor($source);
    if(is_wp_error($editor)||!$editor->supports_mime_type('image/webp'))return false;
    $folder='/paasta-optimized/'.substr($fingerprint,0,24);
    $directory=$base.$folder;
    if(!wp_mkdir_p($directory))return false;
    $variants=[];
    // Work from largest to smallest to decode each original just once.
    foreach(array_reverse(phm_widths($info[0])) as $width){
        if($width<$editor->get_size()['width']){
            $resized=$editor->resize($width,null,false);
            if(is_wp_error($resized))return false;
        }
        $editor->set_quality(82);
        $file=$editor->save($directory.'/image-'.$width.'w.webp','image/webp');
        if(is_wp_error($file))return false;
        $variants[$width]=rtrim($uploads['baseurl'],'/').$folder.'/image-'.$width.'w.webp';
    }
    ksort($variants,SORT_NUMERIC);
    $aliases=[wp_get_attachment_url($id)];
    $metadata=wp_get_attachment_metadata($id);
    foreach(($metadata['sizes']??[]) as $size)$aliases[]=dirname(wp_get_attachment_url($id)).'/'.$size['file'];
    $saved=['fingerprint'=>$fingerprint,'aliases'=>array_unique($aliases),'src'=>end($variants),'variants'=>$variants];
    update_post_meta($id,'_paasta_media',$saved);
    delete_transient('paasta_media_index');
    return $saved;
}

function phm_index() {
    $index=get_transient('paasta_media_index');
    if(is_array($index))return $index;
    global $wpdb;
    $index=[];
    foreach($wpdb->get_col($wpdb->prepare("SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key=%s",'_paasta_media')) as $value){
        $entry=maybe_unserialize($value);
        if(!is_array($entry)||empty($entry['src'])||empty($entry['variants']))continue;
        foreach(($entry['aliases']??[]) as $alias)$index[$alias]=$entry;
    }
    set_transient('paasta_media_index',$index,3600);
    return $index;
}

function phm_transform($data,$index) {
    if(is_string($data))return $index[$data]['src']??$data;
    if(!is_array($data)&&!is_object($data))return $data;
    $object=is_object($data);$values=(array)$data;
    $entry=isset($values['src'])&&is_string($values['src'])?($index[$values['src']]??null):null;
    foreach($values as $key=>$value)$values[$key]=phm_transform($value,$index);
    if($entry){
        $values['src']=$entry['src'];
        $values['srcset']=implode(', ',array_map(static function($width,$url){return $url.' '.$width.'w';},array_keys($entry['variants']),array_values($entry['variants'])));
        if(isset($values['thumbnail']))$values['thumbnail']=$entry['variants'][320]??reset($entry['variants']);
    }
    return $object?(object)$values:$values;
}

function phm_public_response($response,$server,$request) {
    $route=$request->get_route();
    if($request->get_method()!=='GET'||$response->get_status()!==200||
        ($route!=='/paasta-headless/v1/design'&&!preg_match('#^/wc/store/v1/products(?:/[1-9][0-9]*|/categories)?$#D',$route)))return $response;
    $response->set_data(phm_transform($response->get_data(),phm_index()));
    return $response;
}
add_filter('rest_post_dispatch','phm_public_response',5,3);
// Uploads already have native attachment metadata at this point.
add_filter('wp_generate_attachment_metadata',static function($metadata,$id){
    // Defer until native metadata is persisted; avoid processing on public reads.
    if(!wp_next_scheduled('paasta_optimize_attachment',[$id]))wp_schedule_single_event(time()+10,'paasta_optimize_attachment',[$id]);
    return $metadata;
},20,2);
add_action('paasta_optimize_attachment','phm_generate');
add_action('delete_attachment',static function(){delete_transient('paasta_media_index');});
