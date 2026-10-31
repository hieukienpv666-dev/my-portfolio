# Ghibli Portfolio

A watercolor-themed personal portfolio built with Vite, React, TypeScript, and React Router.

## Pages

- `/` Home
- `/about` About
- `/projects` Project grid
- `/projects/:id` Project detail with full-width images
- `/services` Services
- `/contact` Contact form
- Any other path shows a 404 meadow

Shared navbar, footer, floating clouds, and a fade-up page transition live on every route.

## Customize

1. Update portfolio details in `index.html`, the navigation, footer, and page copy.
2. Add photos to `public/projects/` and point to them from `src/data/projects.ts`.
3. Update copy on each page as you like.

## Local development

```bash
npm install
npm run dev
```

## Deploy on Vercel

`vercel.json` rewrites all routes to `index.html` so `/projects/:id` still works on refresh.

```bash
npm run build
```

Then import the repo in Vercel (framework preset: Vite).
