import type { CaseStudy } from "@/types";

export const cases: CaseStudy[] = [
  {
    title: "Kupikod Gateway",
    tags: ["Phygital", "IoT", "Telegram Bot"],
    metrics: [
      ["120ч", "от нуля до сдачи"],
      ["400кг", "стали + IoT"],
      ["100%", "аптайм"],
    ],
    description:
      "Спроектировали 400-кг smart-портал и запустили Telegram-воронку лидогенерации за 5 дней до Нового года — когда все цеха Москвы стояли. Python/aiogram, IoT-управление светом, деплой без даунтайма.",
  },
  {
    title: "М.Видео: IT Tinder",
    tags: ["Growth Hacking", "HR Tech"],
    metrics: [
      ["650K", "охват"],
      ["4200", "мэтчей"],
      ["BANNED", "за виральность"],
    ],
    description:
      "Хакнули механику Тиндера для найма разработчиков. Профили «Naked Code» — код вместо фото. Платформа забанила кампанию за аномальную виральность. Мы успели забрать лиды.",
  },
  {
    title: "Альфа-Банк: Metaverse Battle",
    tags: ["Product Architecture", "Gamification"],
    metrics: [
      [">10M ₽", "бюджет кампании"],
      ["5 недель", "квест"],
      ["WIN", "тендер"],
    ],
    description:
      "Стратегия и механика 5-недельного HR-квеста федерального масштаба для Product-менеджеров. Выиграли тендер, концепцию приняли и передали в in-house.",
  },
  {
    title: "VEgroove",
    tags: ["B2B SaaS", "AI", "Audio"],
    metrics: [
      ["LFL +20%", "у клиентов"],
      ["+16.5%", "средний чек"],
      ["24ч", "до пилота"],
    ],
    description:
      "Собственный B2B-продукт: AI-driven аудио-стратегия для заведений. Поднимает средний чек и время в зале без скидок. Клиенты: Poison Drop, Skuratov Coffee, Норникель.",
  },
];
