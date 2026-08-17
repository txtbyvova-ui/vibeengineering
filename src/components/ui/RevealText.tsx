import { motion } from "framer-motion";
import type { ReactNode } from "react";
import useRevealFallback from "@/hooks/useRevealFallback";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealTextProps {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Wrapper element tag. */
  as?: "div" | "span" | "li";
  className?: string;
}

/**
 * Reusable mask-slide-up reveal. The child slides up from behind a clipping
 * mask when it enters the viewport. Pair multiple with incremental `delay`
 * to reveal text word-by-word or line-by-line.
 *
 * ⚠️ **Отказывает в ВИДИМУЮ сторону, и это главное в этом файле.**
 * Приём прячет текст трансформом под `overflow: hidden`, а снимает его
 * по колбэку `IntersectionObserver`. Нет колбэка — текст не «без анимации»,
 * а невидим навсегда. 2026-08-13 так пропали все шесть заголовков секций
 * на проде; разбор и пробник — в [useRevealFallback](@/hooks/useRevealFallback).
 *
 * Поэтому при мёртвом наблюдателе анимации здесь нет вовсе: рендерится обычный
 * `span` без `motion`, без трансформа и **без `overflow: hidden`**.
 *
 * ⚠️ Попытка обойтись пропсом `animate` не работает — проверено 2026-08-13:
 * пока `whileInView` объявлен, Framer держит элемент в состоянии `initial`,
 * и `animate` его не перебивает (инлайн-стиль остаётся `translateY(110%)`).
 * Значит, спрятанное состояние нельзя просто «переанимировать» — его нельзя
 * рендерить в принципе. Не переписывать обратно на `animate`.
 */
export default function RevealText({
  children,
  delay = 0,
  duration = 0.9,
  as = "div",
  className = "",
}: RevealTextProps) {
  const MotionTag = motion[as];
  const revealBroken = useRevealFallback();

  if (revealBroken) {
    return <span className={`inline-block align-bottom ${className}`}>{children}</span>;
  }

  return (
    <span className={`inline-block overflow-hidden align-bottom ${className}`}>
      <MotionTag
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration, delay, ease: EASE }}
        className="inline-block"
      >
        {children}
      </MotionTag>
    </span>
  );
}
