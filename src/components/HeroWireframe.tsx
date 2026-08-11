import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { WIRE, heroWireframe } from "@/data/heroWireframe";
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
  const [showPanel, setShowPanel] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mqReduce = window.matchMedia(Q_REDUCE);
    const mqNarrow = window.matchMedia(`(max-width: ${WIRE.mobileMaxWidth - 1}px)`);
    const mqPanel = window.matchMedia(`(min-width: ${WIRE.panelMinWidth}px)`);
    const abort = new AbortController();
    let timer = 0;

    const decide = () => {
      setMode(mqReduce.matches ? "frozen" : mqNarrow.matches ? "quiet" : "full");
      setShowPanel(!mqReduce.matches && mqPanel.matches);
    };
    decide();
    mqReduce.addEventListener("change", decide, { signal: abort.signal });
    mqNarrow.addEventListener("change", decide, { signal: abort.signal });
    mqPanel.addEventListener("change", decide, { signal: abort.signal });

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
      // bg-bg — общий токен палитры: собственного фона у Hero больше нет,
      //   прежний форк #070709 давал шов на стыке с Marquee.
      // isolate — страховка от улёта канвы в корневой стекинг-контекст.
      // Высота: на десктопе min-h-svh оставлен намеренно — первый экран обязан
      //   занимать вьюпорт, и контента там на 740 из 900 px. На мобиле контент
      //   экран НЕ заполняет, и justify-between растягивал его, оставляя 170 px
      //   дыры между строкой логов и заголовком — поэтому там 70svh.
//   Порог именно lg, а не md: на 768x1024 (планшет портретом) при
//   min-h-svh дыра составляла замеренные 464 px.
      className="relative isolate flex min-h-[70svh] flex-col justify-between bg-bg px-5 pb-12 pt-24 md:px-10 md:pt-28 lg:min-h-svh"
    >
      {mounted && mode ? (
        <Suspense fallback={null}>
          <WireframeHeroCanvas hostRef={heroRef} mode={mode} showPanel={showPanel} />
        </Suspense>
      ) : null}

      {/* Строка логов */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        <span className="h-2 w-2 shrink-0 animate-pulseDot rounded-full bg-accent" />
        {heroWireframe.logLine.map((part, i) => (
          <span
            key={part}
            lang="en"
            className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
              i === 0 ? "text-accent" : "text-textMuted"
            }`}
          >
            {part}
            {i === 0 ? <span className="ml-3 text-textMuted/50">·</span> : null}
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
          className="mt-9 space-y-1.5 border-t border-accent/20 pt-6"
        >
          {heroWireframe.metrics.map((m) => (
            <li key={m.tag + m.value} className="flex items-baseline gap-2 font-mono text-[13px]">
              <span lang="en" className="shrink-0 text-accent">
                [&nbsp;{m.tag}&nbsp;]
              </span>
              <span aria-hidden className="shrink-0 text-textMuted/70">
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
            // Подпись светлая, а не чёрная: замер контраста по WCAG на новой палитре
            // даёт #050505 на #D90429 = 3.88:1 (ниже AA 4.5 для текста этого
            // кегля), а #F5F5F7 на нём же = 4.82:1 и проходит.
            className="inline-flex items-center gap-3 bg-accent px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-textMain transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            {heroWireframe.cta.label}
            <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
