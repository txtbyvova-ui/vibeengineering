import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh flex-col justify-between px-5 pb-10 pt-32 md:px-10 md:pt-40"
    >
      {/* Micro-label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="flex items-center gap-3"
      >
        <span className="h-2 w-2 shrink-0 animate-pulseDot rounded-full bg-accent" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
          Hardware is dead. We write code now.
        </span>
      </motion.div>

      {/* H1 */}
      <div className="mt-auto">
        <h1 className="font-display text-[13vw] font-semibold leading-[0.92] tracking-display md:text-[9vw]">
          <span className="block">
            <RevealText delay={0.05}>Мы строили</RevealText>{" "}
            <RevealText delay={0.12} className="italic text-accent">
              мосты
            </RevealText>{" "}
            <RevealText delay={0.19}>и</RevealText>{" "}
            <RevealText delay={0.26} className="italic text-accent">
              порталы.
            </RevealText>
          </span>
          <span className="block">
            <RevealText delay={0.36}>Теперь делаем</RevealText>{" "}
            <RevealText delay={0.43}>веб.</RevealText>
          </span>
        </h1>

        <div className="mt-10 grid grid-cols-1 gap-8 border-t border-hairline pt-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
            className="max-w-xl text-base text-textMuted md:text-lg"
          >
            Инженерный подход из оффлайна — в digital. MVP, веб-приложения, боты
            и AI-интеграции с запасом прочности башенного крана. Спринты от 7
            дней.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.72, ease: EASE }}
            className="md:justify-self-end"
          >
            <a
              href="#contact"
              className="btn-fill inline-flex items-center gap-3 bg-accent px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-bg"
            >
              Запустить протокол
              <span aria-hidden>→</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
