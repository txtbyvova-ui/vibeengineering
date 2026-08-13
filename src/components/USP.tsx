import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";
import { uspHeading, uspPoints } from "@/data/usp";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function USP() {
  const [first, separator, second] = uspHeading.title;

  return (
    <section className="px-5 py-16 md:px-10 md:py-24">
      <p className="mono-label mb-5">{uspHeading.eyebrow}</p>

      {/**
       * ⚠️ **Заголовок набран заливкой, а не контуром, и это лечение дефекта.**
       *
       * До 2026-08-13 крайние куски шли классом `text-hollow` — прозрачная
       * заливка плюс обводка `1px` акцентом. На кегле 77 px это 1.3 % от роста
       * буквы: акцент и сплошным-то даёт 3.88:1 к фону, а волосяным контуром
       * не читается вовсе. Секция выглядела пустой прямоугольник, в котором
       * висят только надстрочник и союз «и» — единственный кусок, набранный
       * заливкой. Владелец так и описал: «пустой блок и оторванная буква и».
       *
       * Контур в проекте остаётся жив там, где он работает: цифры этапов
       * в Process (крупные цифры, заливаются на hover) и `text-hollow-white`
       * в ленте клиентов. Сюда его не возвращать.
       *
       * Кегль тоже уменьшен — 11vw/6vw держали 40-знаковую фразу в две строки
       * по 138 px. Фиксированные ступени вместо `vw` заодно убирают зависимость
       * числа строк от ширины окна.
       */}
      <h2 className="max-w-4xl font-display text-3xl font-semibold leading-[1.08] tracking-tightest md:text-5xl">
        <RevealText>{first}</RevealText>{" "}
        <span className="text-accent">{separator}</span>{" "}
        <RevealText delay={0.08}>{second}</RevealText>
      </h2>

      {/* Подзаголовок, а не сноска: `textMain` и на ступень крупнее тела.
          Прежние `textMuted` 18 px терялись между заголовком и карточками. */}
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-textMain md:text-xl">
        {uspHeading.subtitle}
      </p>

      <div className="mt-10 grid grid-cols-1 border-t border-hairline md:mt-12 md:grid-cols-3">
        {uspPoints.map((point, i) => (
          <motion.div
            key={point.label}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
            className="border-b border-hairline py-10 md:border-b-0 md:border-r md:px-10 md:py-14 md:first:pl-0 md:last:border-r-0"
          >
            <span className="font-mono text-sm text-accent">{point.label}</span>
            <h3 className="mt-6 font-display text-3xl font-medium tracking-tightest md:text-4xl">
              {point.title}
            </h3>
            <p className="mt-4 max-w-xs text-textMuted">{point.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
