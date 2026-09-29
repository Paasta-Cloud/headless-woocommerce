import HomeSection from './components/home-sections';
import {defaultDesign} from '../lib/design';

export default function CraftStore({products, error, design=defaultDesign}) {
  return <div className="craft-store"><main className="craft-main"><h1 className="sr-only">{design.settings.name}</h1>{design.sections.map((section,index)=><HomeSection key={index} index={index} section={section} products={products} error={error}/>)}</main></div>;
}
