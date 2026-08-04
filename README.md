# Vibe Engineering — Landing

Awwwards-tier B2B landing for an ex-engineering bureau that pivoted into web dev
& AI integration. Industrial Premium design system.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- Framer Motion (scroll/entry animations only)
- Fonts: Clash Display (Fontshare), Space Grotesk + JetBrains Mono (Google Fonts)

## Install & run

```bash
npm install       # install dependencies
npm run dev       # start dev server (http://localhost:5173)
npm run build     # typecheck + production build
npm run preview   # preview the production build
npm run typecheck # tsc --noEmit
```

## Folder map

```
vibe-engineering/
├── index.html                 # title, meta, font preloads
├── tailwind.config.js         # design tokens (colors, fonts, marquee anim)
├── postcss.config.js
├── vite.config.ts             # @ alias -> ./src
├── tsconfig.json
└── src/
    ├── main.tsx               # React entry
    ├── App.tsx                # section composition
    ├── index.css              # tokens, globals, hollow-text, btn-fill
    ├── types/
    │   └── index.ts           # shared interfaces
    ├── data/
    │   ├── cases.ts
    │   ├── team.ts
    │   ├── process.ts
    │   └── clients.ts
    └── components/
        ├── Nav.tsx            # mix-blend-difference sticky nav
        ├── Hero.tsx
        ├── Marquee.tsx        # infinite outlined logo scroll
        ├── USP.tsx
        ├── Cases.tsx
        ├── Process.tsx
        ├── Team.tsx
        ├── Contact.tsx
        └── ui/
            └── RevealText.tsx # reusable mask-slide-up wrapper
```

## Page order

Nav → Hero → Marquee → USP → Cases → Process → Team → Contact

All content lives in `src/data/*` and renders via `.map()`. No pricing numbers —
pricing is discussed privately.
