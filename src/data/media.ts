import type { CaseMedia, ResponsiveImage } from "@/types";

/**
 * Единственное место, где живут пути к ассетам, интринсики и alt-тексты.
 * Файлы производит `node scripts/optimize-media.mjs` из `site media/`;
 * менять руками нельзя — при следующем прогоне затрёт.
 *
 * `cover` есть у каждого кейса и всегда рендерится в одной пропорции
 * (`object-cover` в фиксированном боксе) — карточки ленты обязаны совпадать
 * по размеру. Исходники при этом разного соотношения, поэтому у части из них
 * задан `position`: центр кадра — не всегда то, что надо показать.
 */

/**
 * Ключ — `slug` кейса. Тип намеренно допускает `undefined`: кейс заводится
 * в `data/cases.ts` раньше, чем медиа (так написана инструкция в ARCHITECTURE §9),
 * и без этого промежуток между двумя правками роняет всё приложение —
 * `noUncheckedIndexedAccess` в проекте выключен, и `media.cover` у отсутствующей
 * записи бросает TypeError прямо в рендере, без error boundary.
 */
export const caseMedia: Record<string, CaseMedia | undefined> = {
  mvideo: {
    cover: {
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
    gallery: [
      {
        base: "cases/mvideo-interview",
        widths: [640, 960],
        width: 960,
        // 1214, а не 1212: интринсики берутся из ПРОИЗВОДНОЙ, а прежнее число
        // было от оригинала. На вёрстку не влияет — пропорцию задаёт CSS.
        height: 1214,
        alt:
          "HR-специалист М.Видео проводит видеособеседование с кандидатом, " +
          "пришедшим из кампании в Tinder",
        position: "object-[center_35%]",
      },
    ],
  },

  vegroove: {
    cover: {
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
    cover: {
      base: "cases/kupikod-portal",
      widths: [640, 960, 1280],
      width: 1280,
      height: 718,
      alt:
        "Стальной портал Kupikod с зелёной подсветкой на ВДНХ зимней ночью, " +
        "в проёме — колесо обозрения",
    },
    gallery: [
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
    cover: {
      base: "cases/alfabank-battle",
      widths: [640, 960],
      width: 960,
      height: 532,
      alt:
        "Ключевой визуал квеста Alfa Battle Space для Альфа-Банка: " +
        "человек в скафандре и слоган «Изобретайте»",
    },
    gallery: [
      {
        base: "cases/alfabank-deck",
        widths: [640, 960],
        width: 960,
        height: 536,
        alt:
          "Разворот концепции Alfa Battle Space: раздел «Решение» — " +
          "продакты бросают рутину и проектируют финтех-продукт для космоса",
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

export const teamPhotos: Record<string, ResponsiveImage | undefined> = {
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
