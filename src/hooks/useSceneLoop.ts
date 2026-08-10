import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { advance } from "@react-three/fiber";

/**
 * Цикл рендера R3F-сцены. Сцена живёт на `frameloop="never"`, то есть R3F
 * не заводит собственный rAF — кадры выдаём отсюда вызовом `advance()`.
 *
 * Так цикл получается ровно один и полностью управляемый: троттл по fps,
 * пауза по `visibilitychange` и по уходу секции из вьюпорта, watchdog по частоте
 * кадров. При остановке цикла на канве остаётся последний отрисованный кадр —
 * сцена замирает статичной картинкой, страница не фризится.
 *
 * Хук общий для всех сцен первого экрана (воронка, wireframe): логика владения
 * кадрами от содержимого сцены не зависит, а копия её в каждой сцене неминуемо
 * разъехалась бы.
 *
 * ⚠️ `advance()` глобален и продвигает ВСЕ смонтированные R3F-корни. Двух живых
 * сцен на странице быть не должно — иначе каждая получит по два кадра за тик.
 */
export interface SceneLoopStats {
  fps: number;
  frames: number;
  dprCap: number;
  running: boolean;
  degradation: number;
}

export interface SceneLoopOptions {
  /** Потолок кадров. 60 при 60 Гц — кадр в кадр, 30 — каждый второй. */
  fpsCap: number;
  /** Ниже этого fps два окна подряд — шаг деградации. */
  minFps: number;
  /** Стартовый кап devicePixelRatio. */
  dprCap: number;
  /** Кап после первого шага деградации. */
  dprFallback?: number;
  /** Сколько не мерить после старта: компиляция шейдеров и reveal'ы заголовка. */
  warmupMs?: number;
  /**
   * `false` — цикл не запускается вовсе. Для `prefers-reduced-motion`: сцене
   * достаточно одного кадра, и его выдаёт сам R3F на `frameloop="demand"`.
   */
  enabled?: boolean;
}

export function useSceneLoop(
  hostRef: RefObject<HTMLElement | null>,
  options: SceneLoopOptions,
): { dprCap: number; statsRef: RefObject<SceneLoopStats> } {
  const {
    fpsCap,
    minFps,
    dprCap: initialCap,
    dprFallback = 1,
    warmupMs = 1500,
    enabled = true,
  } = options;

  const [dprCap, setDprCap] = useState<number>(initialCap);
  const statsRef = useRef<SceneLoopStats>({
    fps: 0,
    frames: 0,
    dprCap: initialCap,
    running: false,
    degradation: 0,
  });

  useEffect(() => {
    if (!enabled) return;
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

      const minStep = 1000 / fpsCap - 1;
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

      if (now - startedAt < warmupMs || degradation >= 2) return;
      if (fps >= minFps) {
        bad = 0;
        return;
      }
      if (++bad < 2) return;
      bad = 0;
      degradation++;
      stats.degradation = degradation;
      if (degradation === 1) {
        // Первый рычаг — заливка: она растёт как dpr².
        stats.dprCap = dprFallback;
        setDprCap(dprFallback);
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

    // Страница высотой ~7000 px: ниже первого экрана держать сцену живой незачем.
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
  }, [hostRef, fpsCap, minFps, dprFallback, warmupMs, enabled]);

  return { dprCap, statsRef };
}
