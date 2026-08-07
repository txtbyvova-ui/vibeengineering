import { motion } from "framer-motion";
import RevealText from "@/components/ui/RevealText";
import { services, servicesHeading } from "@/data/services";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Что делаем — четыре направления сразу после ленты клиентов.
 *
 * Стоит перед USP намеренно: сначала «что вы для меня сделаете», потом
 * «почему вы». Раньше первого вопроса на странице не отвечал никто —
 * посетитель шёл от заголовка сразу к аргументам, так и не узнав состав услуг.
 * В структурированных данных этот список был с самого начала (`hasOfferCatalog`),
 * то есть роботы знали о нём больше, чем люди.
 */
export default function Services() {
  return (
    <section id="services" className="px-5 py-24 md:px-10 md:py-40">
      <div className="mb-6 flex items-end justify-between border-b border-hairline pb-6">
        <h2 className="font-display text-4xl font-semibold tracking-tightest md:text-6xl">
          <RevealText>{servicesHeading.title}</RevealText>
        </h2>
        <span className="mono-label">{servicesHeading.eyebrow}</span>
      </div>

      <p className="mb-12 max-w-xl text-textMuted md:text-lg">
        {servicesHeading.subtitle}
      </p>

      {/* Бордеры по образцу USP: до lg делят строки, на lg — колонки */}
      <div className="grid grid-cols-1 border-t border-hairline md:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
            className="border-b border-hairline py-8 md:odd:border-r md:odd:pr-10 md:even:pl-10 md:py-10 lg:border-b-0 lg:border-r lg:px-8 lg:py-12 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
          >
            <span className="font-mono text-sm text-accent">{service.num}</span>
            <h3 className="mt-5 font-display text-2xl font-medium tracking-tightest">
              {service.title}
            </h3>
            <p className="mt-3 text-textMuted">{service.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
