import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

interface UspPoint {
  label: string;
  title: string;
  body: string;
}

const points: UspPoint[] = [
  {
    label: "01",
    title: "Архитектура",
    body: "BIM-мышление в каждом компоненте. Код держит нагрузку как мост.",
  },
  {
    label: "02",
    title: "Конверсия",
    body: "30M+ охватов опыта зашито в каждый заголовок и воронку.",
  },
  {
    label: "03",
    title: "Скорость",
    body: "120 часов на phygital-систему. Ваш MVP — за 2–4 недели.",
  },
];

export default function USP() {
  return (
    <section className="px-5 py-24 md:px-10 md:py-40">
      <p className="mono-label mb-8">◆ Почему мы</p>

      <h2 className="font-display text-[15vw] font-semibold leading-[0.9] tracking-display md:text-[10vw]">
        <RevealText>
          <span className="text-hollow">Инженер</span>
        </RevealText>{" "}
        <span className="text-accent">×</span>{" "}
        <RevealText delay={0.1}>
          <span className="text-hollow">Продюсер</span>
        </RevealText>
      </h2>

      <div className="mt-16 grid grid-cols-1 border-t border-hairline md:grid-cols-3">
        {points.map((point, i) => (
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
