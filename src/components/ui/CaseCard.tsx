import { forwardRef, memo, useRef } from "react";
import Picture from "@/components/ui/Picture";
import { TBD, caseUiLabels } from "@/data/cases";
import { caseMedia } from "@/data/media";
import type { CaseStudy } from "@/types";

/**
 * Ширина слота по брейкпоинтам ленты: 85vw ниже sm (виден край следующей
 * карточки — лента читается как лента), 24rem на sm, 26rem от md.
 * Пропуск среднего диапазона стоил бы завышенного кандидата из srcSet
 * на 640–767 px, причём у обложек, которые грузятся `eager`.
 */
const COVER_SIZES = "(min-width: 768px) 26rem, (min-width: 640px) 24rem, 85vw";

interface CaseCardProps {
  study: CaseStudy;
  /** Первые две обложки грузим сразу — они попадают в кадр вместе с секцией. */
  eager: boolean;
  onOpen: () => void;
  /** Не даём фокусу уехать за пределы ленты при табуляции. */
  onFocus: (el: HTMLElement) => void;
}

/**
 * Карточка кейса — ТИЗЕР. На ленте видно ровно четыре вещи: обложка, клиент,
 * заголовок в одну строку и мелкая строка «тег · год». Ни задачи, ни решения,
 * ни результата, ни метрик, ни стека здесь нет — и не «скрыто через CSS»,
 * а не отрендерено вовсе. Весь контент кейса живёт только в модалке.
 *
 * Карточка — `<article>` с настоящим `h3`, а не один большой `<button>`:
 * модель содержимого кнопки допускает только phrasing content, а `h3` и `div`
 * ею не являются. Кликабельность всей площади даёт прозрачная кнопка-оверлей
 * `absolute inset-0` — у неё нет видимого текста, только `aria-label`, поэтому
 * на карточке по-прежнему «ничего больше». Она же приносит `cursor: pointer`
 * на всю площадь (preflight Tailwind ставит его любому `button`) и кольцо
 * фокуса по контуру карточки.
 */
const CaseCard = forwardRef<HTMLButtonElement, CaseCardProps>(function CaseCard(
  { study, eager, onOpen, onFocus },
  ref
) {
  const media = caseMedia[study.slug];
  const articleRef = useRef<HTMLElement>(null);

  return (
    <article
      ref={articleRef}
      // Ширина и snap живут на <li> в ленте — здесь карточка просто растягивается
      // на слот, чтобы все были одной высоты.
      className="group relative flex h-full w-full flex-col border border-hairline bg-bg text-left transition-colors duration-500 ease-premium hover:border-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
    >
      {/* Обложки может не быть: кейс заводится раньше медиа. Пробел показываем
          пунктиром — как чип стека, а не роняем всё приложение. */}
      {media ? (
        <Picture
          image={media.cover}
          sizes={COVER_SIZES}
          eager={eager}
          className="aspect-[16/10] w-full border-b border-hairline object-cover"
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-dashed border-hairline font-mono text-[10px] uppercase tracking-[0.14em] text-textMuted/60">
          {TBD}
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
          {study.client}
        </p>

        {/* Максимум ДВЕ строки, а не одна: копирайт 2026-08-11 принёс заголовки
            до 37 знаков («Выиграли тендер федерального масштаба»), и в одну
            строку они резались молча — ни в вёрстке, ни в scrollWidth обрезку
            line-clamp не видно. Карточки при этом остаются одной высоты:
            лента разложена `items-stretch`, короткий заголовок просто не
            занимает вторую строку.
            17 px до sm — не вкусовщина: ниже sm карточка занимает 85vw, и на
            320 px в бокс остаётся 222 px. При 18 px самый длинный из прежних
            заголовков вылезал на 1 px (M PLUS Rounded 1c шире прежнего
            системного фоллбэка). Лимит длины title — в types/index.ts. */}
        <h3 className="mt-3 line-clamp-2 font-display text-[17px] font-medium leading-[1.3] tracking-tightest transition-colors duration-500 ease-premium group-hover:text-accent sm:text-xl md:text-2xl">
          {study.title}
        </h3>

        <p className="mt-auto pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-textMuted">
          {study.tag} · {study.year ?? "—"}
        </p>
      </div>

      {/* Кнопка-оверлей: ничего не показывает, но делает кликабельной всю
          карточку, даёт ей cursor: pointer и кольцо фокуса по контуру. */}
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        // Ленте нужен бокс всей карточки: иначе `keepInView` подтягивал бы
        // в кадр кнопку, оставляя карточку за краем.
        onFocus={(event) => onFocus(articleRef.current ?? event.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`${caseUiLabels.openAction}: ${study.client} — ${study.title}`}
        className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    </article>
  );
});

// memo не украшение: лента перерисовывается на каждое событие scroll (индикатор
// прогресса — состояние), а карточка тянет за собой <picture> с тремя srcSet.
export default memo(CaseCard);

/** Чип стека. Плейсхолдер рисуем пунктиром — пробел должен быть виден. */
export function StackChip({ label }: { label: string }) {
  const pending = label === TBD;
  return (
    <span
      className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
        pending
          ? "border border-dashed border-hairline text-textMuted/60"
          : "border border-hairline text-textMuted"
      }`}
    >
      {label}
    </span>
  );
}
