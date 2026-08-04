import { motion } from "framer-motion";
import { cases } from "@/data/cases";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Cases() {
  const total = String(cases.length).padStart(2, "0");

  return (
    <section id="work" className="px-5 py-24 md:px-10 md:py-40">
      <div className="mb-12 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>Избранное</RevealText>
        </h2>
        <span className="mono-label">◆ Selected Work</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {cases.map((item, i) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, delay: (i % 2) * 0.08, ease: EASE }}
            className="group border-b border-hairline py-10 md:px-10 md:py-14 md:odd:border-r md:odd:pl-0 md:even:pr-0"
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-sm text-textMuted">
                {String(i + 1).padStart(2, "0")} / {total}
              </span>
              <div className="flex flex-wrap justify-end gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-textMuted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="mt-8 font-display text-4xl font-medium tracking-tightest transition-colors duration-500 ease-premium group-hover:text-accent md:text-5xl">
              {item.title}
            </h3>

            <p className="mt-5 max-w-lg text-textMuted">{item.description}</p>

            <div className="mt-8 grid grid-cols-3 border-t border-hairline pt-6">
              {item.metrics.map(([value, label]) => (
                <div key={label} className="pr-4">
                  <div className="font-display text-2xl font-semibold text-accent md:text-3xl">
                    {value}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-textMuted">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
