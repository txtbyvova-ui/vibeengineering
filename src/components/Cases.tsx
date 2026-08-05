import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cases, casesHeading, metaCase } from "@/data/cases";
import { metaCaseImage } from "@/data/media";
import RevealText from "@/components/ui/RevealText";
import Picture from "@/components/ui/Picture";
import CaseRail from "@/components/ui/CaseRail";
import CaseModal from "@/components/ui/CaseModal";
import CasesJsonLd from "@/components/ui/CasesJsonLd";

const EASE = [0.16, 1, 0.3, 1] as const;

const META_SIZES = "(min-width: 768px) 44vw, 86vw";

export default function Cases() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Какая карточка открыла модалку — на неё возвращаем фокус при закрытии. */
  const openedFrom = useRef<number | null>(null);

  const open = useCallback((index: number) => {
    openedFrom.current = index;
    setOpenIndex(index);
  }, []);

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
      openedFrom.current = next;
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
        <span lang="en" className="mono-label">
          {casesHeading.eyebrow}
        </span>
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
        className="mt-20 grid grid-cols-1 gap-8 border border-hairline p-8 md:grid-cols-[1fr_auto] md:items-start md:gap-12 md:p-12"
      >
        <div>
          <span lang="en" className="mono-label">
            {metaCase.eyebrow}
          </span>

          <h3 className="mt-6 font-display text-3xl font-medium tracking-tightest md:text-4xl">
            {metaCase.title}
          </h3>

          <p className="mt-5 max-w-2xl text-textMuted">{metaCase.body}</p>
        </div>

        <Picture
          image={metaCaseImage}
          sizes={META_SIZES}
          className="aspect-[16/10] w-full border border-hairline object-cover md:max-w-md"
        />

        <div className="grid grid-cols-1 gap-6 border-t border-hairline pt-6 sm:grid-cols-3 md:col-span-2">
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

        <a
          href={metaCase.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 border border-hairline px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-textMain transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:col-span-2"
        >
          {metaCase.link.label}
          <span aria-hidden>↗</span>
        </a>
      </motion.aside>
    </section>
  );
}
