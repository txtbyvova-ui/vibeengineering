import type { TeamMember } from "@/types";

export const team: TeamMember[] = [
  {
    name: "Владимир Егоров",
    role: "Creative Producer",
    stats: [
      ["6+", "лет опыта"],
      ["400+", "проектов"],
      ["30M+", "охватов"],
    ],
    quote:
      "Нас забанили в Тиндере за виральность. Представьте, что мы сделаем с вашим продуктом.",
    skills:
      "Креативная стратегия · Telegram Bots · Conversion Copy · Growth Hacking · Product",
  },
  {
    name: "Роман Петров",
    role: "Technical Director",
    stats: [
      ["6+", "лет C#/.NET"],
      ["50K т", "стали в Сколково"],
      ["∞", "запас прочности"],
    ],
    quote:
      "Я проектировал конструкции, которые держат мосты. Мой код работает с тем же запасом прочности.",
    skills:
      "C# / .NET · System Architecture · API · AI Integration · BIM · Grasshopper",
  },
];
