const widths=[160,320,480,640,960,1280,1920];

// Only our precomputed files have guaranteed siblings; never invent WP sizes.
export function responsiveImage(src,sizes='100vw') {
  const match=typeof src==='string'&&src.match(/^(https:\/\/[^?#]+\/paasta-optimized\/[a-f0-9]{24}\/image-)(\d+)w\.webp$/);
  if(!match)return {};
  const max=Number(match[2]);
  if(max<1||max>1920)return {};
  return {srcSet:[...new Set([...widths.filter(width=>width<max),max])].map(width=>`${match[1]}${width}w.webp ${width}w`).join(', '),sizes};
}
