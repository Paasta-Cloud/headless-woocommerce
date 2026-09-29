<?php
// Native WooCommerce controllers retain validation, hooks and capability checks.
if (!defined('ABSPATH')) exit;
function phb_commerce_spec($resource,$parent=0) {
    $specs=array(
        'products'=>array('/products',array('name','type','status','description','short_description','sku','regular_price','sale_price','manage_stock','stock_quantity','stock_status','weight','dimensions','categories','images','attributes','default_attributes','virtual','featured','catalog_visibility')),
        'variations'=>array('/products/'.(int)$parent.'/variations',array('status','description','sku','regular_price','sale_price','manage_stock','stock_quantity','stock_status','weight','dimensions','image','attributes','virtual')),
        'categories'=>array('/products/categories',array('name','slug','parent','description','image')),
        'coupons'=>array('/coupons',array('code','discount_type','amount','description','date_expires','individual_use','product_ids','excluded_product_ids','usage_limit','usage_limit_per_user','limit_usage_to_x_items','free_shipping','product_categories','excluded_product_categories','exclude_sale_items','minimum_amount','maximum_amount','email_restrictions')),
        'orders'=>array('/orders',array('status','customer_note')),
        'zones'=>array('/shipping/zones',array('name','order')),
        'locations'=>array('/shipping/zones',array('locations')),
        'zone-methods'=>array('/shipping/zones/'.(int)$parent.'/methods',array('method_id','enabled','order','settings')),
        'gateways'=>array('/payment_gateways',array('enabled','title','description','settings')),
    );
    return $specs[$resource]??null;
}
function phb_commerce_private_setting($resource,$key,$field=array()){
    $public=$resource==='gateways'?array('title','description','instructions','enable_for_methods','enable_for_virtual','sandbox','testmode'):array('title','tax_status','cost','requires','min_amount','ignore_discounts','type','no_class_cost');
    $publicCost=$resource==='zone-methods'&&preg_match('/^class_cost_[0-9]+$/D',$key);
    return (!in_array($key,$public,true)&&!$publicCost)||($field['type']??'')==='password';
}
function phb_commerce_public($resource,$data){
    if(!in_array($resource,array('gateways','zone-methods'),true))return $data;
    if(isset($data['id'])){
        foreach(($data['settings']??array()) as $key=>$field){
            $private=phb_commerce_private_setting($resource,$key,$field);
            $data['settings'][$key]['configured']=$private&&!empty($field['value']);
            if($private){$data['settings'][$key]['value']='';unset($data['settings'][$key]['default']);}
            $data['settings'][$key]['private']=(bool)$private;
        }
        return $data;
    }
    return array_map(function($item)use($resource){return phb_commerce_public($resource,$item);},$data);
}
function phb_commerce_call($method,$path,$values=array(),$before=null){
    $inner=new WP_REST_Request($method,'/wc/v3'.$path);
    if($method==='GET')$inner->set_query_params($values);
    elseif(substr($path,-10)==='/locations'){$inner->set_header('Content-Type','application/json');$inner->set_body(wp_json_encode($values['locations']));}
    else $inner->set_body_params($values);
    // Record a write only after native schema validation and permission checks.
    $guard=function($result,$request)use($inner,$before){return $request===$inner&&$before&&$result===null?$before():$result;};
    if($before)add_filter('rest_dispatch_request',$guard,PHP_INT_MAX,2);
    try{return rest_do_request($inner);}finally{if($before)remove_filter('rest_dispatch_request',$guard,PHP_INT_MAX);}
}
function phb_commerce_revision($data){return hash('sha256',wp_json_encode($data));}
function phb_commerce_operation_lock($operation){global $wpdb;return 'phb-op:'.substr(hash('sha256',DB_NAME.':'.$wpdb->prefix.':'.get_current_user_id().':'.$operation),0,55);}
function phb_commerce_resolve($operation,$acknowledged){
    global $wpdb;$lock=phb_commerce_operation_lock($operation);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,0)',$lock))!==1)return phb_manager_error('busy','ذخیره هنوز در حال اجراست؛ کمی بعد نتیجه را بررسی کنید.',409);
    try{
        $key='phb_op_'.hash('sha256',get_current_user_id().':'.$operation);$record=get_option($key);
        if($record&&$record['status']==='done')return phb_response(array('resolved'=>true,'status'=>'done','id'=>$record['id']));
        if($record&&$record['status']==='pending'&&!$acknowledged)return phb_manager_error('manual_review','نتیجهٔ ذخیره نامشخص است؛ ابتدا وجود مورد و مقادیر آن را بررسی کنید.',409);
        // A durable tombstone rejects even a delayed original request. Never replay it.
        $record=array_merge($record?:array(),array('status'=>'abandoned','actor'=>get_current_user_id(),'at'=>time(),'reviewed'=>(bool)$acknowledged));
        if(get_option($key))update_option($key,$record,false);else add_option($key,$record,'','no');
        $persisted=get_option($key);
        if(!is_array($persisted)||($persisted['status']??'')!=='abandoned')return phb_manager_error('uncertain','بستن درخواست تأیید نشد؛ نتیجه را دوباره بررسی کنید.',503);
        return phb_response(array('resolved'=>true,'status'=>'abandoned'));
    }finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
}
function phb_commerce($request){
    if(!current_user_can('manage_woocommerce'))return phb_manager_error('forbidden','دسترسی مدیریت ووکامرس لازم است.',403);
    $resource=$request->get_param('resource');$verb=$request->get_param('verb')?:'list';
    $parent=$request->get_param('parentId')??0;$id=$request->get_param('id');
    if(!is_int($parent)||$parent<0||$parent>2147483647)return phb_manager_error('invalid_parent','شناسهٔ والد معتبر نیست.');
    $spec=is_string($resource)?phb_commerce_spec($resource,$parent):null;
    if(!$spec||!in_array($verb,array('list','read','create','update','operation','resolve'),true))return phb_manager_error('invalid_operation','عملیات فروشگاه معتبر نیست.');
    if(in_array($verb,array('operation','resolve'),true)){
        $operation=$request->get_param('operationKey');
        if(!is_string($operation)||!preg_match('/^[a-f0-9-]{36}$/D',$operation))return phb_manager_error('invalid_key','شناسهٔ عملیات معتبر نیست.');
        if($verb==='resolve')return phb_commerce_resolve($operation,$request->get_param('acknowledged')===true);
        $record=get_option('phb_op_'.hash('sha256',get_current_user_id().':'.$operation));
        return phb_response(array('operation'=>$record?array_intersect_key($record,array_flip(array('status','resource','verb','id','at'))):array('status'=>'unknown')));
    }
    if($resource==='variations'&&$parent<1)return phb_manager_error('invalid_parent','ابتدا محصول مادر را انتخاب کنید.');
    if($resource==='locations'&&!in_array($verb,array('read','update'),true))return phb_manager_error('unsupported','محدوده را از داخل منطقهٔ ارسال ویرایش کنید.');
    if(in_array($verb,array('read','update'),true)){
        if($resource==='gateways'){
            if(!is_string($id)||!preg_match('/^[a-zA-Z0-9_-]{1,80}$/D',$id))return phb_manager_error('invalid_id','شناسه معتبر نیست.');
        }elseif(!is_int($id)||$id<($resource==='zones'?0:1)||$id>2147483647)return phb_manager_error('invalid_id','شناسه معتبر نیست.');
    }
    if($verb==='create'&&in_array($resource,array('orders','gateways'),true))return phb_manager_error('unsupported','ایجاد این مورد از مدیریت مجاز نیست.');
    $path=$spec[0].(in_array($verb,array('read','update'),true)?'/'.$id:'');
    if($resource==='locations')$path.='/locations';
    if(in_array($verb,array('list','read'),true)){
        $query=$request->get_param('query')?:array();
        if(!is_array($query)||array_diff(array_keys($query),array('search','page','status','parent','category')))return phb_manager_error('invalid_query','فیلتر معتبر نیست.');
        $query['per_page']=20;$query['context']='edit';
        $result=phb_commerce_call('GET',$path,$query);
        if($result->is_error())return $result->as_error();
        $data=$result->get_data();$headers=$result->get_headers();
        return phb_response(array('actorId'=>get_current_user_id(),'currency'=>function_exists('get_woocommerce_currency')?get_woocommerce_currency():'',$verb==='list'?'items':'item'=>phb_commerce_public($resource,$data),'revision'=>$verb==='read'?phb_commerce_revision($data):null,'total'=>(int)($headers['X-WP-Total']??count(is_array($data)?$data:array()))));
    }
    $values=$request->get_param('values');$operation=$request->get_param('operationKey');
    if(!is_array($values)||!$values||array_diff(array_keys($values),$spec[1]))return phb_manager_error('invalid_fields','فیلدهای تغییر معتبر نیستند.');
    if($resource==='locations'){
        if(!is_array($values['locations'])||count($values['locations'])>100)return phb_manager_error('invalid_locations','حداکثر ۱۰۰ محدوده انتخاب کنید.');
        foreach($values['locations'] as $location)if(!is_array($location)||array_diff(array_keys($location),array('type','code'))||!in_array($location['type']??'',array('country','state','postcode','continent'),true)||!is_string($location['code']??null)||!preg_match('/^[A-Za-z0-9:.* -]{1,80}$/D',$location['code']))return phb_manager_error('invalid_locations','کد محدوده معتبر نیست.');
    }
    if(!is_string($operation)||!preg_match('/^[a-f0-9-]{36}$/D',$operation))return phb_manager_error('invalid_key','شناسهٔ عملیات معتبر نیست.');
    foreach(array('description','short_description') as $field)if(isset($values[$field])){if(!is_string($values[$field]))return phb_manager_error('invalid_fields','متن توضیحات معتبر نیست.');$values[$field]=wp_kses_post($values[$field]);}
    // Images must already belong to this site's media library; never import arbitrary URLs.
    $images=$values['images']??(isset($values['image'])?array($values['image']):array());
    if(!is_array($images)||count($images)>20)return phb_manager_error('invalid_images','حداکثر ۲۰ تصویر انتخاب کنید.');
    foreach($images as $image)if(!is_array($image)||array_diff(array_keys($image),array('id'))||!isset($image['id'])||!is_int($image['id'])||!wp_attachment_is_image($image['id']))return phb_manager_error('invalid_images','تصویر باید از کتابخانهٔ همین فروشگاه انتخاب شود.');
    if($resource==='orders'&&isset($values['status'])&&!in_array($values['status'],array('on-hold','processing','completed','cancelled'),true))return phb_manager_error('invalid_status','این تغییر وضعیت از پنل مجاز نیست.');
    if(in_array($resource,array('gateways','zone-methods'),true)&&isset($values['settings'])){
        if(!is_array($values['settings']))return phb_manager_error('invalid_settings','تنظیمات درگاه معتبر نیست.');
        foreach($values['settings'] as $key=>$value)if($value===''&&phb_commerce_private_setting($resource,$key))unset($values['settings'][$key]);
    }
    $actor=get_current_user_id();$key='phb_op_'.hash('sha256',$actor.':'.$operation);
    $fingerprint=hash('sha256',wp_json_encode(array($resource,$verb,$id,$parent,$values)));
    global $wpdb;
    $operationLock=phb_commerce_operation_lock($operation);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,0)',$operationLock))!==1)return phb_manager_error('busy','همین عملیات هنوز در حال انجام است.',409);
    $lock='phb-wc:'.substr(hash('sha256',DB_NAME.':'.$wpdb->prefix.':'.$resource.':'.($id??$operation).':'.$parent),0,55);
    if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,3)',$lock))!==1){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$operationLock));return phb_manager_error('busy','عملیات دیگری در حال انجام است.',409);}
    try{
        $previous=get_option($key);
        if($previous){
            if(($previous['fingerprint']??'')!==$fingerprint)return phb_manager_error('reused_key','شناسهٔ عملیات برای تغییر دیگری استفاده شده است.',409);
            if(($previous['status']??'')!=='done')return phb_manager_error('uncertain','نتیجهٔ عملیات قبلی نامشخص است؛ ابتدا مورد ذخیره‌شده را بررسی کنید. درخواست را تکرار نکنید.',409);
            return phb_response(array('ok'=>true,'id'=>$previous['id'],'replayed'=>true));
        }
        if($verb==='update'){
            $current=phb_commerce_call('GET',$path,array('context'=>'edit'));
            if($current->is_error())return $current->as_error();
            $revision=$request->get_param('revision');
            if(!is_string($revision)||!hash_equals(phb_commerce_revision($current->get_data()),$revision))return phb_manager_error('conflict','این مورد تغییر کرده است. ابتدا نسخهٔ تازه را دریافت کنید؛ فرم شما حفظ شده است.',409);
            if($resource==='orders'&&isset($values['status'])){
                $order=wc_get_order($id);
                if($order&&$order->get_status()!==$values['status']&&in_array($order->get_status(),array('refunded','cancelled','failed'),true))return phb_manager_error('terminal_order','تغییر وضعیت سفارش لغوشده، ناموفق یا بازپرداخت‌شده از این پنل مجاز نیست.',409);
                if(in_array($values['status'],array('processing','completed'),true)&&(!$order||(!$order->is_paid()&&$order->get_payment_method()!=='cod')))return phb_manager_error('unpaid','سفارش آنلاین تأیید پرداخت ندارد؛ از این پنل پرداخت را قطعی نکنید.',409);
            }
        }
        $before=function()use($key,$fingerprint,$actor,$resource,$verb,$id){
            if(!add_option($key,array('fingerprint'=>$fingerprint,'status'=>'pending','actor'=>$actor,'resource'=>$resource,'verb'=>$verb,'id'=>$id,'at'=>time()),'','no'))return phb_manager_error('busy','عملیات قبلاً دریافت شده است.',409);
            return null;
        };
        $result=phb_commerce_call($verb==='create'?'POST':'PUT',$path,$values,$before);
        if($result->is_error()){
            // Keep the operation marker: extension hooks may have partially persisted before failing.
            return $result->as_error();
        }
        $data=$result->get_data();$savedId=$data['id']??$id;
        update_option($key,array('fingerprint'=>$fingerprint,'status'=>'done','actor'=>$actor,'resource'=>$resource,'verb'=>$verb,'id'=>$savedId,'at'=>time()),false);
        $persisted=get_option($key);
        if(!is_array($persisted)||($persisted['status']??'')!=='done')return phb_manager_error('uncertain','تغییر انجام شد ولی تأیید نهایی ثبت نشد؛ پیش از تکرار، نسخهٔ ذخیره‌شده را بررسی کنید.',503);
        return phb_response(array('ok'=>true,'id'=>$savedId,'replayed'=>false));
    }catch(Throwable $error){return phb_manager_error('uncertain','پاسخ قطعی دریافت نشد. ابتدا نتیجهٔ ذخیره را بررسی کنید؛ عملیات را تکرار نکنید.',503);}
    finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$operationLock));}
}
