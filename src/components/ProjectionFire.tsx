import {useEffect,useRef,useState,useId} from 'react';
import {useReducedMotion} from 'motion/react';
import * as THREE from 'three';
import type {SymbolMotion} from '../utils/projection-motion';

/** Beveled flame volumes share the globe's lighting, budget and compatible fallback. */
export function ProjectionFire({light=false,enabled=true,fps=30,detail='medium',youth=false}:Partial<SymbolMotion>&{youth?:boolean}){
 const gradientId=useId();
 const host=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();
 const[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  setReady(false);if(light||reduced||!enabled||failed||!host.current)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:detail!=='low',powerPreference:'low-power'});}catch{setFailed(true);return;}
  const container=host.current;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,detail==='low'?.75:detail==='medium'?1:1.5));renderer.setSize(280,280);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;container.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,20);camera.position.z=4;
  const shape=new THREE.Shape();shape.moveTo(0,-1);shape.bezierCurveTo(-1,-.9,-.95,-.1,-.52,.45);shape.bezierCurveTo(-.52,.1,-.16,-.1,-.2,.55);shape.bezierCurveTo(-.21,.9,.08,1.1,.23,1.35);shape.bezierCurveTo(.1,.65,1,.15,.75,-.5);shape.bezierCurveTo(.65,-.9,.33,-1,0,-1);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelSegments:detail==='low'?2:4,steps:1,bevelSize:.07,bevelThickness:.1,curveSegments:detail==='low'?12:24});geometry.center();
  const outerMaterial=new THREE.MeshStandardMaterial({color:youth?0x5194ed:0xd8ad57,emissive:youth?0x162e58:0x6b300b,emissiveIntensity:.12,metalness:.5,roughness:.3});
  const innerMaterial=new THREE.MeshStandardMaterial({color:youth?0xdcefff:0xffdda0,emissive:youth?0x3674b5:0xc98022,emissiveIntensity:.16,metalness:.3,roughness:.35});
  const outer=new THREE.Mesh(geometry,outerMaterial),inner=new THREE.Mesh(geometry,innerMaterial);inner.scale.set(.48,.58,.6);inner.position.set(.03,-.29,.5);
  const group=new THREE.Group();group.add(outer,inner);scene.add(group);group.rotation.y=-.2;
  scene.add(new THREE.AmbientLight(youth?0xc9e4ff:0xffdf9e,1.7));const sun=new THREE.DirectionalLight(youth?0xf0f7ff:0xfff0c1,3);sun.position.set(-3,3,4);scene.add(sun);
  let alive=true,frame=0,last=0;const start=performance.now();
  const lost=(event:Event)=>{event.preventDefault();if(alive)setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
  const draw=(now:number)=>{if(!alive)return;frame=requestAnimationFrame(draw);if(document.visibilityState==='hidden'||now-last<1000/fps)return;last=now;const t=(now-start)/1000;group.rotation.y=-.45+Math.sin(t*1.4)*.22;outer.scale.set(1+Math.sin(t*3)*.035,1+Math.sin(t*2.3)*.035,1);inner.scale.set(.48+Math.sin(t*4)*.025,.58+Math.cos(t*3)*.025,.6);try{renderer.render(scene,camera);}catch{setFailed(true);}};
  try{renderer.render(scene,camera);setReady(true);frame=requestAnimationFrame(draw);}catch{setFailed(true);}
  return()=>{alive=false;cancelAnimationFrame(frame);renderer.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();outerMaterial.dispose();innerMaterial.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[light,reduced,enabled,fps,detail,failed,youth]);
 const engine=ready&&!light&&!reduced&&enabled&&!failed?'webgl':'compatible';
 return <div ref={host} className={`projection-fire ${reduced||!enabled?'is-still':''}`} data-engine={engine} aria-hidden="true"><svg className="projection-fire-fallback" viewBox="0 0 256 256"><defs><linearGradient id={gradientId} x1="0" y1="0" x2=".3" y2="1"><stop stopColor={youth?'#e8f5ff':'#fff1b8'}/><stop offset=".5" stopColor={youth?'#7ebcff':'#efbc4e'}/><stop offset="1" stopColor={youth?'#285fa0':'#a55c12'}/></linearGradient></defs><path d="M126 228C35 228 28 153 78 94c-2 35 27 30 23-3-4-28 25-51 44-76-12 55 68 97 62 147-4 41-35 66-81 66Z" fill={`url(#${gradientId})`}/><path d="M130 220c-46 0-60-41-29-80-4 25 19 23 18 1 0-17 15-35 25-48-4 33 38 51 33 81-4 29-21 46-47 46Z" fill={youth?'#e2f4ff':'#ffeaa1'}/></svg></div>;
}
