import type {SymbolMotion} from '../utils/projection-motion';
import {useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import * as THREE from 'three';

/** Local map and bounded renderer; a shaded CSS sphere remains if WebGL is unavailable. */
export function ProjectionGlobe({light=false,enabled=true,fps=30,detail='medium'}:Partial<SymbolMotion>){
 const host=useRef<HTMLDivElement>(null);
 const reduced=useReducedMotion();
 const[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  setReady(false);
  if(light||reduced||!enabled||failed||!host.current)return;
  const container=host.current;
  let alive=true,frame=0,last=0;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:detail!=='low',powerPreference:'low-power'});}
  catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,detail==='low'?.75:detail==='medium'?1:1.5));
  renderer.setSize(280,280);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,20);camera.position.z=3.8;
  const group=new THREE.Group();group.rotation.z=.16;scene.add(group);
  const geometry=new THREE.SphereGeometry(1,detail==='low'?24:48,detail==='low'?16:32);
  const material=new THREE.MeshStandardMaterial({color:0xffe4a2,roughness:.85,metalness:.1});
  const earth=new THREE.Mesh(geometry,material);group.add(earth);
  scene.add(new THREE.AmbientLight(0xffe9ba,1.5));
  const sun=new THREE.DirectionalLight(0xfff4d7,3);sun.position.set(-3,2,4);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xba964b,.8);rim.position.set(3,-1,-2);scene.add(rim);
  const texture=new THREE.TextureLoader().load('/media/earth-land.svg',()=>{
   if(!alive)return;
   texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true;
   try{renderer.render(scene,camera);setReady(true);}catch{setFailed(true);}
  },undefined,()=>{if(alive)setFailed(true);});
  const lost=(event:Event)=>{event.preventDefault();if(alive)setFailed(true);};
  renderer.domElement.addEventListener('webglcontextlost',lost);
  const started=performance.now();
  const draw=(time:number)=>{
   if(!alive)return;
   frame=requestAnimationFrame(draw);
   if(document.visibilityState==='hidden'||time-last<1000/fps)return;
   last=time;earth.rotation.y=(time-started)*.0005-.7;
   try{renderer.render(scene,camera);}catch{setFailed(true);}
  };
  frame=requestAnimationFrame(draw);
  return()=>{
   alive=false;cancelAnimationFrame(frame);
   renderer.domElement.removeEventListener('webglcontextlost',lost);
   texture.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();
   renderer.domElement.remove();
  };
 },[light,reduced,failed,enabled,fps,detail]);
 const engine=ready&&!light&&!reduced&&enabled&&!failed?'webgl':'compatible';
 return <div ref={host} className={`projection-globe ${reduced||!enabled?'is-still':''}`} data-engine={engine} aria-hidden="true"><div className="projection-globe-sphere"/><div className="projection-globe-orbit"/></div>;
}
