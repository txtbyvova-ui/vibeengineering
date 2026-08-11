import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";
import { contact, contactLinks, legal } from "@/data/contact";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Contact() {
  return (
    <section
      id="contact"
      className="border-t border-hairline px-5 pt-16 md:px-10 md:pt-24"
    >
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-display md:text-7xl"
      >
        {contact.titleParts.map((part, i) => (
          <span key={part}>
            <RevealText delay={i * 0.08} className={i > 0 ? "text-accent" : undefined}>
              {part}
            </RevealText>{" "}
          </span>
        ))}
      </motion.h2>

      <p className="mt-8 max-w-2xl text-textMuted md:text-lg">{contact.body}</p>

      <a
        href={contact.cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-fill mt-10 inline-flex items-center gap-3 bg-accent px-8 py-4 font-mono text-sm uppercase tracking-[0.14em] text-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {contact.cta.label}
        <span aria-hidden>→</span>
      </a>

      <div className="mt-16 border-t border-hairline">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            // Ниже md хэндл уезжал за 375 px рядом с 13vw-надписью — переносим его строкой.
            className="group flex flex-col gap-2 border-b border-hairline py-6 md:flex-row md:items-baseline md:justify-between md:gap-4 md:py-8"
          >
            <span
              lang="en"
              className="text-hollow-white font-display text-[13vw] font-semibold leading-none tracking-display md:text-[8vw]"
            >
              {link.label}
            </span>
            <span
              lang="en"
              className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-textMuted transition-colors duration-300 group-hover:text-accent md:text-sm"
            >
              {link.handle} ↗
            </span>
          </a>
        ))}
      </div>

      <p className="mt-20 max-w-3xl font-display text-3xl leading-snug text-textMuted md:text-4xl">
        «{contact.closing}»
      </p>

      <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-textMuted">
        {contact.note}
      </p>

      <footer className="mt-24 flex flex-col gap-2 border-t border-hairline py-8 font-mono text-[11px] uppercase tracking-[0.14em] text-textMuted md:flex-row md:items-center md:justify-between md:py-10">
        <span>{legal.copyright}</span>
        <span>{legal.company}</span>
        {legal.requisites && <span>{legal.requisites}</span>}
        <span>{legal.city}</span>
        <a
          href={`mailto:${legal.email}`}
          className="py-2 transition-colors duration-300 hover:text-accent"
        >
          {legal.email}
        </a>
      </footer>
    </section>
  );
}
