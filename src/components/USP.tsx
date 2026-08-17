import { motion } from "framer-motion";
import { uspHeading, uspPoints } from "@/data/usp";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function USP() {
  return (
    <section className="px-5 py-16 md:px-10 md:py-24">
      {/* Одна строка, без надстрочника и без reveal: секция начинается сразу
          с фразы (распоряжение владельца 2026-08-13, разбор — в data/usp.ts).
          Обёртки RevealText здесь нет намеренно — именно она и прятала
          прежний заголовок целиком. */}
      <h2 className="max-w-3xl font-display text-2xl font-medium leading-snug tracking-tightest md:text-3xl">
        {uspHeading.title}
      </h2>

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
