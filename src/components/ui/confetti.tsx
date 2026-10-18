"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { readSettings } from "@/lib/app-settings";

export type ConfettiHandle = { burst: () => void };

type Piece = { x: number; y: number; vx: number; vy: number; size: number; color: string; shape: "rect" | "circle" | "star"; angle: number; spin: number; wobble: number; life: number };

const COLORS = ["#ffd968", "#ff8fa3", "#76aae0", "#7ad9a6", "#b49cff", "#ffb36b", "#ffffff"];
const GRAVITY = 0.22;
const DRAG = 0.985;

function prefersStill(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || readSettings().reducedMotion;
}

/** One cone of confetti fired from (x, y) towards `direction` (radians, 0 = right, -π/2 = up). */
function popper(x: number, y: number, direction: number, count: number, power: number): Piece[] {
  return Array.from({ length: count }, () => {
    const angle = direction + (Math.random() - 0.5) * 0.9;
    const speed = power * (0.55 + Math.random() * 0.6);
    const roll = Math.random();
    return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 6 + Math.random() * 7, color: COLORS[Math.floor(Math.random() * COLORS.length)], shape: roll < 0.6 ? "rect" : roll < 0.85 ? "circle" : "star", angle: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.35, wobble: Math.random() * Math.PI * 2, life: 1 };
  });
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Full-screen party-popper confetti on a canvas that never blocks clicks. Fires once on mount; call
 * `burst()` through a ref to pop again. Does nothing when the device or the app asks for less motion.
 */
export const Confetti = forwardRef<ConfettiHandle, { autoFire?: boolean }>(function Confetti({ autoFire = true }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pieces = useRef<Piece[]>([]);
  const frame = useRef(0);

  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { innerWidth: width, innerHeight: height } = window;
    ctx.clearRect(0, 0, width, height);
    pieces.current = pieces.current.filter((piece) => piece.life > 0 && piece.y < height + 40);
    for (const piece of pieces.current) {
      piece.vx *= DRAG;
      piece.vy = piece.vy * DRAG + GRAVITY;
      piece.wobble += 0.12;
      piece.x += piece.vx + Math.sin(piece.wobble) * 0.6;
      piece.y += piece.vy;
      piece.angle += piece.spin;
      if (piece.vy > 0) piece.life -= 0.004;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, piece.life * 1.5));
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.angle);
      ctx.fillStyle = piece.color;
      if (piece.shape === "rect") { ctx.scale(1, Math.cos(piece.wobble)); ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2); }
      else if (piece.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, piece.size / 3, 0, Math.PI * 2); ctx.fill(); }
      else drawStar(ctx, piece.size / 1.6);
      ctx.restore();
    }
    frame.current = pieces.current.length ? requestAnimationFrame(tick) : 0;
  }, []);

  const burst = useCallback(() => {
    if (prefersStill()) return;
    const { innerWidth: width, innerHeight: height } = window;
    const power = Math.max(14, Math.min(24, height / 38));
    const amount = width < 640 ? 70 : 120;
    // Two poppers from the bottom corners, then a shower from the top.
    pieces.current.push(...popper(0, height, -Math.PI / 3, amount, power), ...popper(width, height, (-2 * Math.PI) / 3, amount, power));
    window.setTimeout(() => { pieces.current.push(...popper(width / 2, -20, Math.PI / 2, amount, 4)); if (!frame.current) frame.current = requestAnimationFrame(tick); }, 450);
    if (!frame.current) frame.current = requestAnimationFrame(tick);
  }, [tick]);

  useImperativeHandle(ref, () => ({ burst }), [burst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const timers = autoFire ? [window.setTimeout(burst, 250), window.setTimeout(burst, 1900)] : [];
    return () => { window.removeEventListener("resize", resize); timers.forEach(window.clearTimeout); cancelAnimationFrame(frame.current); frame.current = 0; };
  }, [autoFire, burst]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
});
