# elite-physical-training-app

Elite Physical Training is a Vite + React + TypeScript PWA focused on fat loss while preserving muscle and performance.

## Local development

```bash
npm install
npm run dev
```

## Production build check

```bash
npm run build
```

## Push to GitHub

If this repo is not fully pushed yet:

```bash
git add .
git commit -m "Prepare app for Vercel deployment"
git push -u origin main
```

## Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Install command: `npm install`.
6. Deploy.

`vercel.json` includes an SPA rewrite so direct route refreshes (for React Router routes like `/today`, `/progress`, etc.) resolve correctly.

## GitHub Actions Vercel deploys

This repo includes two workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/vercel-deploy.yml`

To enable Vercel deploys from GitHub Actions, add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You can get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json` after running `vercel link` locally.

Behavior:

- Pull requests to `main` create preview deployments.
- Pushes to `main` create production deployments.
