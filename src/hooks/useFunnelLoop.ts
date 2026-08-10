import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { advance } from "@react-three/fiber";
import { FUNNEL } from "@/data/funnel";

/**
 * Цикл рендера 3D-сцены. Сцена живёт на `frameloop="never"`, то есть R3F
 * не заводит собственный rAF — кадры выдаём отсюда вызовом `advance()`.
 *
 * Так цикл получается ровно один и полностью управляемый: троттл по fps,
 * пауза по visibilitychange и по уходу секции из вьюпорта, watchdog по частоте
 * кадров. При остановке цикла на канве остаётся последний отрисованный кадр —
 * сцена замирает статичной картинкой, страница не фризится.
 */
export interface FunnelLoopStats {
  fps: number;
  frames: number;
  dprCap: number;
  running: boolean;
  degradation: number;
}

export function useFunnelLoop(hostRef: RefObject<HTMLElement | null>): {
  dprCap: number;
  statsRef: RefObject<FunnelLoopStats>;
} {
  const [dprCap, setDprCap] = useState<number>(FUNNEL.dprCap);
  const statsRef = useRef<FunnelLoopStats>({
    fps: 0,
    frames: 0,
    dprCap: FUNNEL.dprCap,
    running: false,
    degradation: 0,
  });

  useEffect(() => {
    const host = hostRef.current;
    let raf = 0;
    let last = 0;
    let visible = true;
    let focused = !document.hidden;
    let degradation = 0;

    // Окно измерения частоты кадров.
    let winFrames = 0;
    let winStart = 0;
    let bad = 0;
    let startedAt = 0;

    const stats = statsRef.current;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);

      const minStep = 1000 / FUNNEL.fpsCap - 1;
      if (last !== 0 && now - last < minStep) return;
      last = now;

      advance(now);

      stats.frames++;
      winFrames++;
      if (winStart === 0) winStart = now;
      if (now - winStart < 500) return;

      const fps = (winFrames * 1000) / (now - winStart);
      stats.fps = Math.round(fps * 10) / 10;
      winFrames = 0;
      winStart = now;

      // Первые полторы секунды идут reveal'ы заголовка и компиляция шейдеров —
      // мерить бессмысленно, поймаем ложное срабатывание.
      if (now - startedAt < 1500 || degradation >= 2) return;
      if (fps >= FUNNEL.minFps) {
        bad = 0;
        return;
      }
      if (++bad < 2) return;
      bad = 0;
      degradation++;
      stats.degradation = degradation;
      if (degradation === 1) {
        // Первый рычаг — заливка: она растёт как dpr².
        stats.dprCap = 1;
        setDprCap(1);
        startedAt = now;
        return;
      }
      // Второй — гасим цикл. Последний кадр остаётся на канве.
      stop();
    };

    function start() {
      if (raf || !visible || !focused) return;
      last = 0;
      winStart = 0;
      winFrames = 0;
      startedAt = performance.now();
      stats.running = true;
      raf = requestAnimationFrame(step);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      stats.running = false;
    }

    const onVisibility = () => {
      focused = !document.hidden;
      // На автотроттлинг rAF не полагаемся — гасим явно.
      if (focused) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Hero занимает первый экран страницы высотой ~7000 px: ниже него сцену
    // держать живой незачем.
    let io: IntersectionObserver | null = null;
    if (host) {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        },
        { threshold: 0 },
      );
      io.observe(host);
    }

    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
    };
  }, [hostRef]);

  return { dprCap, statsRef };
}
