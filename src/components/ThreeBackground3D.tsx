import {useReducedMotion} from 'motion/react';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export type BackgroundStyleOption = 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';

interface ThreeBackground3DProps {
  disabled?: boolean;
  isFJU?: boolean;
  diffSeconds?: number;
  stylePreset?: BackgroundStyleOption;
  fpsLimit?: 30 | 60;
  intensity?: 'high' | 'medium' | 'low';
  onStatus?: (status: 'active' | 'unavailable') => void;
  compatible?: boolean;
}

// ----------------------------------------------------------------------
// GLSL SHADERS - EFEITOS 3D ALTAMENTE DISTINTOS E DESEMPENHO SILK-SMOOTH
// ----------------------------------------------------------------------
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform int uStyle; // 0: Aurora Sacra (Ondas Horizontais), 1: Véu Divino (Raios Verticais), 2: Luz dourada (Faixas difusas)
  uniform float uIntensity;
  uniform int uOctaves;
  varying vec2 vUv;

  // 2D Simplex Noise Procedural
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ) );
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractional Brownian Motion adaptável para performance extrema
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 2; i++) {
      if (i >= uOctaves) break;
      value += amplitude * snoise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 st = vUv;
    float time = uTime * 0.12;

    vec3 finalColor = vec3(0.0);
    float alpha = 0.0;

    // =============================================================
    // ESTILO 0: AURORA SACRA 3D
    // VISUAL: Ondas Douradas e Carmesim Flutuando no Horizonte
    // =============================================================
    if (uStyle == 0) {
      float wave1 = sin(st.x * 3.5 + time * 1.5 + fbm(st * 1.8)) * 0.18;
      float wave2 = cos(st.x * 2.2 - time * 1.0 + fbm(st * 1.2)) * 0.15;
      
      float waveY = 0.42 + wave1 + wave2;
      float dist = abs(st.y - waveY);
      
      float glow = exp(-dist * 4.2) * (0.85 + 0.35 * fbm(st * 2.5 + vec2(time * 0.4, 0.0)));
      
      vec3 colGold = vec3(0.95, 0.72, 0.05);   // Ouro Sacro
      vec3 colCrimson = vec3(0.52, 0.06, 0.08); // Carmesim Profundo
      vec3 colAmber = vec3(0.90, 0.45, 0.08);   // Âmbar Quente

      float mixRatio = sin(st.x * 2.5 + time * 0.8) * 0.5 + 0.5;
      vec3 waveColor = mix(colGold, colCrimson, mixRatio);
      finalColor = mix(waveColor, colAmber, glow * 0.5);

      alpha = glow * 0.65 * uIntensity * (1.0 - smoothstep(0.1, 1.0, st.y));
    }
    // =============================================================
    // ESTILO 1: VÉU DIVINO / RAIOS CELESTIAIS 3D
    // VISUAL: Raios e Cortinas Verticais Descendo do Alto do Céu
    // =============================================================
    else if (uStyle == 1) {
      vec2 topOrigin = vec2(0.5, 1.3);
      vec2 dir = st - topOrigin;
      float angle = atan(dir.x, dir.y);
      float distToTop = length(dir);

      float rayPattern1 = sin(angle * 12.0 + time * 1.6 + fbm(st * 1.8)) * 0.5 + 0.5;
      float rayPattern2 = cos(angle * 20.0 - time * 1.1 + fbm(st * 1.0)) * 0.5 + 0.5;
      float rays = (rayPattern1 * 0.65 + rayPattern2 * 0.35);

      float coneMask = (1.0 - smoothstep(0.1, 1.5, distToTop)) * smoothstep(0.0, 0.85, 1.0 - st.y);
      
      vec3 colPearlWhite = vec3(0.98, 0.96, 0.82); // Marfim Celestial
      vec3 colDivineGold = vec3(0.92, 0.68, 0.15); // Dourado Divino

      finalColor = mix(colDivineGold, colPearlWhite, rays);
      alpha = rays * coneMask * 0.40 * uIntensity;
    }
    // =============================================================
    // ESTILO 2: LUZ DOURADA
    // Broad, slowly drifting light at the edges; no portal, rings or flashing core.
    // =============================================================
    else if (uStyle == 2) {
      vec2 p = st - vec2(0.5);
      p.x *= uResolution.x / uResolution.y;
      float drift = fbm(st * 1.5 + vec2(time * 0.18, -time * 0.12)) * 0.06;
      float lower = exp(-pow((p.y + 0.36 + p.x * 0.12 + sin(time * 0.5 + p.x) * 0.05 + drift) * 6.0, 2.0));
      float upper = exp(-pow((p.y - 0.45 + p.x * 0.18 + cos(time * 0.4 + p.x) * 0.04 - drift) * 7.0, 2.0));
      float edge = smoothstep(0.12, 0.7, length(p * vec2(0.7, 1.0)));
      float light = lower * 0.72 + upper * 0.48;
      finalColor = mix(vec3(0.68, 0.36, 0.06), vec3(1.0, 0.79, 0.30), light * 0.65);
      alpha = light * (0.35 + edge * 0.65) * 0.38 * uIntensity;
    }

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const ThreeBackground3D: React.FC<ThreeBackground3DProps> = ({
  disabled = false,
  isFJU = false,
  diffSeconds = 9999,
  stylePreset = 'auto',
  fpsLimit = 60,
  intensity = 'high',
  onStatus,
  compatible = false,
}) => {
  const reducedMotion=useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  const diffSecondsRef = useRef(diffSeconds);
  useEffect(() => {
    diffSecondsRef.current = diffSeconds;
  }, [diffSeconds]);

  useEffect(() => {
    if (disabled || stylePreset === 'off' || stylePreset === 'particles_2d') return;
    if (compatible) return;
    setFallback(false);

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth || 1920;
    let height = container.clientHeight || window.innerHeight || 1080;

    // 1. CENA & CÂMERA ORTOGRÁFICA
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 2. RENDERER COM RESOLUÇÃO E RECURSOS ULTRA-OTIMIZADOS
    // Limita o pixelRatio máximo a 1.0 para evitar sobrecarregar GPUs integradas em telas 4K/Retina
    const targetPixelRatio = intensity === 'low' ? 0.5 : intensity === 'medium' ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'default', // Evita superaquecimento e reset de GPU em notebooks/PCs modestos
        // Simplex permutation exceeds the minimum mediump range on mobile GPUs.
        precision: 'highp',
      });
    } catch (e) {
      setFallback(true);
      onStatus?.('unavailable');
      console.warn("WebGL renderer creation failed, falling back safely.");
      return;
    }
    if (renderer.capabilities.precision !== 'highp') {
      renderer.dispose();
      setFallback(true); onStatus?.('unavailable');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);
    onStatus?.('active');

    // Proteção contra crash da aba em caso de GPU overload (webglcontextlost)
    let isContextLost = false;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      setFallback(true);
      onStatus?.('unavailable');
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      console.warn("WebGL Context Lost - Interrompendo renderização 3D com segurança para proteger o navegador.");
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('webglcontextlost', handleContextLost, false);

    // Decisão do estilo efetivo
    let styleInt = 0; // 0: Aurora, 1: Véu Divino, 2: Luz dourada
    let effectiveStyle = stylePreset;
    if (effectiveStyle === 'auto') {
      effectiveStyle = isFJU ? 'fju_aura' : 'aurora';
    }

    if (effectiveStyle === 'veil') styleInt = 1;
    else if (effectiveStyle === 'fju_aura') styleInt = 2;
    else styleInt = 0; // 'aurora'

    const intensityValue = intensity === 'high' ? 1.0 : intensity === 'medium' ? 0.7 : 0.45;
    let currentOctaves = intensity === 'low' ? 1 : 2;

    // 3. SHADER MATERIAL VOLUMÉTRICO SUAVE
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uStyle: { value: styleInt },
      uIntensity: { value: intensityValue },
      uOctaves: { value: currentOctaves },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const backgroundMesh = new THREE.Mesh(planeGeometry, shaderMaterial);
    scene.add(backgroundMesh);

    // 4. MICRO-PARTÍCULAS ESTELIARES DIFUSAS
    const particleScene = new THREE.Scene();
    const particleCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    particleCamera.position.z = 100;

    const particleCount = intensity === 'high' ? 100 : intensity === 'medium' ? 60 : 25;
    const geometryParticles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 130;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    geometryParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvasTex = document.createElement('canvas');
    canvasTex.width = 32;
    canvasTex.height = 32;
    const ctxTex = canvasTex.getContext('2d');
    if (ctxTex) {
      const grad = ctxTex.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(0.35, isFJU ? 'rgba(245, 158, 11, 0.4)' : 'rgba(234, 179, 8, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctxTex.fillStyle = grad;
      ctxTex.fillRect(0, 0, 32, 32);
    }
    const pTexture = new THREE.CanvasTexture(canvasTex);

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.8,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const particleSystem = new THREE.Points(geometryParticles, particleMaterial);
    particleScene.add(particleSystem);

    // Loop de animação otimizado com limitador de FPS e proteção de contexto
    let animationFrameId: number;
    let lastTime = performance.now();
    const frameInterval = 1000 / fpsLimit;
    renderer.debug.onShaderError = () => {
      isContextLost = true;
      setFallback(true); onStatus?.('unavailable');
    };
    const startTime = performance.now();

    const animate = (now: number) => {
      if (isContextLost) return;
      if(!reducedMotion)animationFrameId = requestAnimationFrame(animate);
      if(document.visibilityState==='hidden'&&!reducedMotion)return;

      const delta = now - lastTime;
      if (!reducedMotion && delta < frameInterval) return;
      lastTime = now - (delta % frameInterval);

      const elapsedTime = reducedMotion ? .5 :(now - startTime) * 0.001;
      uniforms.uTime.value = elapsedTime;

      // Movimento ultra leve das micro-partículas
      particleSystem.rotation.y = elapsedTime * 0.015;
      const posAttr = geometryParticles.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += Math.sin(elapsedTime * 0.8 + i) * 0.015;
      }
      posAttr.needsUpdate = true;

      try {
        // Render em duas camadas de transparência
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, camera);
        renderer.render(particleScene, particleCamera);
      } catch (e) {
        console.warn("Render loop caught WebGL exception, pausing animation safely:", e);
        onStatus?.('unavailable');
        setFallback(true);
        isContextLost = true;
      }
    };

    animate(performance.now());

    const handleResize = () => {
      if (!container || isContextLost) return;
      width = container.clientWidth || window.innerWidth || 1920;
      height = container.clientHeight || window.innerHeight || 1080;
      uniforms.uResolution.value.set(width, height);
      particleCamera.aspect = width / height;
      particleCamera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if(reducedMotion)animate(performance.now());
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('webglcontextlost', handleContextLost);

      planeGeometry.dispose();
      shaderMaterial.dispose();
      geometryParticles.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disabled, isFJU, stylePreset, fpsLimit, intensity, onStatus, compatible, reducedMotion]);

  if (disabled || stylePreset === 'off' || stylePreset === 'particles_2d') return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${fallback || compatible ? 'atmosphere-fallback-host' : ''} ${reducedMotion?'atmosphere-still':''}`}
      data-renderer={fallback || compatible ? 'compatible' : 'webgl'}
    >{(fallback || compatible) && <div className={`atmosphere-compatible atmosphere-${stylePreset === 'auto' ? isFJU ? 'fju_aura' : 'aurora' : stylePreset} atmosphere-intensity-${intensity}`} aria-hidden="true"><i/><i/><i/></div>}</div>
  );
};
