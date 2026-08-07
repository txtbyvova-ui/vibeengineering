import type { Link } from "@/types";

/**
 * Пункты меню — по порядку секций на странице. Русские: сайт русский целиком,
 * а латиница здесь была единственным местом, где посетителю предлагалось
 * читать по-английски.
 *
 * ⚠️ Пятый пункт — потолок. Меню видно от md, и на 768 px строка «логотип →
 * пункты → кнопка Telegram» занимает ~690 px из 768. Шестой пункт её порвёт;
 * если понадобится — сначала перемерить, а не добавлять на глаз.
 */
export const navLinks: Link[] = [
  { label: "услуги", href: "#services" },
  { label: "кейсы", href: "#work" },
  { label: "процесс", href: "#process" },
  { label: "команда", href: "#team" },
  { label: "контакты", href: "#contact" },
];

export const navBrand = {
  mark: "VE",
  href: "#top",
  ariaLabel: "Vibe Engineering — на главную",
};

export const navCta: Link = {
  label: "Telegram ↗",
  href: "https://t.me/vovaegorovv",
};
