import {useReducedMotion} from 'motion/react';
import React, { useRef, useEffect } from 'react';

export const ParticlesBackground = ({ disabled = false, youth = false,accent }: { disabled?: boolean; youth?:boolean;accent?:string }) => {
  const reducedMotion=useReducedMotion();
  const accentRef=useRef(accent);
  const redraw=useRef<(()=>void)|null>(null);
  useEffect(()=>{accentRef.current=accent;redraw.current?.();},[accent]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 1920;
    let height = canvas.height = 1080;

    const particles: any[] = [];
    const colors = youth?['#78baff','#c9e4ff','#3c81da','#ffffff']:['#ffd34f', '#ffe797', '#dba824', '#fff3c6']; // shared black/gold atmosphere
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.1, // slight upward drift
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.02 + 0.005,
        angle: Math.random() * Math.PI * 2
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const currentAlpha = p.alpha + Math.sin(p.angle) * 0.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = accentRef.current||p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      if(!reducedMotion)animationFrameId = requestAnimationFrame(render);
    };

    redraw.current=()=>{if(reducedMotion)render();};
    render();

    return () => {
      redraw.current=null;
      cancelAnimationFrame(animationFrameId);
    };
  }, [disabled,reducedMotion,youth]);

  if (disabled) return null;

  return (
    <canvas 
      ref={canvasRef}
      data-accent={accent}
      className="absolute inset-0 z-0 pointer-events-none opacity-40 w-full h-full"
    />
  );
};
