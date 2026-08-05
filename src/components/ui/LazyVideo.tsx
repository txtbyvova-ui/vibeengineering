import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import type { MediaVideo } from "@/types";

const BASE = "/media/";

interface LazyVideoProps {
  video: MediaVideo;
  className?: string;
}

/**
 * Ролик кейса. До попадания во вьюпорт не грузится ни байта: `preload="none"`
 * плюс <source>, который вообще не отрендерен, пока IntersectionObserver
 * не сообщил о пересечении.
 *
 * При `prefers-reduced-motion: reduce` автоплей не включается — вместо петли
 * показываем постер с нативными контролами. CSS-блок в index.css сюда не достаёт:
 * он гасит CSS-анимации, а не воспроизведение медиа.
 */
export default function LazyVideo({ video, className = "" }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // React вставляет <source> в уже смонтированный <video>; без load() браузер
  // о новом источнике не узнает.
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    el.load();
    if (!reduce) void el.play().catch(() => {});
  }, [visible, reduce]);

  return (
    <video
      ref={ref}
      // Постер тоже ленивый: с атрибутом на месте браузер тянет его сразу,
      // независимо от preload="none" — замерено 11 kB на первом экране.
      poster={visible ? `${BASE}${video.base}.poster.jpg` : undefined}
      width={video.width}
      height={video.height}
      preload="none"
      muted
      loop
      playsInline
      controls={reduce}
      aria-label={video.alt}
      className={className}
    >
      {visible && <source src={`${BASE}${video.base}.mp4`} type="video/mp4" />}
    </video>
  );
}
