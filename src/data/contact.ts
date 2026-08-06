import type { ContactLink, Link } from "@/types";

export const contact = {
  /** Заголовок кусками: второй идёт акцентом. */
  titleParts: ["Есть задача —", "есть расчёт"],
  body:
    "Опишите, что нужно. За 2 часа вернёмся со сроком и сметой. " +
    "Если задача не наша — скажем прямо и подскажем, к кому идти.",
  cta: {
    label: "Написать в Telegram",
    href: "https://t.me/vibeengineering",
  } satisfies Link,
  closing: "Проекты начинаются с одного сообщения.",
  note: "Ответим за 2 часа · Telegram",
};

export const contactLinks: ContactLink[] = [
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
  // Каналов связи ровно два, и это РЕШЕНИЕ ВЛАДЕЛЬЦА (2026-08-07), а не пропуск.
  // Третьим блоком стоял GitHub на github.com/vibeengineering — проверено через
  // GitHub API: организация «VibeEngineering.ai» (0 публичных репозиториев,
  // домен .ai), посторонняя компания, а не бюро. GitHub-аккаунта у бюро нет,
  // блок снят насовсем. Не заводить сюда третий канал без указания владельца.
];

/**
 * Реквизиты футера. Пустая строка не рендерится — `requisites` заполнить,
 * когда владелец пришлёт ИНН и ОГРН: «ИНН 7700000000 · ОГРН 1157700000000».
 */
export const legal = {
  company: "ООО «ВАЙБ ИНЖИНИРИНГ»",
  requisites: "",
  city: "Москва, Россия",
  copyright: "©2026 Vibe Engineering",
  email: "hq@vibeengineering.ru",
};
