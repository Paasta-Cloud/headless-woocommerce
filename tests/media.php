<?php
define('ABSPATH',__DIR__);
function add_filter(...$args){}
function add_action(...$args){}
require __DIR__.'/../wordpress/mu-plugins/paasta-media.php';
function check_media($ok){if(!$ok)throw new RuntimeException('Media regression');}
check_media(phm_widths(100)===[100]);
check_media(phm_widths(640)===[160,320,480,640]);
check_media(phm_widths(3000)===[160,320,480,640,960,1280,1920]);
$source='https://store.ir/uploads/original.png';
$entry=['src'=>'https://store.ir/uploads/optimized.webp','variants'=>[160=>'small.webp',320=>'medium.webp',640=>'large.webp']];
$index=[$source=>$entry];
$data=['settings'=>['logo'=>$source,'frontendUrl'=>'https://front.ir'],'sections'=>[['image'=>$source]],'images'=>[(object)['src'=>$source,'thumbnail'=>'old.png','srcset'=>'old.png 640w','alt'=>'Keep this']]];
$result=phm_transform($data,$index);
check_media($result['settings']['logo']===$entry['src']);
check_media($result['sections'][0]['image']===$entry['src']);
check_media($result['images'][0]->thumbnail==='medium.webp');
check_media($result['images'][0]->srcset==='small.webp 160w, medium.webp 320w, large.webp 640w');
check_media($result['images'][0]->alt==='Keep this');
check_media($result['settings']['frontendUrl']==='https://front.ir');
check_media($data['images'][0]->src===$source);
class MediaRequest{function __construct(public $route,public $method='GET'){}function get_route(){return $this->route;}function get_method(){return $this->method;}}
class MediaResponse{function __construct(public $status=200){}function get_status(){return $this->status;}function set_data($value){throw new RuntimeException('Private response touched');}}
foreach(['/wc/store/v1/cart','/wc/store/v1/checkout','/paasta-headless/v1/manage/design','/wp/v2/users','/wc/store/v1/products/1/reviews'] as $route){$r=new MediaResponse();check_media(phm_public_response($r,null,new MediaRequest($route))===$r);}
$r=new MediaResponse();check_media(phm_public_response($r,null,new MediaRequest('/wc/store/v1/products','POST'))===$r);
echo "Media responsive widths, immutable originals and private-route exclusions passed\n";
