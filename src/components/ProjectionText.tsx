import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {ThreeBackground3D, type BackgroundStyleOption} from './ThreeBackground3D';
import {ParticlesBackground} from './ParticlesBackground';
import {projectionFontSize} from '../utils/projection-text';

export function ProjectionText({text, reference}: {text: string; reference?: string}) {
  const frame = useRef<HTMLDivElement>(null);
  const paragraph = useRef<HTMLParagraphElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const container = frame.current, body = paragraph.current;
    if (!container || !body) return;
    const fit = () => {
      const style = getComputedStyle(container);
      const available = container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - (caption.current?.offsetHeight || 0) - 95;
      let size = projectionFontSize(text);
      body.style.fontSize = `${size}px`;
      while (body.scrollHeight > available && size > 30) {size = Math.max(30, size - 2); body.style.fontSize = `${size}px`;}
    };
    let alive=true;fit();
    void document.fonts?.ready.then(()=>{if(alive)fit();});
    const observer = new ResizeObserver(fit); observer.observe(container);
    return () => {alive=false;observer.disconnect();};
  }, [text, reference]);
  return <div ref={frame} className="projection-reading">
    <div className="projection-reading-rule" aria-hidden="true" />
    <p ref={paragraph} className="projection-reading-text" style={{fontSize: projectionFontSize(text)}}>{text}</p>
    {reference && <p ref={caption} className="projection-reading-reference">{reference}</p>}
  </div>;
}

// Identical 1920×1080 composition in the draft and HDMI output.
export function TextProjectionPreview({text, reference, backgroundStyle = 'auto', isFJU = false}: {text: string; reference?: string; backgroundStyle?: BackgroundStyleOption; isFJU?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => setScale(element.clientWidth / 1920);
    const observer = new ResizeObserver(resize);
    observer.observe(element); resize();
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`text-projection-preview ${isFJU?'projection-fju':''}`} aria-label="Prévia do texto em 16:9"><div style={{width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative', background: '#020204'}}><ThreeBackground3D isFJU={isFJU} stylePreset={backgroundStyle} disabled={backgroundStyle === 'off' || backgroundStyle === 'particles_2d'} fpsLimit={30} intensity="low"/><ParticlesBackground youth={isFJU} disabled={backgroundStyle !== 'particles_2d'}/><ProjectionText text={text || 'Seu texto aparece aqui'} reference={reference} /></div></div>;
}
