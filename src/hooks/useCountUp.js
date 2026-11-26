import { useEffect, useState } from 'react';

// Counts from 0 to `target` over ~900ms with an ease-out curve.
// If the user prefers reduced motion, returns the final value at once.
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveDuration = prefersReduced ? 0 : duration;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const progress = effectiveDuration === 0 ? 1 : Math.min(1, (now - start) / effectiveDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
