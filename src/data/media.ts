import type { CaseMedia, ResponsiveImage } from "@/types";

/**
 * Единственное место, где живут пути к ассетам, интринсики и alt-тексты.
 * Файлы производит `node scripts/optimize-media.mjs` из `site media/`;
 * менять руками нельзя — при следующем прогоне затрёт.
 */

export const caseMedia: Record<string, CaseMedia> = {
  mvideo: {
    main: {
      base: "cases/mvideo-billboards",
      widths: [640, 960, 1280],
      width: 1280,
      height: 690,
      alt:
        "Наружная реклама кампании One Swipe Offer для М.Видео-Эльдорадо: " +
        "три постера с надписями «Кодишь? Заходи в мой тиндер» и «Свайпай, апрувь»",
    },
    video: {
      base: "cases/mvideo-one-swipe-offer",
      width: 640,
      height: 360,
      alt: "Ролик кампании One Swipe Offer для М.Видео-Эльдорадо, 2022",
    },
    thumbs: [
      {
        base: "cases/mvideo-interview",
        widths: [640, 960],
        width: 960,
        height: 1212,
        alt:
          "HR-специалист М.Видео проводит видеособеседование с кандидатом, " +
          "пришедшим из кампании в Tinder",
        aspect: "aspect-[4/3]",
        position: "object-[center_35%]",
      },
    ],
  },

  vegroove: {
    main: {
      base: "cases/vegroove-site",
      widths: [640, 960, 1280],
      width: 1280,
      height: 800,
      alt:
        "Первый экран веб-платформы VEgroove: заголовок «У вас новое приглашение» " +
        "и кнопка «Получить пилот»",
      position: "object-top",
    },
  },

  kupikod: {
    main: {
      base: "cases/kupikod-portal",
      widths: [640, 960, 1280],
      width: 1280,
      height: 718,
      alt:
        "Стальной портал Kupikod с зелёной подсветкой на ВДНХ зимней ночью, " +
        "в проёме — колесо обозрения",
    },
    thumbs: [
      {
        base: "cases/kupikod-model",
        widths: [320, 480],
        width: 480,
        height: 408,
        alt: "Трёхмерная модель рамной конструкции портала Kupikod в расчётной среде",
      },
      {
        base: "cases/kupikod-drawing",
        widths: [320, 480],
        width: 480,
        height: 594,
        alt:
          "Рабочий чертёж рамы портала Kupikod с ведомостью металлопроката: " +
          "труба 40×40×4, сталь С245",
      },
      {
        base: "cases/kupikod-bot",
        widths: [320, 480],
        width: 480,
        height: 466,
        alt:
          "Исходный код Telegram-бота Kupikod на Python: подключение к Google Таблицам " +
          "и кнопка «Активировать портал»",
      },
    ],
  },

  alfabank: {
    main: {
      base: "cases/alfabank-battle",
      widths: [640, 960],
      width: 960,
      height: 532,
      alt:
        "Ключевой визуал квеста Alfa Battle Space для Альфа-Банка: " +
        "человек в скафандре и слоган «Изобретайте»",
    },
    thumbs: [
      {
        base: "cases/alfabank-deck",
        widths: [640, 960],
        width: 960,
        height: 536,
        alt:
          "Разворот концепции Alfa Battle Space: раздел «Решение» — " +
          "продакты бросают рутину и проектируют финтех-продукт для космоса",
        aspect: "aspect-[16/9]",
      },
    ],
  },
};

export const metaCaseImage: ResponsiveImage = {
  base: "cases/ve-art",
  widths: [640, 960, 1280],
  width: 1280,
  height: 800,
  alt:
    "Предыдущая версия сайта Vibe Engineering на vibeengineering.art: " +
    "заголовок «Render → Reality»",
  position: "object-top",
};

export const teamPhotos: Record<string, ResponsiveImage> = {
  vladimir: {
    base: "team/vladimir",
    widths: [320, 480, 720],
    width: 720,
    height: 1280,
    alt: "Владимир Егоров, креативный продюсер Vibe Engineering",
    position: "object-[center_25%]",
  },
  roman: {
    base: "team/roman",
    widths: [320, 480, 720],
    width: 720,
    height: 1280,
    alt: "Роман Петров, технический директор Vibe Engineering",
    position: "object-[center_30%]",
  },
};
