import { Suspense, lazy, useEffect, useState } from "react";
import type { RefObject } from "react";
import FunnelBlueprint from "@/components/ui/FunnelBlueprint";

/**
 * Решает, что показать за заголовком Hero: живую 3D-воронку или её чертёж.
 *
 * Гейт стоит ДО динамического импорта, и это принципиально: React.lazy тянет
 * чанк в момент первого рендера компонента. Пока условие не выполнено, three.js
 * не запрашивается вовсе — телефон и пользователь с prefers-reduced-motion
 * не платят за него ни байта.
 *
 * Порядок: сначала всегда чертёж (лёгкий, вектор, без JS), и только после
 * события load — подмена на 3D. Canvas не участвует в гонке за LCP.
 */

const ConversionFunnelCanvas = lazy(() => import("@/components/ui/ConversionFunnelCanvas"));

const Q_REDUCE = "(prefers-reduced-motion: reduce)";
/** Именно так, а не (pointer: coarse): планшет с мышью получает 3D. */
const Q_FINE = "(hover: hover) and (pointer: fine)";

interface Props {
  hostRef: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Рамка сцены — общая для 3D и SVG, поэтому композиция у них одна.
 *
 * Границы не декоративные:
 *  top   — ниже шапки. Шапка на mix-blend-difference инвертирует оранжевый
 *          в голубой, и поток под ней заставлял бы «VE» мигать.
 *  bottom— выше строки метрик, иначе касса садится прямо на цифры.
 *  right — сцена в правой половине: слева заголовок, приоритет за ним.
 */
const SCENE_BOX =
  // На мобиле чертёж лежит под всем заголовком целиком, деться ему некуда —
  // поэтому там он приглушён втрое. Оффер важнее фона.
  "pointer-events-none absolute right-0 top-[76px] bottom-[46%] w-full opacity-30 " +
  "md:top-[96px] md:bottom-[36%] md:w-[56%] md:opacity-100";

/** Левый край гасим: заголовок перекрывает сцену и обязан выигрывать. */
const SCENE_MASK =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.6) 44%, #000 64%)";

export default function HeroScene({ hostRef, className = "" }: Props) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia(Q_REDUCE);
    const mqFine = window.matchMedia(Q_FINE);
    const abort = new AbortController();
    let timer = 0;

    const decide = () => {
      const allowed = !mqReduce.matches && mqFine.matches;
      if (!allowed) {
        setLive(false);
        return;
      }
      // После первого paint, а не в момент монтирования: иначе загрузка и
      // компиляция three.js встают в один кадр с отрисовкой первого экрана.
      const arm = () => {
        timer = window.setTimeout(() => setLive(true), 200);
      };
      if (document.readyState === "complete") arm();
      else window.addEventListener("load", arm, { once: true, signal: abort.signal });
    };

    decide();
    // Тумблер «Эффекты анимации» в Windows меняется мгновенно — слушаем оба.
    mqReduce.addEventListener("change", decide, { signal: abort.signal });
    mqFine.addEventListener("change", decide, { signal: abort.signal });

    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={`${SCENE_BOX} ${className}`}
      style={{ maskImage: SCENE_MASK, WebkitMaskImage: SCENE_MASK }}
    >
      {live ? (
        <Suspense fallback={<FunnelBlueprint className="h-full w-full" />}>
          <ConversionFunnelCanvas hostRef={hostRef} />
        </Suspense>
      ) : (
        <FunnelBlueprint className="h-full w-full" />
      )}
    </div>
  );
}
