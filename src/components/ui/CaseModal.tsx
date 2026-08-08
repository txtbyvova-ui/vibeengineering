import { useCallback, useEffect, useId, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Picture from "@/components/ui/Picture";
import LazyVideo from "@/components/ui/LazyVideo";
import { StackChip } from "@/components/ui/CaseCard";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { TBD, caseBlockLabels, caseUiLabels } from "@/data/cases";
import { caseMedia } from "@/data/media";
import type { CaseStudy } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.24;

const COVER_SIZES = "(min-width: 768px) 56rem, 92vw";
const GALLERY_SIZES = "(min-width: 768px) 18rem, 44vw";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';

interface CaseModalProps {
  study: CaseStudy | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * Раскрытие кейса поверх страницы.
 *
 * Портал в `document.body` здесь обязателен: секция кейсов анимируется Framer
 * Motion, а `position: fixed` внутри трансформированного предка позиционируется
 * относительно предка, а не вьюпорта.
 */
export default function CaseModal({
  study,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: CaseModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduced = usePrefersReducedMotion();
  // Медиа может не быть: кейс заводится раньше обложки. Раскрытие от неё
  // не зависит — текст, метрики, стек и ссылка на месте, вместо картинки
  // пунктирный плейсхолдер. Иначе карточка объявляла бы себя кнопкой,
  // открывающей диалог (`aria-haspopup="dialog"`), а клик не давал бы ничего.
  const media = study ? (caseMedia[study.slug] ?? null) : null;
  const open = study !== null;

  /**
   * Блокировка прокрутки страницы.
   *
   * Не `overflow: hidden` на body: overflow с body всплывает на вьюпорт, тот
   * перестаёт быть прокручиваемым, и смещение схлопывается в ноль — открыв кейс
   * из середины страницы, после закрытия оказываешься наверху (замерено).
   * Поэтому фиксируем body с отрицательным `top` и возвращаем позицию сами.
   * Ширину полосы прокрутки компенсируем паддингом, чтобы вёрстка не дёрнулась;
   * на этом сайте полоса скрыта, так что обычно компенсация нулевая.
   */
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const gap = window.innerWidth - documentElement.clientWidth;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    // Шапка на mix-blend-difference просвечивает сквозь любую полупрозрачную
    // подложку — правило под этот класс живёт в index.css.
    body.classList.add("modal-open");

    return () => {
      body.classList.remove("modal-open");
      Object.assign(body.style, prev);
      // html { scroll-behavior: smooth } иначе разыграет возврат анимацией.
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [open]);

  // Esc, стрелки между кейсами и ловушка фокуса — один обработчик на документ.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      // У плеера ролика стрелки — перемотка. Перехватывать их под ним нельзя:
      // пользователь метит в кадр, а получает соседний кейс.
      // Модификаторы тоже не наши: Alt+← у браузера — «назад» по истории,
      // а без preventDefault срабатывало бы и переключение кейса, и уход
      // со страницы вместе с ним.
      const plainArrow =
        !(event.target instanceof HTMLMediaElement) &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey;
      if (event.key === "ArrowLeft" && hasPrev && plainArrow) {
        event.preventDefault();
        onPrev();
        return;
      }
      if (event.key === "ArrowRight" && hasNext && plainArrow) {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      // Три положения, из которых штатный Tab уводил фокус за оверлей:
      //   • фокус в <body> — так его роняет кнопка стрелки, ставшая disabled
      //     после переключения кейса (браузер снимает фокус по спецификации);
      //   • фокус на самой оболочке диалога (tabIndex=-1) — это состояние сразу
      //     после открытия, и Shift+Tab из него уходил назад по документу,
      //     а портал лежит последним ребёнком body, то есть на почту в футере;
      //   • фокус на краю списка — классический случай.
      const container = dialogRef.current;
      const outside = !container?.contains(active);
      const atStart = active === first || active === container;
      if (event.shiftKey && (atStart || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onPrev, onNext, hasPrev, hasNext]);

  // Фокус внутрь при открытии. Возврат на карточку делает вызывающая сторона:
  // она знает, какая именно карточка открывала модалку.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  // При переключении кейса стрелками прокрутка модалки должна начинаться сверху.
  // Заодно подбираем фокус: дойдя стрелкой до крайнего кейса, пользователь
  // нажимает кнопку, которая тут же становится disabled, — браузер по
  // спецификации снимает с неё фокус и отдаёт его <body>, то есть наружу диалога.
  useEffect(() => {
    if (!study) return;
    scrollRef.current?.scrollTo({ top: 0 });
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus();
  }, [study]);

  /**
   * Закрытие по клику мимо диалога — по паре pointerdown/pointerup, а не по click.
   *
   * `click` по спецификации диспатчится на общего предка целей нажатия
   * и отпускания. Пользователь, который выделял текст внутри кейса и отпустил
   * кнопку на поле оверлея, получал click на оверлее — `stopPropagation`
   * на диалоге в этом случае вообще не на пути распространения. Модалка
   * закрывалась, выделение и позиция прокрутки терялись. То же было при
   * попытке потянуть полосу прокрутки оверлея.
   */
  const pressedOnOverlay = useRef(false);
  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    pressedOnOverlay.current = event.target === event.currentTarget;
  }, []);
  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      if (pressedOnOverlay.current && event.target === event.currentTarget) onClose();
      pressedOnOverlay.current = false;
    },
    [onClose]
  );

  const timing = reduced ? { duration: 0 } : { duration: DURATION, ease: EASE };

  return createPortal(
    <AnimatePresence>
      {study && (
        <motion.div
          key="case-modal"
          // initial={false} надёжнее нулевой длительности: Framer рисует сразу
          // конечное состояние, не дожидаясь первого кадра rAF.
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={timing}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-bg/80 p-4 backdrop-blur-md md:p-10"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 12 }}
            transition={timing}
            className="relative my-auto w-full max-w-4xl border border-hairline bg-bg outline-none"
          >
            {/* Шапка: держится сверху, чтобы × и стрелки были доступны при прокрутке */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-hairline bg-bg/95 px-5 py-4 backdrop-blur md:px-8">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-textMuted">
                {study.client} · {study.tag}
                {study.year !== null && ` · ${study.year}`}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  aria-label={caseUiLabels.modalPrev}
                  className="flex h-9 w-9 items-center justify-center border border-hairline font-mono text-sm text-textMain transition-colors duration-300 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span aria-hidden>←</span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext}
                  aria-label={caseUiLabels.modalNext}
                  className="flex h-9 w-9 items-center justify-center border border-hairline font-mono text-sm text-textMain transition-colors duration-300 hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span aria-hidden>→</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={caseUiLabels.modalClose}
                  className="flex h-9 w-9 items-center justify-center border border-hairline font-mono text-sm text-textMain transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>
            </div>

            {/* tabIndex=0 — иначе с клавиатуры содержимое не прокрутить:
                в трап попадают только кнопки шапки (WCAG 2.1.1) */}
            <div
              ref={scrollRef}
              tabIndex={0}
              className="max-h-[80svh] overflow-y-auto outline-none focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-accent"
            >
              {media ? (
                <Picture
                  image={media.cover}
                  sizes={COVER_SIZES}
                  className="aspect-[16/9] w-full border-b border-hairline object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center border-b border-dashed border-hairline font-mono text-[11px] uppercase tracking-[0.16em] text-textMuted/60">
                  {TBD}
                </div>
              )}

              <div className="px-5 py-8 md:px-8 md:py-10">
                <h2
                  id={titleId}
                  className="font-display text-3xl font-medium tracking-tightest md:text-4xl"
                >
                  {study.title}
                </h2>

                <div className="mt-8 grid grid-cols-3 gap-4 border-y border-hairline py-6">
                  {study.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="font-display text-2xl font-semibold text-accent md:text-3xl">
                        {metric.value}
                      </div>
                      <div className="mt-1 break-words font-mono text-[10px] uppercase leading-[1.3] tracking-[0.12em] text-textMuted">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                <dl className="mt-8 space-y-6">
                  {caseBlockLabels.map((label, i) => (
                    <div key={label}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                        {label}
                      </dt>
                      <dd className="mt-2 max-w-2xl text-textMuted">
                        {[study.problem, study.solution, study.result][i]}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-hairline pt-6">
                  {study.stack.map((item) => (
                    <StackChip key={item} label={item} />
                  ))}
                </div>

                {media?.video && (
                  <LazyVideo
                    video={media.video}
                    scrollRootRef={scrollRef}
                    className="mt-8 aspect-[16/9] w-full border border-hairline object-cover"
                  />
                )}

                {media?.gallery && (
                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                    {media.gallery.map((image) => (
                      <Picture
                        key={image.base}
                        image={image}
                        sizes={GALLERY_SIZES}
                        className="aspect-square w-full border border-hairline object-cover"
                      />
                    ))}
                  </div>
                )}

                {study.link && (
                  <a
                    href={study.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex w-fit items-center gap-2 border border-hairline px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-textMain transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {study.link.label}
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
