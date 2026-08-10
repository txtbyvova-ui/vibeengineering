# Vibe Engineering — Landing

Awwwards-tier B2B landing for an ex-engineering bureau that pivoted into web dev
& AI integration. Industrial Premium design system.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- Framer Motion (scroll/entry animations only)
- three.js + @react-three/fiber + leva — **lazy-loaded only**, for the Hero
  wireframe scene. Never imported from the main chunk.
  ⚠️ Unlike the earlier funnel scene, this one loads on phones too: the wireframe
  has no vector fallback. Mobile first screen is 529.9 kB — an open question,
  see [the report](docs/REPORT-hero-wireframe.md).
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
    ├── shaders/
    │   └── wireframe.ts        # GLSL as template strings (mattdesl, MIT)
    ├── hooks/
    │   ├── useCountUp.ts             # rAF count-up, writes textContent
    │   ├── useSceneLoop.ts           # rAF owner for any r3f scene (three chunk)
    │   ├── useWireframeGeometry.ts   # un-index + barycentric attribute
    │   ├── useStructuralGrid.ts      # Canvas-2D truss — dormant scene
    │   └── usePrefersReducedMotion.ts
    ├── data/                  # every user-facing string lives here
    │   ├── hero.ts, heroMetrics.ts, services.ts
    │   ├── heroWireframe.ts   # Redline copy + wireframe scene knobs
    │   ├── funnel.ts          # funnel geometry + knobs, shared 3D <-> SVG
    │   ├── structuralGrid.ts  # truss knobs (dormant scene)
    │   ├── usp.ts, cases.ts, process.ts, team.ts
    │   ├── contact.ts, clients.ts, nav.ts
    │   └── media.ts           # asset paths, intrinsics, alt text
    └── components/
        ├── Nav.tsx            # mix-blend-difference sticky nav
        ├── HeroWireframe.tsx  # ACTIVE Hero: wireframe scene + Redline offer
        ├── Hero.tsx           # funnel Hero — intact, not imported by App.tsx
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
            ├── WireframeHeroCanvas.tsx  # r3f wireframe + leva panel (lazy chunk)
            ├── HeroScene.tsx            # funnel gate (dormant)
            ├── ConversionFunnelCanvas.tsx  # r3f funnel (dormant)
            ├── FunnelBlueprint.tsx      # static SVG funnel, same profile
            ├── StructuralGridCanvas.tsx  # truss wrapper (dormant)
            ├── Picture.tsx           # AVIF -> WebP -> JPEG, responsive
            ├── LazyVideo.tsx         # IntersectionObserver-gated video
            ├── CaseRail.tsx          # horizontal case rail (native scroll-snap)
            ├── CaseCard.tsx          # rail card + stack chip
            ├── CaseModal.tsx         # case detail, portalled into body
            └── CasesJsonLd.tsx       # ItemList structured data for the cases
```

## Hero scene

Stylised wireframe via **barycentric coordinates**, ported from
[mattdesl/webgl-wireframes](https://github.com/mattdesl/webgl-wireframes) (MIT).
Shaders live in [src/shaders/wireframe.ts](src/shaders/wireframe.ts) as template
strings — **no glslify, no Babel** in the pipeline.

`HeroWireframe` picks the mode; the scene mounts after `load`:

| visitor | mode | panel | dash animation | rotation |
|---|---|---|---|---|
| desktop ≥ 768 px | `full` | yes | yes | yes |
| width < 768 px | `quiet` | no | no | slow |
| `prefers-reduced-motion` | `frozen` | no | no | **no**, single frame |

Measurements, the three ported-shader deviations and six open questions for the
owner: [docs/REPORT-hero-wireframe.md](docs/REPORT-hero-wireframe.md).

Two earlier scenes stay in the tree but are imported by nothing, so they add zero
bytes: the 3D conversion funnel and a Warren truss on Canvas 2D. Switching back is
one import line in `App.tsx`.

## Page order

Nav → Hero → Marquee → Services → USP → Cases → Process → Team → Contact

All content lives in `src/data/*` and renders via `.map()`; components hold no
user-facing strings. No pricing numbers — the page promises a fixed quote in two
hours instead.

Working rules for this repository (including the "done" gate) are in
[AGENTS.md](AGENTS.md); the code map is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
