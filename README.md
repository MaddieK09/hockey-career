# Hockey Career 🏒

A modular, browser-based hockey career game in early development.

## First milestone

A responsive title screen with a working **New Career** interaction. Load Career and Settings are clearly marked as upcoming features. This is **not** yet a playable hockey simulation.

## Run locally

Requires a current Node.js LTS release.

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Check production build

```bash
npm run build
npm run preview
```

## Project structure

- `src/config/` — editable game constants
- `src/screens/` — individual screens and UI flows
- `src/main.ts` — minimal app entry point
- `src/style.css` — initial responsive visual styling

## Direction

Player career first, realistic simulation, skater and goalie paths, full 3D on-ice gameplay, and touch/keyboard/controller support. Future systems will be added as independent modules. No real-team logos, player likenesses, or equipment brand assets are bundled at this stage.

## Development approach

Small milestones, tested incrementally. Keep `main` stable and develop new features on branches.
