import type { Link } from "@/types";

/** Кусок заголовка. `accent` — оранжевый курсив, `break` — перенос строки перед куском. */
export interface HeadlinePart {
  text: string;
  accent?: boolean;
  break?: boolean;
}

export const hero = {
  microLabel: "Hardware is dead. We write code now.",
  headline: [
    { text: "Мы строили" },
    { text: "мосты,", accent: true },
    { text: "порталы", accent: true },
    { text: "и ивенты." },
    { text: "Теперь строим ваш", break: true },
    { text: "digital.", accent: true },
  ] satisfies HeadlinePart[],
  lead:
    "Сайты, боты и веб-приложения с инженерным расчётом: считаем нагрузку " +
    "до старта. Первый рабочий результат — через 48 часов.",
  cta: {
    label: "Обсудить проект",
    href: "#contact",
  } satisfies Link,
  ctaNote: "Ответим за 2 часа",
} as const;
