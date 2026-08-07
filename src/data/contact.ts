import type { ContactLink, Link } from "@/types";

export const contact = {
  /** Заголовок кусками: второй идёт акцентом. */
  titleParts: ["Есть задача —", "есть расчёт"],
  body:
    "Опишите, что нужно. За 2 часа вернёмся со сроком и сметой. " +
    "Если задача не наша — скажем прямо и подскажем, к кому идти.",
  cta: {
    label: "Написать в Telegram",
    href: "https://t.me/vovaegorovv",
  } satisfies Link,
  closing: "Проекты начинаются с одного сообщения.",
  note: "Ответим за 2 часа · Telegram",
};

export const contactLinks: ContactLink[] = [
  {
    label: "Telegram",
    handle: "@vovaegorovv",
    href: "https://t.me/vovaegorovv",
  },
  {
    label: "Email",
    handle: "hq@vibeengineering.ru",
    href: "mailto:hq@vibeengineering.ru",
  },
  // Каналов связи ровно два, и это РЕШЕНИЕ ВЛАДЕЛЬЦА, а не пропуск: GitHub-блок
  // снят насовсем. Не заводить сюда третий канал без указания владельца —
  // и помнить правило для `sameAs` в index.html: там только то, что реально
  // опубликовано ссылкой на странице. Разбор — docs/BACKLOG.md §9 и §58.
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
