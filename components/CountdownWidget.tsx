"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownWidgetProps {
  targetDate: string;
  eventName?: string;
  compact?: boolean;
  onEnterArena?: () => void;
  onRemindMe?: () => void;
}

function getTimeRemaining(target: string) {
  const now = new Date().getTime();
  const targetTime = new Date(target).getTime();
  const diff = targetTime - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60 * 60));
  const seconds = Math.floor((diff % (1000 * 60 * 60)) / 1000) % 60;
  return { days, hours, minutes, seconds, expired: false };
}

function FlipCard({ value, label }: { value: number; label: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setFlipped(true);
      const timer = setTimeout(() => {
        setFlipped(false);
        setPrevValue(value);
        setTimeout(() => setDisplayValue(value), 300);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const displayVal = flipped ? prevValue : displayValue;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-16 sm:w-16 sm:h-20 perspective-1000">
        <div
          className={`relative w-full h-full transition-transform duration-300`}
        >
          <div
            className={`absolute inset-0 backface-hidden flex items-center justify-center rounded-lg bg-gradient-to-br from-[#3352CD]/80 to-[#1a1a55]/80 border border-white/20 transition-opacity duration-300`}
          >
            <span
              className={`text-xl sm:text-3xl font-bold ${
                label === "DAYS" ? "text-[#F2F8C9]" : "text-white"
              }`}
            >
              {String(displayVal).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
      <span
        className={`text-[10px] sm:text-xs uppercase tracking-widest mt-1 ${
          label === "DAYS" ? "text-[#F2F8C9]" : "text-white/50"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function CountdownWidget({
  targetDate,
  eventName = "Event Countdown",
  compact = false,
  onEnterArena,
  onRemindMe,
}: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass rounded-2xl p-4 sm:p-6 text-center ${
          compact ? "max-w-sm" : "max-w-md"
        }`}
      >
        <div className="text-2xl font-bold text-[#F2F8C9] font-heading">
          Event Started!
        </div>
        {onEnterArena && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnterArena}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#5CE3B6] to-[#3352CD] rounded-xl font-medium text-sm transition shadow-lg shadow-[#5CE3B6]/20"
          >
            Enter Arena
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <div
      className={`glass rounded-2xl p-4 sm:p-6 border border-white/10 ${
        compact ? "max-w-sm w-full" : "max-w-2xl w-full mx-auto"
      }`}
    >
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold font-heading gradient-text">
          {eventName}
        </h3>
        <p className="text-xs text-white/40 mt-1">Starts in</p>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <FlipCard value={timeLeft.days} label="DAYS" />
        <span className="text-2xl sm:text-3xl text-white/30 font-bold">:</span>
        <FlipCard value={timeLeft.hours} label="HOURS" />
        <span className="text-2xl sm:text-3xl text-white/30 font-bold">:</span>
        <FlipCard value={timeLeft.minutes} label="MINUTES" />
        <span className="text-2xl sm:text-3xl text-white/30 font-bold">:</span>
        <FlipCard value={timeLeft.seconds} label="SECONDS" />
      </div>

      {!compact && (
        <div className="mt-6 flex gap-3 justify-center">
          {onRemindMe && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={onRemindMe}
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/15 transition flex items-center gap-2"
            >
              <span>🔔</span> Remind Me
            </motion.button>
          )}
          {onEnterArena && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={onEnterArena}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3352CD] to-[#4a6cf7] text-white text-sm font-medium transition flex items-center gap-2"
            >
              <span>🚀</span> Enter Arena
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
