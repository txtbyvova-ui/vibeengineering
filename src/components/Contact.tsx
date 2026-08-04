import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";
import type { ContactLink } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

const links: ContactLink[] = [
  {
    label: "Telegram",
    handle: "@vibeengineering",
    href: "https://t.me/vibeengineering",
  },
  {
    label: "Email",
    handle: "hq@vibeengineering.ru",
    href: "mailto:hq@vibeengineering.ru",
  },
  {
    label: "GitHub",
    handle: "/vibeengineering",
    href: "https://github.com/vibeengineering",
  },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="border-t border-hairline px-5 pt-24 md:px-10 md:pt-40"
    >
      <p className="mb-10 font-display text-6xl font-semibold tracking-tightest text-textMuted md:text-8xl">
        Готовы?
      </p>

      <div className="border-t border-hairline">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group flex items-baseline justify-between gap-4 border-b border-hairline py-6 md:py-8"
          >
            <span className="text-hollow-white font-display text-[13vw] font-semibold leading-none tracking-display md:text-[8vw]">
              {link.label}
            </span>
            <span className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-textMuted transition-colors duration-300 group-hover:text-accent md:text-sm">
              {link.handle} ↗
            </span>
          </a>
        ))}
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mt-20 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-display md:text-7xl"
      >
        <RevealText>Хватит</RevealText>{" "}
        <RevealText delay={0.08} className="text-accent">
          пиздеть.
        </RevealText>{" "}
        <RevealText delay={0.16}>Давай билдить.</RevealText>
      </motion.h2>

      <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-textMuted">
        Ответим за 2 часа · Telegram
      </p>

      <footer className="mt-24 flex flex-col gap-2 border-t border-hairline py-8 font-mono text-[11px] uppercase tracking-[0.14em] text-textMuted md:flex-row md:items-center md:justify-between md:py-10">
        <span>©2025 Vibe Engineering</span>
        <span>Москва, Россия</span>
        <a
          href="mailto:hq@vibeengineering.ru"
          className="transition-colors duration-300 hover:text-accent"
        >
          hq@vibeengineering.ru
        </a>
      </footer>
    </section>
  );
}
