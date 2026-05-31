import { useEffect, useRef, useState } from "react";

interface Options {
  duration?: number;
  easing?: (t: number) => number;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function useAnimatedCounter(target: number, options: Options = {}): number {
  const { duration = 700, easing = easeOutQuart } = options;
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    startRef.current = null;

    const animate = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const current = Math.round(from + (target - from) * easedProgress);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
