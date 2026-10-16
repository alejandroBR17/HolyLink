import {useLayoutEffect,useRef,type ReactNode} from 'react';

/** Fits only the heading; the public stage itself always stays 1920×1080. */
export function StageHeading({children,className=''}:{children:string;className?:string}){
 const ref=useRef<HTMLHeadingElement>(null);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;let active=true;const fit=()=>{if(!active)return;el.style.fontSize='';const max=parseFloat(getComputedStyle(el).fontSize);let low=20,high=max;for(let i=0;i<9;i++){const mid=(low+high)/2;el.style.fontSize=`${mid}px`;if(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)high=mid;else low=mid;}el.style.fontSize=`${Math.floor(low)}px`;};fit();const observer=new ResizeObserver(fit);if(el.parentElement)observer.observe(el.parentElement);document.fonts?.ready.then(fit);return()=>{active=false;observer.disconnect();};},[children]);
 return <h1 ref={ref} className={className}>{children}</h1>;
}

export function RegularSlide({title,subtitle,label='ORIENTAÇÃO',symbol,layout='split-left',note}:{title:string;subtitle?:ReactNode;label?:string;symbol?:ReactNode;layout?:string;note?:ReactNode}){
 return <section className={`regular-stage regular-layout-${layout}`}><div className="regular-stage-frame" aria-hidden="true"/><div className="regular-stage-copy"><span className="regular-stage-label"><i aria-hidden="true"/>{label}</span><StageHeading>{title}</StageHeading>{subtitle&&<p className="regular-stage-description">{subtitle}</p>}{note&&<div className="regular-stage-note">{note}</div>}<span className="regular-stage-rule" aria-hidden="true"/></div>{symbol&&<div className="regular-stage-symbol" aria-hidden="true"><span/>{symbol}</div>}</section>;
}
