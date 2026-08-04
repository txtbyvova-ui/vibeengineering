import { motion } from "framer-motion";
import { process } from "@/data/process";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Process() {
  return (
    <section id="process" className="px-5 py-24 md:px-10 md:py-40">
      <div className="mb-12 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>Методология</RevealText>
        </h2>
        <span className="mono-label">◆ Как мы строим</span>
      </div>

      <div className="border-t border-hairline">
        {process.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.75, delay: i * 0.06, ease: EASE }}
            className="group grid grid-cols-1 gap-4 border-b border-hairline py-8 md:grid-cols-[auto_1fr_2fr] md:items-baseline md:gap-10 md:py-10"
          >
            <span className="font-display text-5xl font-semibold text-hollow transition-colors duration-500 ease-premium group-hover:text-accent md:text-7xl">
              {step.num}
            </span>
            <div>
              <h3 className="font-display text-2xl font-medium tracking-tightest md:text-3xl">
                {step.title}
              </h3>
              <span className="mt-2 inline-block font-mono text-xs uppercase tracking-[0.14em] text-accent">
                {step.duration}
              </span>
            </div>
            <p className="max-w-xl text-textMuted">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 max-w-2xl font-display text-2xl italic text-textMuted md:text-3xl">
        «Дешёвый мост падает. Дешёвый сайт — тоже. Просто медленнее.»
      </p>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-textMuted">
        Цену обсудим в личке.
      </p>
    </section>
  );
}
