# SOLEN Frontend

React 19 + Vite frontend for the SOLEN luxury travel concierge.
See the [repository README](../docs-backup/README.md) for the full project layout and
the [scope doc](../docs-backup/SOLEN_COMPLETE_SCOPE.md) for feature status.

## Commands

```bash
npm ci              # install dependencies (lockfile-exact, no rewrites)
npm run dev       # dev server with HMR
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

## Source map

```text
src/
├── main.jsx / AppRoutes.jsx   entry + route table (7 routes)
├── pages/       home/, destination/, planner/, auth/,
│                journeys/ (library + shared page), notFound/
├── components/  ambient/, edges/, globe/, rail/   (reusable UI)
├── api/         fetch wrappers for /api
├── data/        plain application data, no logic
├── engine/      pure business logic (personalization, budget, journey)
├── utils/       reveal.js (opt-in data-reveal observer)
└── styles/      index.css, motion.css, responsive.css
```

**Rule of thumb:** new screens go in `pages/`, reusable pieces in
`components/`, hard facts in `data/`, decision-making in `engine/`.
`engine/` must stay free of React/DOM imports so it stays testable in
isolation — it is **not** moving to the backend; that relocation was
descoped (scope §50).
