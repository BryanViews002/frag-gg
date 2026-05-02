'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountAnimation(
  target: number,
  duration: number = 2000,
  startOnMount: boolean = false
) {
  const [count, setCount] = useState(0);
  const [shouldStart, setShouldStart] = useState(startOnMount);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [shouldStart, target, duration]);

  useEffect(() => {
    if (startOnMount) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnMount]);

  return { count, ref };
}
