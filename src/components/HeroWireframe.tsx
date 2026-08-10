import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { REDLINE, WIRE, heroWireframe } from "@/data/heroWireframe";
import type { WireMode } from "@/components/ui/WireframeHeroCanvas";

const WireframeHeroCanvas = lazy(() => import("@/components/ui/WireframeHeroCanvas"));

const EASE = [0.16, 1, 0.3, 1] as const;
const Q_REDUCE = "(prefers-reduced-motion: reduce)";

/**
 * Hero «Redline Tech»: wireframe-сцена на барицентрических координатах плюс
 * оффер поверх неё обычным DOM.
 *
 * Режимы решаются здесь, сцена их только исполняет:
 *
 * | условие | режим | что получает посетитель |
 * |---|---|---|
 * | `prefers-reduced-motion` | `frozen` | один кадр, ничего не двигается |
 * | ширина < 768 px | `quiet` | медленное вращение, без пунктирной анимации и без панели |
 * | остальное | `full` | панель параметров, бегущий пунктир, вращение |
 *
 * ⚠️ В отличие от воронки, `three` здесь грузится и на мобиле: постановка требует
 * оставить фигуру вращающейся декорацией, а векторного фолбэка у wireframe нет.
 * Цена этого решения замерена и записана в отчёт — если мобильный вес важнее
 * фигуры, нужен статический SVG-фолбэк, как у воронки.
 *
 * ⚠️ `frozen` намеренно строже постановки: там сказано «оставить фигуру медленно
 * вращающейся» и для reduced-motion тоже, но непрерывное вращение — ровно то,
 * от чего эта настройка защищает. Поэтому здесь кадр замирает.
 */
export default function HeroWireframe() {
  const heroRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<WireMode | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia(Q_REDUCE);
    const mqNarrow = window.matchMedia(`(max-width: ${WIRE.mobileMaxWidth - 1}px)`);
    const abort = new AbortController();
    let timer = 0;

    const decide = () => {
      setMode(mqReduce.matches ? "frozen" : mqNarrow.matches ? "quiet" : "full");
    };
    decide();
    mqReduce.addEventListener("change", decide, { signal: abort.signal });
    mqNarrow.addEventListener("change", decide, { signal: abort.signal });

    // Сцена монтируется после первого paint: иначе загрузка и компиляция
    // шейдеров встают в один кадр с отрисовкой первого экрана.
    const arm = () => {
      timer = window.setTimeout(() => setMounted(true), 200);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true, signal: abort.signal });

    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section
      id="top"
      ref={heroRef}
      // Фон секции свой: палитра Redline темнее брендовой и применяется только
      // здесь. isolate — страховка от улёта канвы в корневой стекинг-контекст.
      className="relative isolate flex min-h-svh flex-col justify-between px-5 pb-10 pt-32 md:px-10 md:pt-40"
      style={{ backgroundColor: REDLINE.bg }}
    >
      {mounted && mode ? (
        <Suspense fallback={null}>
          <WireframeHeroCanvas hostRef={heroRef} mode={mode} />
        </Suspense>
      ) : null}

      {/* Строка логов */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        <span className="h-2 w-2 shrink-0 animate-pulseDot rounded-full" style={{ backgroundColor: REDLINE.stroke }} />
        {heroWireframe.logLine.map((part, i) => (
          <span
            key={part}
            lang="en"
            className="font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ color: i === 0 ? REDLINE.stroke : "#77777f" }}
          >
            {part}
            {i === 0 ? <span className="ml-3 text-[#3a3a42]">·</span> : null}
          </span>
        ))}
      </motion.div>

      {/* Оффер */}
      <div className="relative z-10 mt-auto max-w-[52rem]">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.05, ease: EASE }}
          className="font-display text-[9vw] font-semibold leading-[1.04] tracking-display md:text-[5.2vw] md:leading-[1]"
        >
          {heroWireframe.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
          className="mt-7 max-w-xl text-base text-textMuted md:text-lg"
        >
          {heroWireframe.lead}
        </motion.p>

        {/* Метрики в ASCII-стиле */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.44, ease: EASE }}
          className="mt-9 space-y-1.5 border-t pt-6"
          style={{ borderColor: "rgba(255,46,46,0.18)" }}
        >
          {heroWireframe.metrics.map((m) => (
            <li key={m.tag + m.value} className="flex items-baseline gap-2 font-mono text-[13px]">
              <span lang="en" className="shrink-0" style={{ color: REDLINE.stroke }}>
                [&nbsp;{m.tag}&nbsp;]
              </span>
              <span aria-hidden className="shrink-0 text-[#4a4a52]">
                &gt;
              </span>
              <span className="text-textMain">{m.value}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
          className="mt-9"
        >
          <a
            href={heroWireframe.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: REDLINE.stroke, outlineColor: REDLINE.stroke }}
          >
            {heroWireframe.cta.label}
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
