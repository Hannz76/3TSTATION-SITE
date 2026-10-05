'use client';

// Adapted from the React Bits DotGrid source supplied for this project.
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import './DotGrid.css';

gsap.registerPlugin(InertiaPlugin);

const throttle = (func, limit) => {
  let lastCall = -Infinity;
  return (...args) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};

function hexToRgb(hex) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  };
}

const DotGrid = ({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style
}) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const pointerRef = useRef({ x: Infinity, y: Infinity, lastTime: 0, lastX: 0, lastY: 0 });
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const path = new window.Path2D();
    path.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return path;
  }, [dotSize]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const { width, height } = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);

    gsap.killTweensOf(dotsRef.current);
    const cell = dotSize + gap;
    const cols = Math.max(0, Math.floor((width + gap) / cell));
    const rows = Math.max(0, Math.floor((height + gap) / cell));
    const startX = (width - (cell * cols - gap)) / 2 + dotSize / 2;
    const startY = (height - (cell * rows - gap)) / 2 + dotSize / 2;
    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({ cx: startX + x * cell, cy: startY + y * cell, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    if (!circlePath) return;
    let rafId = 0;
    let inView = true;
    const proxSq = proximity * proximity;
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: px, y: py } = pointerRef.current;
      for (const dot of dotsRef.current) {
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;
        let color = baseColor;
        if (!reducedMotion && proximity > 0 && dsq <= proxSq) {
          const t = 1 - Math.sqrt(dsq) / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          color = `rgb(${r},${g},${b})`;
        }
        ctx.save();
        ctx.translate(dot.cx + dot.xOffset, dot.cy + dot.yOffset);
        ctx.fillStyle = color;
        ctx.fill(circlePath);
        ctx.restore();
      }
    };
    const frame = () => {
      draw();
      rafId = requestAnimationFrame(frame);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(rafId);
      if (!reducedMotion && inView && !document.hidden) frame();
      else draw();
    };
    const resize = () => { buildGrid(); draw(); };
    resize();
    syncAnimation();

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(wrapperRef.current);
    else window.addEventListener('resize', resize);
    const intersectionObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncAnimation(); })
      : null;
    intersectionObserver?.observe(wrapperRef.current);
    document.addEventListener('visibilitychange', syncAnimation);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', syncAnimation);
      gsap.killTweensOf(dotsRef.current);
    };
  }, [buildGrid, proximity, baseColor, activeRgb, baseRgb, circlePath, reducedMotion]);

  useEffect(() => {
    const resetPointer = () => {
      pointerRef.current.x = Infinity;
      pointerRef.current.y = Infinity;
      pointerRef.current.lastTime = 0;
    };
    resetPointer();
    if (reducedMotion) return;

    const pushDot = (dot, x, y) => {
      dot._inertiaApplied = true;
      gsap.killTweensOf(dot);
      gsap.to(dot, {
        inertia: { xOffset: x, yOffset: y, resistance },
        onComplete: () => {
          gsap.to(dot, {
            xOffset: 0,
            yOffset: 0,
            duration: returnDuration,
            ease: 'elastic.out(1,0.75)'
          });
          dot._inertiaApplied = false;
        }
      });
    };
    // The background has no pointer hit area: listen through the hero's content,
    // but only react to events within its bounds and outside modal dialogs.
    const localPoint = event => {
      const canvas = canvasRef.current;
      if (!canvas || document.querySelector('dialog[open]')) return null;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null;
    };
    const onMove = event => {
      if (event.pointerType === 'touch') return;
      const point = localPoint(event);
      if (!point) { resetPointer(); return; }
      const now = performance.now();
      const pointer = pointerRef.current;
      const dt = Math.max(1, now - pointer.lastTime);
      let vx = pointer.lastTime ? (event.clientX - pointer.lastX) / dt * 1000 : 0;
      let vy = pointer.lastTime ? (event.clientY - pointer.lastY) / dt * 1000 : 0;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      Object.assign(pointer, { ...point, lastTime: now, lastX: event.clientX, lastY: event.clientY });
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - point.x, dot.cy - point.y);
        if (speed > speedTrigger && dist < proximity && !dot._inertiaApplied) {
          pushDot(dot, dot.cx - point.x + vx * 0.005, dot.cy - point.y + vy * 0.005);
        }
      }
    };
    const onClick = event => {
      // Keyboard activation should not create a pointer-driven shockwave.
      if (event.detail === 0) return;
      const point = localPoint(event);
      if (!point) return;
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - point.x, dot.cy - point.y);
        if (dist < shockRadius && !dot._inertiaApplied) {
          const falloff = Math.max(0, 1 - dist / shockRadius);
          pushDot(dot, (dot.cx - point.x) * shockStrength * falloff, (dot.cy - point.y) * shockStrength * falloff);
        }
      }
    };
    const onPointerOut = event => { if (!event.relatedTarget) resetPointer(); };
    const throttledMove = throttle(onMove, 50);
    window.addEventListener('pointermove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);
    window.addEventListener('pointerout', onPointerOut);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('scroll', resetPointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', throttledMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', resetPointer);
      window.removeEventListener('scroll', resetPointer);
      gsap.killTweensOf(dotsRef.current);
    };
  }, [maxSpeed, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength, reducedMotion]);

  return (
    <div className={`dot-grid ${className}`} style={style} aria-hidden="true">
      <div ref={wrapperRef} className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </div>
  );
};

export default DotGrid;
