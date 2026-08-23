"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetDate: string;
  compact?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeRemaining(target: string): TimeLeft {
  const now = new Date().getTime();
  const targetTime = new Date(target).getTime();
  const diff = targetTime - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
}

function TimeUnit({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-10 h-12 sm:w-12 sm:h-14 rounded-lg border flex items-center justify-center overflow-hidden ${
          accent
            ? "bg-gradient-to-br from-[#5CE3B6]/20 to-[#3352CD]/20 border-[#5CE3B6]/30"
            : "bg-white/5 border-white/10"
        }`}
      >
        <span className={`text-lg sm:text-xl font-bold font-heading ${accent ? "text-[#5CE3B6]" : "text-white"}`}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest mt-1 ${accent ? "text-[#5CE3B6]" : "text-white/40"}`}>
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({ targetDate, compact = false, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getTimeRemaining(targetDate);
      setTimeLeft(next);
      if (next.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Deadline Passed
      </motion.div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <TimeUnit value={timeLeft.days} label="D" accent />
        <span className="text-white/30 font-bold">:</span>
        <TimeUnit value={timeLeft.hours} label="H" />
        <span className="text-white/30 font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="M" />
        <span className="text-white/30 font-bold">:</span>
        <TimeUnit value={timeLeft.seconds} label="S" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <TimeUnit value={timeLeft.days} label="Days" accent />
      <span className="text-xl sm:text-2xl text-white/30 font-bold">:</span>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <span className="text-xl sm:text-2xl text-white/30 font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <span className="text-xl sm:text-2xl text-white/30 font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}