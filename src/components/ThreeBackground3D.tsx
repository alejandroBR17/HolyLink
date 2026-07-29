import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export type BackgroundStyleOption = 'auto' | 'aurora' | 'veil' | 'fju_aura' | 'particles_2d' | 'off';

interface ThreeBackground3DProps {
  disabled?: boolean;
  isFJU?: boolean;
  diffSeconds?: number;
  stylePreset?: BackgroundStyleOption;
  fpsLimit?: 30 | 60;
  intensity?: 'high' | 'medium' | 'low';
}

// ----------------------------------------------------------------------
// GLSL SHADERS - LUZ VOLUMÉTRICA CONTINUA E ULTRA-OPTIMIZADA
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
  uniform int uStyle; // 0: Aurora Sacra, 1: Véu Divino, 2: Aura FJU
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

  // Fractional Brownian Motion adaptável para performance maxima
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      if (i >= uOctaves) break;
      value += amplitude * snoise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 st = vUv;
    float time = uTime * 0.10;

    vec3 finalColor = vec3(0.0);
    float alpha = 0.0;

    // -------------------------------------------------------------
    // ESTILO 0: AURORA SACRA 3D (Ondas Suaves Douradas na Base)
    // -------------------------------------------------------------
    if (uStyle == 0) {
      vec2 q = vec2(0.0);
      q.x = fbm(st + vec2(0.0, time * 0.4));
      q.y = fbm(st + vec2(1.0, time * 0.2));

      vec2 r = vec2(0.0);
      r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.1 * time);
      r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.08 * time);

      float f = fbm(st + r);

      vec3 colGold = vec3(0.91, 0.70, 0.03); 
      vec3 colCrimson = vec3(0.35, 0.04, 0.04);
      vec3 colAmber = vec3(0.85, 0.45, 0.05);

      finalColor = mix(colCrimson, colGold, clamp(f * f * 4.0, 0.0, 1.0));
      finalColor = mix(finalColor, colAmber, clamp(length(q), 0.0, 1.0));

      float glow = smoothstep(0.0, 0.9, f);
      alpha = glow * 0.32 * uIntensity;
    }
    // -------------------------------------------------------------
    // ESTILO 1: VÉU DIVINO (Feixes Radiais Marfim/Dourado do Alto)
    // -------------------------------------------------------------
    else if (uStyle == 1) {
      vec2 p = st * vec2(3.0, 1.5);
      
      float ray1 = sin(p.x * 4.0 + p.y * 2.0 + time * 1.8) * 0.5 + 0.5;
      float ray2 = cos(p.x * 6.0 - p.y * 2.5 + time * 1.2) * 0.5 + 0.5;
      float noiseVal = fbm(st * 2.0 + vec2(0.0, time * 0.6));

      float beam = (ray1 * 0.6 + ray2 * 0.4) * noiseVal;

      vec3 colWarmWhite = vec3(0.98, 0.94, 0.75); 
      vec3 colDivineGold = vec3(0.90, 0.65, 0.15); 

      finalColor = mix(colDivineGold, colWarmWhite, beam);
      
      float topGlow = smoothstep(0.0, 1.0, 1.0 - st.y * 0.7);
      alpha = beam * topGlow * 0.28 * uIntensity;
    }
    // -------------------------------------------------------------
    // ESTILO 2: AURA FJU 3D (Ondas Vibrantes Joviais FJU)
    // -------------------------------------------------------------
    else if (uStyle == 2) {
      vec2 pos = st * 2.0;
      float n1 = fbm(pos + vec2(time * 0.5, time * 0.3));
      float n2 = fbm(pos * 1.3 - vec2(time * 0.2, time * 0.4));

      float wave = sin(n1 * 5.0 + n2 * 3.5) * 0.5 + 0.5;

      vec3 colBlueFJU = vec3(0.22, 0.74, 0.97);  
      vec3 colAmberFJU = vec3(0.96, 0.62, 0.07); 
      vec3 colIndigo = vec3(0.38, 0.40, 0.94);   

      finalColor = mix(colBlueFJU, colAmberFJU, wave);
      finalColor = mix(finalColor, colIndigo, clamp(n2, 0.0, 1.0));

      alpha = wave * 0.30 * uIntensity;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const diffSecondsRef = useRef(diffSeconds);
  useEffect(() => {
    diffSecondsRef.current = diffSeconds;
  }, [diffSeconds]);

  useEffect(() => {
    if (disabled || stylePreset === 'off' || stylePreset === 'particles_2d') return;

    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth || 1920;
    let height = container.clientHeight || window.innerHeight || 1080;

    // 1. CENA & CÂMERA
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 2. RENDERER (Pixel ratio adaptável para garantir NENHUM TRAVAMENTO)
    const targetPixelRatio = intensity === 'low' ? 0.5 : intensity === 'medium' ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.25);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'lowp',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);
    container.appendChild(renderer.domElement);

    // Decisão do estilo efetivo
    let styleInt = 0; // 0: Aurora, 1: Véu Divino, 2: Aura FJU
    let effectiveStyle = stylePreset;
    if (effectiveStyle === 'auto') {
      effectiveStyle = isFJU ? 'fju_aura' : 'aurora';
    }

    if (effectiveStyle === 'veil') styleInt = 1;
    else if (effectiveStyle === 'fju_aura') styleInt = 2;
    else styleInt = 0; // 'aurora'

    const intensityValue = intensity === 'high' ? 1.0 : intensity === 'medium' ? 0.7 : 0.45;
    const octaves = intensity === 'low' ? 1 : intensity === 'medium' ? 2 : 3;

    // 3. SHADER MATERIAL VOLUMÉTRICO SUAVE
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uStyle: { value: styleInt },
      uIntensity: { value: intensityValue },
      uOctaves: { value: octaves },
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

    const particleCount = intensity === 'high' ? 120 : intensity === 'medium' ? 70 : 30;
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

    // Loop de animação otimizado com limitador de FPS
    let animationFrameId: number;
    let lastTime = performance.now();
    const frameInterval = 1000 / fpsLimit;

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = now - lastTime;
      if (delta < frameInterval) return;
      lastTime = now - (delta % frameInterval);

      const elapsedTime = now * 0.001;
      uniforms.uTime.value = elapsedTime;

      // Movimento ultra leve das micro-partículas
      particleSystem.rotation.y = elapsedTime * 0.015;
      const posAttr = geometryParticles.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += Math.sin(elapsedTime * 0.8 + i) * 0.015;
      }
      posAttr.needsUpdate = true;

      // Render em duas camadas de transparência
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(scene, camera);
      renderer.render(particleScene, particleCamera);
    };

    animate(performance.now());

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth || 1920;
      height = container.clientHeight || window.innerHeight || 1080;
      uniforms.uResolution.value.set(width, height);
      particleCamera.aspect = width / height;
      particleCamera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      planeGeometry.dispose();
      shaderMaterial.dispose();
      geometryParticles.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disabled, isFJU, stylePreset, fpsLimit, intensity]);

  if (disabled || stylePreset === 'off' || stylePreset === 'particles_2d') return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000"
    />
  );
};
