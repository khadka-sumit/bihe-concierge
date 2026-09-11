# Bihe Concierge

A premium frontend prototype for a private matchmaking application journey.

---

## Overview

Bihe Concierge is an elegantly designed frontend UI prototype for a luxury private matchmaking and relationship concierge service. The experience is intentionally crafted to feel like a ceremonial invitation — not a dating app.

The interface draws from Nepali cultural heritage, warm editorial design, and cinematic visual language to create a dignified, private, and deeply human matchmaking experience.

---

## Technology

- **HTML5** — semantic, accessible markup
- **CSS3** — custom properties, grid, flexbox, keyframe animations
- **Vanilla JavaScript** — no frameworks, no external libraries

No React. No Vue. No Bootstrap. No backend.

---

## Main Experiences

| Page | Description |
|------|-------------|
| `login.html` | Cinematic split-screen login — dark heritage left panel, warm ivory right form |
| `index.html` | Full-viewport dark entry screen with red-sweep exit transition |
| `application.html` | 6-stage application with sidebar navigation, editorial layout |
| `confirmation.html` | Cinematic dark confirmation with wax seal and timeline |

### Six Application Stages

1. **About You** — personal details, profession, background
2. **Your Ideal Partner** — qualities, values, preferences
3. **Compatibility Blueprint** — 10-question single-select questionnaire
4. **Your World** — family, values, vision, lifestyle
5. **Verification & Documents** — UI-only upload cards (no backend)
6. **Review & Submit** — full summary with edit links and submission

---

## Project Structure

```
bihe-concierge/
├── index.html
├── login.html
├── application.html
├── confirmation.html
│
├── css/
│   ├── variables.css       ← Design tokens
│   ├── global.css          ← Reset and base styles
│   ├── animations.css      ← Keyframes and reveal utilities
│   ├── components.css      ← Reusable UI components
│   ├── login.css           ← Login page specific styles
│   ├── application.css     ← Application shell and stages
│   └── responsive.css      ← All breakpoints
│
├── js/
│   ├── storage.js          ← Application data object and localStorage
│   ├── auth.js             ← Frontend demo authentication
│   ├── validation.js       ← Field validation engine
│   ├── questionnaire.js    ← Compatibility Blueprint engine
│   ├── animations.js       ← IntersectionObserver and parallax
│   └── application.js      ← Stage router and application controller
│
└── assets/
    ├── images/             ← WebP images (see ASSET_PROMPTS.md)
    └── decorative/         ← SVG decorative elements
```

---

## Design System

**Palette:**
- Warm ivory `#F6F0E7` — primary background
- Burgundy `#7E0715` — primary accent
- Near-black `#090706` — dark screens
- Antique gold `#B9955A` — details and accents

**Typography:**
- Headings: Cormorant Garamond (serif)
- Body / Labels: Inter (sans-serif)

---

## Setup

No build process required. Open any HTML file directly in a browser.

For best results, serve locally via VS Code Live Server or any static file server:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

---

## Image Assets

Image placeholders are CSS gradient fallbacks. To add real images, generate them using the prompts in `ASSET_PROMPTS.md` and place WebP files in `assets/images/`.

---

## Notes

> This repository contains a **frontend UI prototype only.**
>
> No real authentication, no database, no backend API.
> Form data is stored in `localStorage` under `biheConciergeApplication`.
> No passwords or file contents are ever stored.
>
> Structured for clean Firebase / backend API integration in the future.

---

## Git

Branch strategy:
- `main` — stable releases
- `feature/bihe-concierge-ui` — active development

Do not push credentials, tokens, or sensitive data.
