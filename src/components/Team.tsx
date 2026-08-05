import { motion } from "framer-motion";
import { team, teamHeading } from "@/data/team";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Team() {
  return (
    <section id="team" className="px-5 py-24 md:px-10 md:py-40">
      <div className="mb-12 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>{teamHeading.title}</RevealText>
        </h2>
        <span lang="en" className="mono-label">
          {teamHeading.eyebrow}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {team.map((member, i) => (
          <motion.article
            key={member.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
            className="border-b border-hairline py-10 md:px-10 md:py-14 md:odd:border-r md:odd:pl-0 md:even:pr-0"
          >
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
              {member.role}
            </span>
            <h3 className="mt-4 font-display text-4xl font-medium tracking-tightest md:text-5xl">
              {member.name}
            </h3>

            <div className="mt-8 grid grid-cols-3 border-y border-hairline py-6">
              {member.stats.map(([value, label]) => (
                <div key={label} className="pr-3">
                  <div className="font-display text-2xl font-semibold text-textMain md:text-3xl">
                    {value}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-textMuted">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 font-display text-xl italic leading-snug text-textMain md:text-2xl">
              «{member.quote}»
            </p>

            <p className="mt-8 font-mono text-xs leading-relaxed tracking-[0.06em] text-textMuted">
              {member.skills}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
