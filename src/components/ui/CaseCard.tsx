import { forwardRef } from "react";
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
  index: number;
  total: number;
  /** Первые две обложки грузим сразу — они попадают в кадр вместе с секцией. */
  eager: boolean;
  onOpen: () => void;
  /** Не даём фокусу уехать за пределы ленты при табуляции. */
  onFocus: (el: HTMLElement) => void;
}

const CaseCard = forwardRef<HTMLButtonElement, CaseCardProps>(function CaseCard(
  { study, index, total, eager, onOpen, onFocus },
  ref
) {
  const media = caseMedia[study.slug];

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onFocus={(event) => onFocus(event.currentTarget)}
      aria-haspopup="dialog"
      // Без явного имени скринридер зачитывает как подпись кнопки всю карточку
      // целиком — 243 символа вместе с метриками (замерено). Внутренности при
      // этом остаются в DOM: их читает виртуальный курсор, а не метка кнопки.
      aria-label={`${caseUiLabels.openAction}: ${study.client} — ${study.title}`}
      // Ширина и snap живут на <li> в ленте — здесь карточка просто растягивается
      // на слот, чтобы все были одной высоты.
      className="group flex h-full w-full flex-col border border-hairline bg-bg text-left transition-colors duration-500 ease-premium hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-textMuted">
          <span>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-3">
            <span className="border border-hairline px-2 py-1">{study.tag}</span>
            <span>{study.year ?? "—"}</span>
          </span>
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-accent">
          {study.client}
        </p>

        {/* Ровно две строки: иначе карточки разъезжаются по высоте. */}
        <h3 className="mt-3 line-clamp-2 min-h-[2.6em] font-display text-xl font-medium leading-[1.3] tracking-tightest transition-colors duration-500 ease-premium group-hover:text-accent md:text-2xl">
          {study.title}
        </h3>

        {/* Ниже md строка короче, поэтому тот же текст занимает на строку больше */}
        <p className="mt-4 line-clamp-4 min-h-[6em] text-sm leading-[1.5] text-textMuted md:line-clamp-3 md:min-h-[4.5em]">
          {study.problem}
        </p>

        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-hairline pt-5">
          {study.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="font-display text-xl font-semibold text-accent">
                {metric.value}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase leading-[1.3] tracking-[0.1em] text-textMuted">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-textMuted transition-colors duration-300 group-hover:text-accent">
          {caseUiLabels.open}
          <span aria-hidden>→</span>
        </span>
      </div>
    </button>
  );
});

export default CaseCard;

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
