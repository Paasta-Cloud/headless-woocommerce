import {responsiveImage} from '../../lib/responsive-image';

export default function StoreImage({src,sizes,srcSet,...props}) {
  const responsive=responsiveImage(src,sizes||(Number(props.width)>0?`${props.width}px`:'100vw'));
  return <img src={src} decoding="async" {...props} srcSet={srcSet||responsive.srcSet} sizes={sizes||responsive.sizes}/>;
}
