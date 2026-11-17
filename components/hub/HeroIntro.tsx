"use client";
import { useEffect, useId } from "react";
import Image from "next/image";
import { LogoGradientDef } from "@/components/motion/Progress";

export const HERO_FLAG = "gsic_hero_played";
/** Runs before first paint (see app/layout.tsx) so a returning visitor never sees the intro start. */
export const HERO_SCRIPT = `try{if(sessionStorage.getItem("${HERO_FLAG}"))document.documentElement.setAttribute("data-hero-played","1")}catch(e){}`;

/** The G mark: an outline traces the mark, then the real logo file fades in. The logo itself is never redrawn. */
export function HeroMark({ size = 72 }: { size?: number }) {
  const id = useId();
  useEffect(() => {
    const t = setTimeout(() => { try { sessionStorage.setItem(HERO_FLAG, "1"); } catch { /* private mode */ } }, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <span className="hero-mark block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <defs><LogoGradientDef id={id} /></defs>
        <circle cx="50" cy="50" r="41" pathLength={1} stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" transform="rotate(-38 50 50)" />
      </svg>
      <Image src="/favicon.png" alt="" width={size} height={size} sizes={`${size}px`} priority className="relative block object-contain" style={{ width: size, height: size }} />
    </span>
  );
}

/** Headline that rises word by word. `startIndex` continues the stagger across lines. */
export function HeroWords({ text, startIndex = 0, className }: { text: string; startIndex?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}><span className={`hero-word ${className ?? ""}`} style={{ "--i": startIndex + i } as React.CSSProperties}>{w}</span>{" "}</span>
      ))}
    </>
  );
}
