import React, { useRef, useEffect } from 'react';

export const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = 1920;
    let height = canvas.height = 1080;

    const particles: any[] = [];
    const colors = ['#dc2626', '#b91c1c', '#f59e0b', '#fbbf24']; // reds and yellows
    for (let i = 0; i < 40; i++) {
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
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-40"
    />
  );
};
