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
npm run build     # prebuild (og + icons) -> typecheck + production build
npm run preview   # preview the production build
npm run typecheck # tsc --noEmit
npm run og        # regenerate public/og.png only
npm run icons     # regenerate public/apple-touch-icon.png only
npm run media     # one-off: re-encode "site media/" into public/media (needs ffmpeg)
```

`npm run media` is deliberately **not** part of `build`: the derivatives are
committed, and CI has no ffmpeg. Run it by hand when the source archive changes.

## Folder map

```
vibe-engineering/
├── index.html                 # title, meta, OG, JSON-LD, font preloads
├── tailwind.config.js         # design tokens (colors, fonts, marquee anim)
├── postcss.config.js
├── vite.config.ts             # @ alias -> ./src
├── tsconfig.json
├── scripts/
│   ├── generate-og.mjs        # OG card (Satori + resvg), prebuild hook
│   ├── generate-icons.mjs     # apple-touch-icon.png from favicon.svg
│   └── optimize-media.mjs     # one-off media pipeline (ffmpeg)
├── public/
│   ├── favicon.svg            # committed source of the mark
│   ├── robots.txt, sitemap.xml
│   └── media/                 # committed AVIF/WebP/JPEG + case video
├── docs/                      # ARCHITECTURE, BACKLOG, specs, review reports
└── src/
    ├── main.tsx               # React entry, MotionConfig reducedMotion="user"
    ├── App.tsx                # section composition
    ├── index.css              # tokens, globals, hollow-text, btn-fill
    ├── types/
    │   └── index.ts           # shared interfaces
    ├── hooks/                 # useCountUp, useStructuralGrid, usePrefersReducedMotion
    ├── data/                  # every user-facing string lives here
    │   ├── hero.ts, heroMetrics.ts, structuralGrid.ts
    │   ├── usp.ts, cases.ts, process.ts, team.ts
    │   ├── contact.ts, clients.ts, nav.ts
    │   └── media.ts           # asset paths, intrinsics, alt text
    └── components/
        ├── Nav.tsx            # mix-blend-difference sticky nav
        ├── Hero.tsx           # canvas truss + count-up metrics
        ├── Marquee.tsx        # infinite outlined logo scroll
        ├── USP.tsx
        ├── Cases.tsx          # case rail + modal + meta case
        ├── Process.tsx
        ├── Team.tsx
        ├── Contact.tsx
        └── ui/
            ├── RevealText.tsx        # reusable mask-slide-up wrapper
            ├── HeroMetrics.tsx
            ├── StructuralGridCanvas.tsx
            ├── Picture.tsx           # AVIF -> WebP -> JPEG, responsive
            ├── LazyVideo.tsx         # IntersectionObserver-gated video
            ├── CaseRail.tsx          # horizontal case rail (native scroll-snap)
            ├── CaseCard.tsx          # rail card + stack chip
            ├── CaseModal.tsx         # case detail, portalled into body
            └── CasesJsonLd.tsx       # ItemList structured data for the cases
```

## Page order

Nav → Hero → Marquee → USP → Cases → Process → Team → Contact

All content lives in `src/data/*` and renders via `.map()`; components hold no
user-facing strings. No pricing numbers — the page promises a fixed quote in two
hours instead.

Working rules for this repository (including the "done" gate) are in
[AGENTS.md](AGENTS.md); the code map is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
