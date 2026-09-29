<?php
require __DIR__.'/../wordpress/plugins/paasta-headless-builder/schema.php';
function check($condition) { if (!$condition) throw new RuntimeException('Design regression failed'); }
$design=phb_clean_design(phb_defaults());
check(count($design['sections'])===5);
foreach(array('javascript:alert(1)','//evil.test','https://user:pass@example.test/a','/\\evil.test','https://example.test/"</style>') as $url) check(phb_url($url)==='');
check(phb_url('/shop?q=1')==='/shop?q=1');
$raw=phb_defaults();$raw['settings']['primary']='red;display:none';$raw['sections']=array(array('type'=>'script'),array('type'=>'products','columns'=>99,'productIds'=>array(1,1,-1,'2')));
$safe=phb_clean_design($raw);check(count($safe['sections'])===1);check($safe['sections'][0]['columns']===6);check($safe['sections'][0]['productIds']===array(1));check($safe['settings']['primary']===phb_defaults()['settings']['primary']);
$raw=phb_defaults();
$raw['settings']['pages']=array('about'=>array('enabled'=>true,'title'=>'<b>About</b>','body'=>str_repeat('x',13000)),'unknown'=>array('enabled'=>true));
$raw['settings']['benefits']=array(array('icon'=>'script','title'=>'<b>Service</b>','href'=>'javascript:alert(1)'));
$raw['settings']['showSearch']=false;
$safe=phb_clean_design($raw);
check($safe['settings']['pages']['about']['title']==='About');
check(strlen($safe['settings']['pages']['about']['body'])===12000);
check(!isset($safe['settings']['pages']['unknown']));
check($safe['settings']['pages']['contact']['enabled']===false);
check($safe['settings']['showSearch']===false);
check($safe['settings']['showMobileNav']===true);
check($safe['settings']['benefits'][0]['href']==='');
check($safe['settings']['benefits'][0]['icon']==='info');
check(phb_clean_design($safe)===$safe);
echo "PHP design schema regressions passed\n";
