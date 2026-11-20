import { useEffect, useRef, useState } from 'react';
import { num, useLang } from '../i18n';

interface CountUpProps {
  value: string | number;
  className?: string;
  duration?: number;
}

/** Counts a number like "65,000+" up from zero the first time it scrolls into view. */
export default function CountUp({ value, className = '', duration = 1800 }: CountUpProps) {
  const strVal = String(value);
  const match = strVal.match(/^(\D*)([\d,]+)(.*)$/);
  const target = match ? Number(match[2].replace(/,/g, '')) : 0;
  const [display, setDisplay] = useState(strVal);
  const ref = useRef<HTMLSpanElement>(null);
  const { lang } = useLang();

  useEffect(() => {
    const element = ref.current;
    if (!match || !element || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const format = (n: number) => `${match[1]}${n.toLocaleString('en-US')}${match[3]}`;
    setDisplay(format(0));
    let frame = 0;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(2, -10 * progress);
        setDisplay(format(progress === 1 ? target : Math.round(target * eased)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className={`font-numeral font-normal lining-nums tabular-nums ${className}`} aria-label={num(value, lang)}>
      <span aria-hidden="true">{num(display, lang)}</span>
    </span>
  );
}
