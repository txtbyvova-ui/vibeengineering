import { useRef } from "react";
import { HERO_METRICS, HERO_METRIC_TARGETS } from "@/data/heroMetrics";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * Строка метрик первого экрана с count-up по появлению в вьюпорте.
 *
 * Числа набраны font-mono: JetBrains Mono моноширинный, поэтому ширина строки
 * не скачет по ходу счёта. min-h резервирует высоту — строка стоит в потоке
 * над h1, и без резерва подгрузка шрифта дала бы CLS на LCP-элементе.
 */
export default function HeroMetrics({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useCountUp(ref, HERO_METRIC_TARGETS);

  return (
    <div
      ref={ref}
      className={`grid min-h-[92px] grid-cols-3 gap-4 border-t border-hairline pt-6 md:gap-8 ${className}`}
    >
      {HERO_METRICS.map((metric) => (
        <div key={metric.label}>
          <div className="font-mono text-2xl font-medium tracking-tight text-textMain md:text-4xl">
            <span data-countup>{metric.value}</span>
            {metric.suffix}
          </div>
          {/* break-words обязателен: колонка на 320 px — 83 px, а неразрывное
              «реализованных» при tracking 0.18em занимает 112 px и наезжало
              глифами на текст соседней метрики (замерено 12.9 px наложения). */}
          <div className="mono-label mt-2 block break-words">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}
