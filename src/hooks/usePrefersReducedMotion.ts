import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Системная настройка «меньше движения».
 *
 * CSS-медиаблок в index.css гасит только CSS-анимации, `MotionConfig` — только
 * Framer Motion. Всё, что двигается из JS (канва, автоплей видео, длительность
 * перехода модалки), обязано спросить отдельно — вот здесь.
 */
export default function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(QUERY);
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
