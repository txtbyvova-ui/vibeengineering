import { useRef } from "react";
import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";
import HeroMetrics from "@/components/ui/HeroMetrics";
// Сцена Hero. Ферма (StructuralGridCanvas) осталась в дереве — переключение
// обратно это одна строка здесь; см. docs/REPORT-hero-truss-max.md.
// Обе сцены принимают одни и те же ref'ы, поэтому подмена ничего не ломает.
import HeroScene from "@/components/ui/HeroScene";
import { hero } from "@/data/hero";
import type { HeadlinePart } from "@/data/hero";

const EASE = [0.16, 1, 0.3, 1] as const;

/** CTA ведёт наружу (Telegram), а не якорем — тот же приём, что в Contact. */
const external = hero.cta.href.startsWith("http");

/** Куски заголовка → строки: `break` открывает новую. */
const lines = hero.headline.reduce<HeadlinePart[][]>((acc, part) => {
  if (part.break || acc.length === 0) acc.push([]);
  acc[acc.length - 1].push(part);
  return acc;
}, []);

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  // Бокс h1 — единственный замер, по которому сцена находит свою нижнюю
  // границу. Процент здесь сломался бы: h1 прижат mt-auto к низу, задан в vw
  // и меняет высоту от правок копирайта.
  const headlineRef = useRef<HTMLHeadingElement>(null);
  let partIndex = 0;

  return (
    <section
      id="top"
      ref={heroRef}
      // bg-bg — не косметика: собственный фон секции закрывает .bg-grid
      //   (position: fixed, z-index: -1) в пределах Hero, чтобы две сетки
      //   не накладывались друг на друга.
      // isolate — гарантирует, что канва не улетит в корневой стекинг-контекст.
      className="relative isolate flex min-h-svh flex-col justify-between bg-bg px-5 pb-10 pt-32 md:px-10 md:pt-40"
    >
      <HeroScene hostRef={heroRef} headlineRef={headlineRef} className="z-0" />

      {/* Micro-label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 flex items-center gap-3"
      >
        <span className="h-2 w-2 shrink-0 animate-pulseDot rounded-full bg-accent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          {hero.microLabel}
        </span>
      </motion.div>

      {/* H1 */}
      <div className="relative z-10 mt-auto">
        {/* Ниже md заголовок переносится по словам, и при leading < 1 маски
            RevealText срезают глифы соседних строк — держим здесь запас. */}
        <h1
          ref={headlineRef}
          className="font-display text-[11vw] font-semibold leading-[1.08] tracking-display md:text-[7.4vw] md:leading-[0.92]"
        >
          {lines.map((line, li) => (
            <span key={li} className="block">
              {line.map((part) => {
                const delay = 0.05 + partIndex++ * 0.07;
                return (
                  <span key={part.text}>
                    <RevealText
                      delay={delay}
                      // Выделение — цветом, без курсива: у M PLUS Rounded 1c
                      // курсивного начертания нет, а синтетический наклон
                      // на 106 px виден как дефект.
                      className={part.accent ? "text-accent" : undefined}
                    >
                      {part.text}
                    </RevealText>{" "}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        <HeroMetrics className="mt-10" />

        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-hairline pt-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
            className="max-w-xl text-base text-textMuted md:text-lg"
          >
            {hero.lead}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.72, ease: EASE }}
            className="md:justify-self-end"
          >
            <a
              href={hero.cta.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="btn-fill inline-flex items-center gap-3 bg-accent px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {hero.cta.label}
              <span aria-hidden>→</span>
            </a>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-textMuted md:text-right">
              {hero.ctaNote}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
