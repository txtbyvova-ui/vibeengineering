import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cases, casesHeading, metaCase } from "@/data/cases";
import { metaCaseImage } from "@/data/media";
import RevealText from "@/components/ui/RevealText";
import Picture from "@/components/ui/Picture";
import CaseRail from "@/components/ui/CaseRail";
import CaseModal from "@/components/ui/CaseModal";
import CasesJsonLd from "@/components/ui/CasesJsonLd";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Слот картинки мета-кейса — по трём режимам раскладки, иначе браузер возьмёт
 * из srcSet кандидат не той ступени:
 *   от lg  — фиксированный трек сетки, ровно 28rem = 448 px;
 *   md..lg — одна колонка во всю ширину за вычетом `px-10` секции и `p-12` блока;
 *   до md  — то же, но `px-5` и `p-8`.
 */
const META_SIZES =
  "(min-width: 1024px) 448px, (min-width: 768px) calc(100vw - 176px), calc(100vw - 104px)";

export default function Cases() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Какая карточка открыла модалку — на неё возвращаем фокус при закрытии. */
  const openedFrom = useRef<number | null>(null);

  // Запоминаем открытую карточку эффектом, а не внутри апдейтера setState:
  // апдейтер обязан быть чистым, в StrictMode React вызывает его дважды.
  useEffect(() => {
    if (openIndex !== null) openedFrom.current = openIndex;
  }, [openIndex]);

  const open = useCallback((index: number) => setOpenIndex(index), []);

  const close = useCallback(() => {
    setOpenIndex(null);
    const from = openedFrom.current;
    if (from !== null) cardRefs.current[from]?.focus();
    openedFrom.current = null;
  }, []);

  // Листание внутри модалки двигает и ленту — иначе при закрытии фокус уедет
  // на карточку, которой не видно.
  const step = useCallback((delta: number) => {
    setOpenIndex((current) => {
      if (current === null) return current;
      const next = current + delta;
      if (next < 0 || next >= cases.length) return current;
      return next;
    });
  }, []);

  return (
    <section id="work" className="px-5 py-24 md:px-10 md:py-40">
      <CasesJsonLd />

      <div className="mb-8 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>{casesHeading.title}</RevealText>
        </h2>
        <span className="mono-label">{casesHeading.eyebrow}</span>
      </div>

      <CaseRail studies={cases} onOpen={open} cardRefs={cardRefs} />

      <CaseModal
        study={openIndex === null ? null : cases[openIndex]}
        onClose={close}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        hasPrev={openIndex !== null && openIndex > 0}
        hasNext={openIndex !== null && openIndex < cases.length - 1}
      />

      {/* Мета-кейс: сам лендинг. В ленту не идёт — это не работа для клиента */}
      <motion.aside
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
        // Две колонки только от lg, и вторая — ФИКСИРОВАННАЯ. Обе половины
        // важны, обе замерены (768 px, 2026-08-08):
        //   • `auto`-трек не давал `w-full` картинки от чего считаться: до
        //     загрузки она занимала 3×2 px, после — 448×280, блок вырастал
        //     на 909 px и утаскивал всё, что ниже. CLS 0.98 при пороге 0.1.
        //     `w-auto` это не лечит: у незагруженной картинки нет натурального
        //     размера, атрибуты width/height задают только соотношение сторон.
        //   • На md две колонки просто не помещались: картинка забирала 448 px
        //     из 592, тексту оставалось 96 — абзац вытягивался в вертикальную
        //     ленту. Это и была та самая лишняя высота.
        className="mt-20 grid grid-cols-1 gap-8 border border-hairline p-8 md:gap-12 md:p-12 lg:grid-cols-[1fr_28rem] lg:items-start"
      >
        <div>
          <span className="mono-label">{metaCase.eyebrow}</span>

          <h3 className="mt-6 font-display text-3xl font-medium tracking-tightest md:text-4xl">
            {metaCase.title}
          </h3>

          <p className="mt-5 max-w-2xl text-textMuted">{metaCase.body}</p>
        </div>

        {/* `w-full` работает в обоих режимах: до lg колонка одна и её ширина
            определена, от lg трек фиксирован в 28rem. Место под картинку
            резервируется до загрузки — разбор в комментарии к сетке выше. */}
        <Picture
          image={metaCaseImage}
          sizes={META_SIZES}
          className="aspect-[16/10] w-full border border-hairline object-cover"
        />

        <div className="grid grid-cols-1 gap-6 border-t border-hairline pt-6 sm:grid-cols-3 lg:col-span-2">
          {metaCase.metrics.map(([value, label]) => (
            <div key={label}>
              <div className="font-display text-2xl font-semibold text-accent md:text-3xl">
                {value}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-textMuted">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Ссылки здесь нет намеренно: стояла на предыдущую версию сайта бюро
            и уводила трафик с актуального лендинга. Разбор — в data/cases.ts */}
      </motion.aside>
    </section>
  );
}
