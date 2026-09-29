<?php
// Independent management API. Customer tokens never authorize management.
if (!defined('ABSPATH')) exit;
const PHB_MANAGER_TTL = 3600;
function phb_manager_error($code,$message,$status=400){return new WP_Error($code,$message,array('status'=>$status));}
function phb_manager_token($request){$header=$request->get_header('authorization');return is_string($header)&&preg_match('/^Bearer ([a-f0-9]{64})$/D',$header,$m)?$m[1]:'';}
function phb_manager_user($request){
    $token=phb_manager_token($request);if(!$token)return false;
    $session=get_transient('phb_manager_'.hash('sha256',$token));
    $user=is_array($session)?get_user_by('id',(int)($session['id']??0)):false;
    if(!$user||!user_can($user,'manage_options')||!hash_equals((string)($session['password']??''),hash('sha256',$user->user_pass)))return false;
    return $user;
}
function phb_manager_permission($request){$user=phb_manager_user($request);if(!$user)return phb_manager_error('manager_required','برای مدیریت فروشگاه، دوباره وارد حساب مدیر شوید.',401);wp_set_current_user($user->ID);return true;}
function phb_manager_allow_attempt($login){
    global $wpdb;
    // Serialize only the short counter update, never password hashing or external calls.
    $lock='phb-auth:'.substr(hash('sha256',DB_NAME.':'.$wpdb->prefix),0,55);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,0)',$lock))!==1)return false;
    try{
        $key='phb_attempt_'.hash('sha256',strtolower($login));$ipKey='phb_ip_'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??''));
        $attempts=(int)get_transient($key);$ipAttempts=(int)get_transient($ipKey);
        if($attempts>=5||$ipAttempts>=30)return false;
        set_transient($key,$attempts+1,900);set_transient($ipKey,$ipAttempts+1,900);return true;
    }finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
}
function phb_manager_document(){
    $post=get_post((int)get_option('paasta_design_id'));
    if(!$post||$post->post_type!=='paasta_design'||$post->post_status!=='publish')throw new RuntimeException('سند طراحی فروشگاه در دسترس نیست.');
    return array('design'=>phb_parse($post->post_content),'revision'=>hash('sha256',$post->post_content),'modified'=>$post->post_modified_gmt);
}
function phb_manager_write($design,$expected){
    global $wpdb;
    $id=(int)get_option('paasta_design_id');$lock='phb:'.substr(hash('sha256',DB_NAME.':'.$wpdb->prefix.':'.$id),0,60);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,3)',$lock))!==1)return phb_manager_error('busy','فروشگاه در حال ذخیره‌سازی است. چند لحظه بعد دوباره تلاش کنید.',409);
    try{
        clean_post_cache($id);$current=phb_manager_document();
        if(!is_string($expected)||!hash_equals($current['revision'],$expected))return phb_manager_error('conflict','طراحی در پنجرهٔ دیگری تغییر کرده است. تغییرات شما حفظ شده؛ نسخهٔ تازه را بررسی کنید.',409);
        $content=phb_serialize(phb_clean_design($design));
        if(strlen($content)>200000)return phb_manager_error('too_large','حجم تنظیمات بیش از حد مجاز است.');
        $result=wp_update_post(array('ID'=>$id,'post_content'=>wp_slash($content),'post_status'=>'publish'),true);
        if(is_wp_error($result))return phb_manager_error('save_failed','ذخیره انجام نشد. تغییرات را نگه دارید و دوباره تلاش کنید.',503);
        return phb_response(phb_manager_document());
    }catch(Exception $error){return phb_manager_error('invalid_design','ساختار طراحی معتبر نیست. تنظیمات بخش‌ها را بررسی کنید.');}
    finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
}
function phb_manager_preview($design){
    $design=phb_clean_design($design);$front=$design['settings']['frontendUrl'];
    if(!$front||!empty(parse_url($front,PHP_URL_QUERY))||!empty(parse_url($front,PHP_URL_FRAGMENT))||!in_array(parse_url($front,PHP_URL_PATH),array(null,'','/'),true))return phb_manager_error('missing_frontend','نشانی HTTPS اصلی فروشگاه را در تنظیمات اتصال وارد کنید.');
    $token=bin2hex(random_bytes(32));set_transient('phb_preview_'.hash('sha256',$token),$design,600);
    return phb_response(array('url'=>rtrim($front,'/').'/preview#'.$token,'expiresIn'=>600));
}
function phb_manager_media($attachment){$id=is_object($attachment)?$attachment->ID:(int)$attachment;return array('id'=>$id,'title'=>get_the_title($id),'url'=>wp_get_attachment_url($id),'thumbnail'=>wp_get_attachment_image_url($id,'thumbnail')?:wp_get_attachment_url($id));}
add_action('rest_api_init',function(){
    register_rest_route('paasta-headless/v1','/manage/login',array('methods'=>'POST','permission_callback'=>'__return_true','callback'=>function($request){
        $login=trim((string)$request->get_param('login'));$password=(string)$request->get_param('password');
        if(!$login||!$password||strlen($login)>254||strlen($password)>1024)return phb_manager_error('invalid_login','نام کاربری یا رمز عبور درست نیست.',401);
        // Count before authentication, including successful attempts, to bound password hashing.
        if(!phb_manager_allow_attempt($login))return phb_manager_error('rate_limit','تلاش‌های ورود زیاد بوده است. ۱۵ دقیقه دیگر امتحان کنید.',429);
        $user=wp_authenticate($login,$password);
        if(is_wp_error($user)||!user_can($user,'manage_options'))return phb_manager_error('invalid_login','نام کاربری یا رمز عبور درست نیست یا دسترسی مدیریت ندارید.',401);
        $token=bin2hex(random_bytes(32));set_transient('phb_manager_'.hash('sha256',$token),array('id'=>$user->ID,'password'=>hash('sha256',$user->user_pass)),PHB_MANAGER_TTL);
        return phb_response(array('token'=>$token,'expiresIn'=>PHB_MANAGER_TTL));
    }));
    $routes=array(
      'commerce'=>function($request){return phb_commerce($request);},
      'session'=>function(){return phb_response(array('name'=>wp_get_current_user()->display_name));},
      'logout'=>function($request){delete_transient('phb_manager_'.hash('sha256',phb_manager_token($request)));return phb_response(array('ok'=>true));},
      'read'=>function(){return phb_response(phb_manager_document());},
      'save'=>function($request){return phb_manager_write($request->get_param('design'),$request->get_param('revision'));},
      'preview'=>function($request){return phb_manager_preview($request->get_param('design'));},
      'history'=>function(){
          $items=array();foreach(wp_get_post_revisions((int)get_option('paasta_design_id'),array('posts_per_page'=>20)) as $revision){if(wp_is_post_autosave($revision))continue;$items[]=array('id'=>$revision->ID,'date'=>$revision->post_modified_gmt);}
          return phb_response(array('items'=>$items));
      },
      'restore'=>function($request){
          $revision=get_post((int)$request->get_param('id'));
          if(!$revision||$revision->post_type!=='revision'||(int)$revision->post_parent!==(int)get_option('paasta_design_id'))return phb_manager_error('invalid_revision','این نسخه متعلق به طراحی فروشگاه نیست.',404);
          return phb_manager_write(phb_parse($revision->post_content),$request->get_param('revision'));
      },
      'media'=>function($request){
          $search=sanitize_text_field((string)$request->get_param('search'));
          $items=get_posts(array('post_type'=>'attachment','post_status'=>'inherit','post_mime_type'=>'image','posts_per_page'=>24,'s'=>$search,'orderby'=>'date','order'=>'DESC'));
          return phb_response(array('items'=>array_map('phb_manager_media',$items)));
      },
      'catalog'=>function($request){
          if(!function_exists('wc_get_products'))return phb_manager_error('no_catalog','ووکامرس فعال نیست.',503);
          $search=sanitize_text_field((string)$request->get_param('search'));$kind=$request->get_param('kind');$items=array();
          if($kind==='category'){$terms=get_terms(array('taxonomy'=>'product_cat','hide_empty'=>false,'number'=>50,'search'=>$search));if(!is_wp_error($terms))foreach($terms as $term)$items[]=array('id'=>$term->term_id,'name'=>$term->name);}
          else{$posts=get_posts(array('post_type'=>'product','post_status'=>'publish','posts_per_page'=>30,'s'=>$search));foreach($posts as $post)$items[]=array('id'=>$post->ID,'name'=>$post->post_title);}
          return phb_response(array('items'=>$items));
      },
      'upload'=>function(){
          if(!current_user_can('upload_files'))return phb_manager_error('forbidden','دسترسی بارگذاری تصویر ندارید.',403);
          $file=$_FILES['file']??null;if(!$file||!empty($file['error'])||$file['size']>5*1024*1024)return phb_manager_error('invalid_file','یک تصویر با حجم کمتر از ۵ مگابایت انتخاب کنید.');
          require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/media.php';require_once ABSPATH.'wp-admin/includes/image.php';
          $allowed=array('jpg|jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp');
          $check=wp_check_filetype_and_ext($file['tmp_name'],$file['name'],$allowed);
          if(empty($check['type']))return phb_manager_error('invalid_file','فقط تصویر JPEG، PNG یا WebP مجاز است.');
          $id=media_handle_upload('file',0,array(),array('test_form'=>false,'mimes'=>$allowed));
          if(is_wp_error($id))return phb_manager_error('upload_failed','تصویر بارگذاری نشد. حجم و فضای باقی‌مانده را بررسی کنید.',503);
          return phb_response(phb_manager_media($id));
      },
    );
    foreach($routes as $path=>$callback)register_rest_route('paasta-headless/v1','/manage/'.$path,array('methods'=>'POST','permission_callback'=>'phb_manager_permission','callback'=>function($request)use($callback){try{return $callback($request);}catch(Exception $error){return phb_manager_error('request_failed','درخواست انجام نشد. دوباره تلاش کنید.',503);}}));
});
