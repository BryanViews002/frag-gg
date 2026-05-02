'use client';

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;        // delay in ms
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;     // px to travel
  duration?: number;     // ms
  once?: boolean;        // only animate once
  threshold?: number;    // 0-1
  as?: keyof JSX.IntrinsicElements;
}

export default function ScrollReveal({
  children,
  className = '',
  style,
  delay = 0,
  direction = 'up',
  distance = 30,
  duration = 600,
  once = true,
  threshold = 0.15,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    // Set initial state
    const transforms: Record<string, string> = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`,
      none: 'scale(0.97)',
    };

    el.style.opacity = '0';
    el.style.transform = transforms[direction];
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) translateX(0) scale(1)';
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.style.opacity = '0';
          el.style.transform = transforms[direction];
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction, distance, duration, once, threshold]);

  return (
    // @ts-ignore - dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

// Convenience wrapper for staggered children
export function StaggerReveal({
  children,
  className = '',
  staggerDelay = 80,
  baseDelay = 0,
  direction = 'up' as ScrollRevealProps['direction'],
}: {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  baseDelay?: number;
  direction?: ScrollRevealProps['direction'];
}) {
  return (
    <>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          delay={baseDelay + i * staggerDelay}
          direction={direction}
          className={className}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
