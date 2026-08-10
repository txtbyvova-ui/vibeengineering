# Vibe Engineering — Landing

Awwwards-tier B2B landing for an ex-engineering bureau that pivoted into web dev
& AI integration. Industrial Premium design system.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- Framer Motion (scroll/entry animations only)
- three.js + @react-three/fiber — **lazy-loaded only**, for the Hero funnel scene.
  Never imported from the main chunk; phones and reduced-motion visitors get a
  static SVG blueprint and never download it.
- Fonts: self-hosted from `public/fonts` — M PLUS Rounded 1c (headings),
  IBM Plex Sans (body), JetBrains Mono (labels). No third-party CDN.
  All three verified to carry Cyrillic; **none has an italic face** — do not use
  `italic` in markup.

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
│   ├── fonts/                 # 8 woff2 subsets (~120 kB) + OFL licences
│   ├── robots.txt, sitemap.xml
│   └── media/                 # committed AVIF/WebP/JPEG + case video
├── docs/                      # ARCHITECTURE, BACKLOG, specs, review reports
└── src/
    ├── main.tsx               # React entry, MotionConfig reducedMotion="user"
    ├── App.tsx                # section composition
    ├── index.css              # @font-face, tokens, globals, hollow-text, btn-fill
    ├── types/
    │   └── index.ts           # shared interfaces
    ├── hooks/
    │   ├── useCountUp.ts             # rAF count-up, writes textContent
    │   ├── useFunnelLoop.ts          # rAF owner for the 3D scene (three chunk)
    │   ├── useStructuralGrid.ts      # Canvas-2D truss — previous Hero scene
    │   └── usePrefersReducedMotion.ts
    ├── data/                  # every user-facing string lives here
    │   ├── hero.ts, heroMetrics.ts, services.ts
    │   ├── funnel.ts          # funnel geometry + knobs, shared 3D <-> SVG
    │   ├── structuralGrid.ts  # truss knobs (previous Hero scene)
    │   ├── usp.ts, cases.ts, process.ts, team.ts
    │   ├── contact.ts, clients.ts, nav.ts
    │   └── media.ts           # asset paths, intrinsics, alt text
    └── components/
        ├── Nav.tsx            # mix-blend-difference sticky nav
        ├── Hero.tsx           # scene + headline + count-up metrics + CTA
        ├── Marquee.tsx        # infinite outlined logo scroll
        ├── Services.tsx
        ├── USP.tsx
        ├── Cases.tsx          # case rail + modal + meta case
        ├── Process.tsx
        ├── Team.tsx
        ├── Contact.tsx
        └── ui/
            ├── RevealText.tsx        # reusable mask-slide-up wrapper
            ├── HeroMetrics.tsx
            ├── HeroScene.tsx            # picks 3D vs SVG, owns the lazy import
            ├── ConversionFunnelCanvas.tsx  # r3f scene — the ONLY three importer
            ├── FunnelBlueprint.tsx      # static SVG funnel, same profile
            ├── StructuralGridCanvas.tsx  # truss wrapper (previous Hero scene)
            ├── Picture.tsx           # AVIF -> WebP -> JPEG, responsive
            ├── LazyVideo.tsx         # IntersectionObserver-gated video
            ├── CaseRail.tsx          # horizontal case rail (native scroll-snap)
            ├── CaseCard.tsx          # rail card + stack chip
            ├── CaseModal.tsx         # case detail, portalled into body
            └── CasesJsonLd.tsx       # ItemList structured data for the cases
```

## Hero scene

`HeroScene` decides what sits behind the headline, and the gate runs **before** the
dynamic import — so `three` is fetched only when it will actually be used:

| visitor | scene | three downloaded |
|---|---|---|
| desktop, pointer: fine | procedural 3D conversion funnel (r3f) | yes, ~218 kB after `load` |
| touch device | static SVG blueprint | **no** |
| `prefers-reduced-motion: reduce` | static SVG blueprint | **no** |

Both views are generated from the same `funnelRadius` profile in
[src/data/funnel.ts](src/data/funnel.ts), so they cannot drift apart.
Measurements and trade-offs: [docs/REPORT-hero-funnel-3d.md](docs/REPORT-hero-funnel-3d.md).

## Page order

Nav → Hero → Marquee → Services → USP → Cases → Process → Team → Contact

All content lives in `src/data/*` and renders via `.map()`; components hold no
user-facing strings. No pricing numbers — the page promises a fixed quote in two
hours instead.

Working rules for this repository (including the "done" gate) are in
[AGENTS.md](AGENTS.md); the code map is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
