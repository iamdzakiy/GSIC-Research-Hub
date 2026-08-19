"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  gravity: number;
  opacity: number;
}

const COLORS = ["#5CE3B6", "#3352CD", "#F2F8C9", "#f59e0b", "#10b981", "#8b5cf6"];

export default function Confetti({
  trigger,
  onComplete,
}: {
  trigger: boolean;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 + Math.random() * 10,
          size: 4 + Math.random() * 8,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.3 + Math.random() * 0.8,
          gravity: 0.08 + Math.random() * 0.04,
          opacity: 0.8 + Math.random() * 0.2,
        });
      }
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (particles.length === 0) return;
    const animTimer = setInterval(() => {
      setAnimationFrame((a) => a + 1);
    }, 16);
    return () => clearInterval(animTimer);
  }, [particles.length]);

  // Update particle positions based on animation frame
  useEffect(() => {
    if (particles.length === 0) return;
    setParticles((prev) =>
      prev.map((p) => {
        const newVy = p.vy + p.gravity;
        const newY = p.y + newVy;
        const newX = p.x + p.vx + (Math.sin(animationFrame * 0.1 + p.id) * 0.02);
        if (newY > 110) {
          return { ...p, y: -10, x: Math.random() * 100, vy: 0.3 + Math.random() * 0.5 };
        }
        return { ...p, y: newY, x: newX, vy: newVy, opacity: p.opacity - 0.003 };
      })
    );
  }, [animationFrame]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
      style={{ top: 0, left: 0, width: "100vw", height: "100vh" }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
