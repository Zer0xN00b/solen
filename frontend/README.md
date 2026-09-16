# SOLEN Frontend

React 19 + Vite frontend for the SOLEN luxury travel concierge.
See the [repository README](../README.md) for the full project layout and
the [scope doc](../SOLEN_COMPLETE_SCOPE.md) for feature status.

## Commands

```bash
npm install       # install dependencies
npm run dev       # dev server with HMR
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

## Source map

```text
src/
├── main.jsx / AppRoutes.jsx   entry + route table
├── pages/       home/, destination/, planner/  (one folder per route)
├── components/  globe/, navbar/                (reusable UI)
├── data/        plain application data, no logic
├── engine/      pure business logic (personalization, budget, journey)
└── styles/      index.css + responsive.css
```

**Rule of thumb:** new screens go in `pages/`, reusable pieces in
`components/`, hard facts in `data/`, decision-making in `engine/`.
`engine/` must stay free of React/DOM imports so it can move to the
backend later (scope §50).
