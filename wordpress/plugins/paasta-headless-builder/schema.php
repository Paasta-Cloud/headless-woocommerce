<?php
// Shared public contract. No arbitrary HTML, CSS, scripts, or private options are exported.
function phb_defaults() { return json_decode(file_get_contents(__DIR__ . '/default-design.json'), true); }
function phb_text($value, $max = 200) { $value = is_string($value) ? strip_tags($value) : ''; return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max); }
function phb_number($value, $min, $max, $fallback) { return is_numeric($value) ? max($min, min($max, (int) round((float) $value))) : $fallback; }
function phb_color($value, $fallback = '') { return is_string($value) && preg_match('/^#[a-f0-9]{6}$/i', $value) ? $value : $fallback; }
function phb_url($value, $asset = false) {
    if (!is_string($value) || strlen($value) > 2048 || preg_match('/[\s<>"\'\\\\\x00-\x1f]/u', $value)) return '';
    if (!$asset && ((substr($value, 0, 1) === '/' && substr($value, 0, 2) !== '//') || preg_match('/^#[a-z0-9_-]+$/i', $value))) return $value;
    $url = parse_url($value);
    return is_array($url) && ($url['scheme'] ?? '') === 'https' && !empty($url['host']) && !isset($url['user']) && !isset($url['pass']) ? $value : '';
}
function phb_ids($value) { return is_array($value) ? array_slice(array_values(array_unique(array_filter($value, function($id) { return is_int($id) && $id > 0; }))), 0, 100) : array(); }
function phb_icon($value) { return in_array($value, array('home','grid','heart','bag','user','check','order','info','pin','search'), true) ? $value : 'info'; }
function phb_links($value, $fallback, $max) {
    $result = array();
    foreach (array_slice(is_array($value) ? $value : $fallback, 0, $max) as $item) {
        if (!is_array($item)) continue;
        $link = array('label'=>phb_text($item['label'] ?? '', 80), 'href'=>phb_url($item['href'] ?? ''), 'group'=>phb_text($item['group'] ?? '', 80), 'icon'=>phb_icon($item['icon'] ?? ''));
        if ($link['label'] && $link['href']) $result[] = $link;
    }
    return $result;
}
function phb_clean_design($raw) {
    if (!is_array($raw) || ($raw['version'] ?? null) !== 1 || !isset($raw['settings'], $raw['sections']) || !is_array($raw['settings']) || !is_array($raw['sections'])) throw new InvalidArgumentException('ساختار طراحی معتبر نیست.');
    $d = phb_defaults()['settings']; $s = $raw['settings']; $settings = array();
    foreach (array('name','tagline','description','announcement','announcementNote','footerText','footerNote') as $key) $settings[$key] = phb_text($s[$key] ?? $d[$key], $key === 'footerText' ? 1000 : 200);
    if (!$settings['name']) $settings['name'] = $d['name'];
    foreach (array('primary','background','surface','text','muted') as $key) $settings[$key] = phb_color($s[$key] ?? '', $d[$key]);
    foreach (array('logo','favicon','fontUrl','frontendUrl') as $key) $settings[$key] = phb_url($s[$key] ?? '', true);
    if (!preg_match('/\.woff2?(\?|$)/i', $settings['fontUrl'])) $settings['fontUrl'] = '';
    $settings['font'] = in_array($s['font'] ?? '', array('system','tahoma','custom'), true) ? $s['font'] : 'system';
    $settings['fontSize'] = phb_number($s['fontSize'] ?? null, 12, 20, 14); $settings['containerWidth'] = phb_number($s['containerWidth'] ?? null, 960, 1440, 1240);
    foreach (array('headerLinks'=>12,'footerLinks'=>36,'mobileLinks'=>5) as $key=>$max) $settings[$key] = phb_links($s[$key] ?? null, $d[$key], $max);
    $sections = array();
    foreach (array_slice($raw['sections'], 0, 40) as $value) {
        if (!is_array($value) || !in_array($value['type'] ?? '', array('hero','banners','categories','products','text-image','features','faq','spacer'), true)) continue;
        $section = array('type'=>$value['type']);
        foreach (array('title'=>200,'subtitle'=>200,'body'=>5000,'buttonLabel'=>80) as $key=>$max) $section[$key] = phb_text($value[$key] ?? '', $max);
        $section['href'] = phb_url($value['href'] ?? ''); $section['image'] = phb_url($value['image'] ?? '', true);
        $section['enabled'] = ($value['enabled'] ?? true) !== false;
        $section['visibility'] = in_array($value['visibility'] ?? '', array('all','desktop','mobile'), true) ? $value['visibility'] : 'all';
        $section['background'] = phb_color($value['background'] ?? '');
        foreach (array('columns'=>array(1,6,4),'mobileColumns'=>array(1,2,2),'gap'=>array(8,48,20),'padding'=>array(0,80,0),'spacing'=>array(0,80,24),'limit'=>array(1,100,12),'categoryId'=>array(0,2147483647,0)) as $key=>$bounds) $section[$key] = phb_number($value[$key] ?? null, $bounds[0], $bounds[1], $bounds[2]);
        $section['source'] = in_array($value['source'] ?? '', array('all','category','manual'), true) ? $value['source'] : 'all';
        $section['sort'] = in_array($value['sort'] ?? '', array('newest','cheap','expensive'), true) ? $value['sort'] : 'newest';
        $section['display'] = ($value['display'] ?? '') === 'carousel' ? 'carousel' : 'grid';
        $section['imageSide'] = ($value['imageSide'] ?? '') === 'left' ? 'left' : 'right';
        $section['showFilters'] = ($value['showFilters'] ?? false) === true;
        $section['productIds'] = phb_ids($value['productIds'] ?? null); $section['categoryIds'] = phb_ids($value['categoryIds'] ?? null);
        $section['items'] = array();
        foreach (array_slice(is_array($value['items'] ?? null) ? $value['items'] : array(), 0, 20) as $item) {
            if (!is_array($item)) continue;
            $section['items'][] = array('title'=>phb_text($item['title'] ?? ''),'body'=>phb_text($item['body'] ?? '',2000),'image'=>phb_url($item['image'] ?? '',true),'href'=>phb_url($item['href'] ?? ''),'icon'=>phb_icon($item['icon'] ?? ''));
        }
        $sections[] = $section;
    }
    return array('version'=>1,'settings'=>$settings,'sections'=>$sections);
}
