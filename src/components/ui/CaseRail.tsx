import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from "react";
import CaseCard from "@/components/ui/CaseCard";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { caseUiLabels } from "@/data/cases";
import type { CaseStudy } from "@/types";

/** Сколько обложек грузим не откладывая. */
const EAGER_COUNT = 2;
/** Запас, чтобы сфокусированная карточка не прилипала к краю. */
const FOCUS_PAD = 24;

interface CaseRailProps {
  studies: CaseStudy[];
  onOpen: (index: number) => void;
  /** Ленте нужно уметь вернуть фокус на карточку после закрытия модалки. */
  cardRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
}

/**
 * Горизонтальная лента кейсов на нативном скролле.
 *
 * Никакого перехвата вертикальной прокрутки: это обычный `overflow-x` со
 * `scroll-snap`, поэтому тач-свайп, трекпад и shift+wheel работают сами собой,
 * а мобильный скролл страницы остаётся мобильным скроллом страницы.
 */
export default function CaseRail({ studies, onOpen, cardRefs }: CaseRailProps) {
  const railRef = useRef<HTMLUListElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  /** Кто последним двигал ленту — чтобы не забирать фокус на первом рендере. */
  const arrowDriven = useRef(false);
  const [progress, setProgress] = useState(0);
  const [thumb, setThumb] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reduced = usePrefersReducedMotion();

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const left = rail.scrollLeft;
    setThumb(rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1);
    setProgress(max > 0 ? Math.min(1, Math.max(0, left / max)) : 0);
    // Допуск в 1 px: дробный scrollLeft при зуме иначе не даёт дойти до края.
    setAtStart(left <= 1);
    setAtEnd(left >= max - 1);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    measure();
    rail.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => {
      rail.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure]);

  /** Шаг прокрутки — расстояние между двумя соседними карточками. */
  const step = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 0;
    const items = rail.children;
    if (items.length > 1) {
      return (
        (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft
      );
    }
    return rail.clientWidth;
  }, []);

  const scrollByCard = useCallback(
    (direction: 1 | -1) => {
      railRef.current?.scrollBy({
        left: direction * step(),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [step, reduced]
  );

  /**
   * Долистав ленту кнопкой до края, пользователь нажимает элемент, который тут же
   * становится `disabled`, — браузер снимает с него фокус и отдаёт `<body>`.
   * Следующий Tab после этого начинает обход с самого верха страницы. Переводим
   * фокус на соседнюю стрелку, но только если ленту вели именно кнопками:
   * иначе эффект утащил бы фокус к кейсам сразу после загрузки.
   */
  useEffect(() => {
    if (!arrowDriven.current) return;
    if (document.activeElement !== document.body) return;
    if (atEnd && !atStart) prevRef.current?.focus();
    else if (atStart && !atEnd) nextRef.current?.focus();
  }, [atStart, atEnd]);

  const scrollByArrow = useCallback(
    (direction: 1 | -1) => {
      arrowDriven.current = true;
      scrollByCard(direction);
    },
    [scrollByCard]
  );

  /**
   * Табуляция не должна уводить фокус за кадр. Двигаем именно ленту, а не зовём
   * `scrollIntoView` — тот заодно прокручивает страницу по вертикали.
   */
  const keepInView = useCallback((card: HTMLElement) => {
    const rail = railRef.current;
    if (!rail) return;
    const cardBox = card.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    if (cardBox.left < railBox.left + FOCUS_PAD) {
      rail.scrollLeft -= railBox.left + FOCUS_PAD - cardBox.left;
    } else if (cardBox.right > railBox.right - FOCUS_PAD) {
      rail.scrollLeft += cardBox.right - railBox.right + FOCUS_PAD;
    }
  }, []);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByCard(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByCard(-1);
      }
    },
    [scrollByCard]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-6">
        <p className="max-w-md font-mono text-[11px] uppercase tracking-[0.14em] text-textMuted">
          {caseUiLabels.hint}
        </p>

        {/* Ниже md кнопок нет: там свайп, и они только съедали бы место */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            ref={prevRef}
            type="button"
            onClick={() => scrollByArrow(-1)}
            disabled={atStart}
            aria-label={caseUiLabels.railPrev}
            className="flex h-10 w-10 items-center justify-center border border-hairline font-mono text-sm text-textMain transition-colors duration-300 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={() => scrollByArrow(1)}
            disabled={atEnd}
            aria-label={caseUiLabels.railNext}
            className="flex h-10 w-10 items-center justify-center border border-hairline font-mono text-sm text-textMain transition-colors duration-300 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* Полоса во всю ширину экрана: карточки уходят под края, а не обрываются */}
      <div className="relative -mx-5 md:-mx-10">
        <ul
          ref={railRef}
          onKeyDown={onKeyDown}
          aria-label={caseUiLabels.railLabel}
          className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-px-5 px-5 pb-1 md:scroll-px-10 md:px-10"
        >
          {studies.map((study, i) => (
            <li key={study.slug} className="w-[85vw] shrink-0 snap-start sm:w-[24rem] md:w-[26rem]">
              <CaseCard
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                study={study}
                index={i}
                total={studies.length}
                eager={i < EAGER_COUNT}
                onOpen={() => onOpen(i)}
                onFocus={keepInView}
              />
            </li>
          ))}
        </ul>

        {/* Хвост: подсказка, что лента продолжается. Клики не перехватываем */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-bg to-transparent transition-opacity duration-300 md:w-16 ${
            atStart ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg to-transparent transition-opacity duration-300 md:w-16 ${
            atEnd ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* Индикатор прогресса: полоса, а не точки */}
      <div className="mt-8 h-px w-full overflow-hidden bg-white/10" aria-hidden>
        <div
          className="h-px bg-accent transition-transform duration-150 ease-out"
          style={{
            width: `${thumb * 100}%`,
            transform: `translateX(${(progress * (1 - thumb) * 100) / (thumb || 1)}%)`,
          }}
        />
      </div>
    </div>
  );
}
