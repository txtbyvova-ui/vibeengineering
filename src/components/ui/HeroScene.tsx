import { Suspense, lazy, useEffect, useRef, useState } from "react";
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
  /**
   * h1: по его нижней кромке считается низ сцены. Процентом это не задать —
   * заголовок задан в vw и меняет высоту от вьюпорта, от подмены шрифта
   * и от правок копирайта (PR #6 укоротил его с двух длинных строк до трёх
   * коротких, и захардкоженные проценты сразу уехали под строку метрик).
   */
  headlineRef: RefObject<HTMLElement | null>;
  className?: string;
}

/** Зазор между низом заголовка и низом сцены: под ним начинается строка метрик. */
const GAP_BELOW_HEADLINE = 20;

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
  // Низ задаётся инлайном по замеру, проценты здесь — только запасной вариант
  // на случай, если h1 измерить не удалось.
  "pointer-events-none absolute right-0 top-[76px] bottom-[46%] w-full opacity-30 " +
  "md:top-[96px] md:bottom-[36%] md:w-[56%] md:opacity-100";

/**
 * Левый край гасим: заголовок перекрывает сцену и обязан выигрывать.
 *
 * Стопы пересчитаны под заголовок из PR #6. Замер на 1280: самая длинная
 * строка «которые приносят» кончается на x = 846, сцена начинается с 563,
 * то есть текст занимает первые ~43 % ширины бокса. Полная непрозрачность
 * с 52 % — с запасом за концом строки. Доля устойчива к ширине окна:
 * и кегль (7.4vw), и бокс (56 %) масштабируются от неё одинаково.
 */
const SCENE_MASK =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 24%, rgba(0,0,0,0.55) 40%, #000 52%)";

export default function HeroScene({ hostRef, headlineRef, className = "" }: Props) {
  const [live, setLive] = useState(false);
  /** Низ сцены в px от низа секции. null — пока не измерили, работают классы. */
  const [bottomPx, setBottomPx] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const headline = headlineRef.current;
    if (!host || !headline) return;

    const measure = () => {
      const hostRect = host.getBoundingClientRect();
      if (hostRect.height === 0) return;
      const headlineBottom = headline.getBoundingClientRect().bottom - hostRect.top;
      const next = hostRect.height - (headlineBottom + GAP_BELOW_HEADLINE);
      setBottomPx(next > 0 ? Math.round(next) : 0);
    };

    measure();
    // Высота секции меняется и от ширины окна, и от доехавших шрифтов:
    // M PLUS Rounded 1c подменяет фоллбэк и перевёрстывает заголовок.
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [hostRef, headlineRef]);

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
      ref={boxRef}
      aria-hidden
      className={`${SCENE_BOX} ${className}`}
      style={{
        maskImage: SCENE_MASK,
        WebkitMaskImage: SCENE_MASK,
        ...(bottomPx === null ? null : { bottom: bottomPx }),
      }}
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
