import { motion } from "framer-motion";
import { estimate, process, processHeading, processQuote } from "@/data/process";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Process() {
  return (
    <section id="process" className="px-5 py-24 md:px-10 md:py-40">
      <div className="mb-6 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>{processHeading.title}</RevealText>
        </h2>
        <span className="mono-label">{processHeading.eyebrow}</span>
      </div>

      <p className="mb-12 max-w-xl text-textMuted md:text-lg">{processHeading.subtitle}</p>

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

      {/* Блок про деньги */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mt-16 flex flex-col gap-8 border border-hairline p-8 md:flex-row md:items-center md:justify-between md:p-12"
      >
        <div>
          <h3 className="font-display text-3xl font-medium tracking-tightest md:text-4xl">
            {estimate.title}
          </h3>
          <p className="mt-4 max-w-xl text-textMuted">{estimate.body}</p>
        </div>

        <a
          href={estimate.cta.href}
          className="btn-fill inline-flex w-fit shrink-0 items-center gap-3 bg-accent px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {estimate.cta.label}
          <span aria-hidden>→</span>
        </a>
      </motion.div>

      <p className="mt-12 max-w-2xl font-display text-2xl italic text-textMuted md:text-3xl">
        «{processQuote}»
      </p>
    </section>
  );
}
