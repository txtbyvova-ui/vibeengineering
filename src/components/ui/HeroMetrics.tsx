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
      className={`grid min-h-[92px] grid-cols-3 gap-3 border-t border-hairline pt-6 sm:gap-4 md:gap-8 ${className}`}
    >
      {HERO_METRICS.map((metric) => (
        <div key={metric.label}>
          {/* Без font-medium: у JetBrains Mono самохостится один вес 400,
              и запрос 500 всё равно подобрал бы его — класс бы только врал. */}
          <div className="font-mono text-2xl tracking-tight text-textMain md:text-4xl">
            <span data-countup>{metric.value}</span>
            {metric.suffix}
          </div>
          {/* Кегль и трекинг ниже sm — не косметика, а единственное, что даёт
              «реализованных» (13 знаков) влезть в колонку целиком: при 11 px /
              0.18em слово занимает 111 px против 83 px колонки на 320 px,
              и break-words рвал его посреди — «РЕАЛИЗОВАНН|ЫХ». При 9 px /
              0.06em то же слово — 77 px, помещается с запасом.
              break-words оставлен страховкой на случай слова ещё длиннее:
              без него глифы наезжали на соседнюю метрику (замерено 12.9 px). */}
          <div className="mono-label mt-2 block break-words text-[9px] tracking-[0.06em] sm:text-[10px] sm:tracking-[0.12em] md:text-[11px] md:tracking-[0.18em]">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
