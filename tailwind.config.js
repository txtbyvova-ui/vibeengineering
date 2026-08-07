/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D0D",
        surface: "#1A1A1A",
        accent: "#FF4F00",
        textMain: "#F4F4F0",
        textMuted: "#888888",
      },
      borderColor: {
        hairline: "rgba(255,255,255,0.08)",
      },
      // Все три семейства несут кириллицу — проверено разбором cmap, а не на глаз.
      // Предшественники (Clash Display, Space Grotesk) не несли, и русский текст
      // рендерился системным шрифтом. @font-face и разбор — в src/index.css.
      fontFamily: {
        display: ['"M PLUS Rounded 1c"', "sans-serif"],
        sans: ['"IBM Plex Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        display: "-0.03em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
      },
      animation: {
        // 56 s, а не 28: трек в src/components/Marquee.tsx повторяет список
        // вчетверо ради бесшовности на широких мониторах, и путь до -50% вырос
        // вдвое. Скорость в пикселях в секунду осталась прежней.
        marquee: "marquee 56s linear infinite",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
