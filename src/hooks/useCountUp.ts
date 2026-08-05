import { useEffect } from "react";
import type { RefObject } from "react";

export interface CountUpOptions {
  /** Длительность счёта одной метрики, мс. */
  durationMs?: number;
  /** Пауза перед стартом — чтобы не спорить с reveal'ами заголовка. */
  delayMs?: number;
  /** Сдвиг между соседними метриками, мс. */
  staggerMs?: number;
  /** Доля видимости, при которой запускается счёт. */
  threshold?: number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Count-up для группы чисел внутри одного контейнера.
 *
 * Считает элементы с атрибутом `data-countup` в порядке их появления в DOM
 * и пишет напрямую в `textContent` — ни одного ре-рендера React.
 *
 * В разметке уже стоят финальные значения: так корректно без JS, для скринридеров
 * и для CLS. Хук их обнуляет только когда действительно собирается анимировать.
 *
 * При prefers-reduced-motion значения остаются финальными, анимации нет.
 */
export function useCountUp(
  containerRef: RefObject<HTMLElement | null>,
  targets: readonly number[],
  options: CountUpOptions = {},
): void {
  const { durationMs = 1100, delayMs = 700, staggerMs = 80, threshold = 0.6 } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-countup]"),
    ).slice(0, targets.length);
    if (nodes.length === 0) return;

    // MotionConfig на рукописный rAF не действует — проверяем сами.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let startedAt = 0;

    const tick = (now: number) => {
      if (startedAt === 0) startedAt = now;
      const elapsed = now - startedAt - delayMs;
      let done = true;

      nodes.forEach((node, i) => {
        const local = elapsed - i * staggerMs;
        const p = local <= 0 ? 0 : Math.min(1, local / durationMs);
        if (p < 1) done = false;
        node.textContent = String(Math.round(targets[i] * easeOutCubic(p)));
      });

      if (done) return;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        // Обнуляем только здесь, а не на монтировании: если колбэк по какой-то
        // причине не придёт (замороженный lifecycle, вкладка в фоне), в разметке
        // так и останутся настоящие значения. Показать «0» навсегда — куда хуже,
        // чем не проиграть анимацию.
        nodes.forEach((node) => (node.textContent = "0"));
        raf = requestAnimationFrame(tick);
      },
      { threshold },
    );
    io.observe(container);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      // Guard-ref «уже запускался» здесь ставить НЕЛЬЗЯ: он переживает двойной
      // прогон эффекта в StrictMode, cleanup первого прогона убьёт rAF, guard
      // заблокирует второй — и счётчик замрёт на середине. Вместо этого честно
      // отменяем и возвращаем финальные значения, чтобы второй прогон начал с нуля.
      nodes.forEach((node, i) => (node.textContent = String(targets[i])));
    };
  }, [containerRef, targets, durationMs, delayMs, staggerMs, threshold]);
}
