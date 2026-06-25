# POD Design Generator

Single-page, client-side bulk t-shirt design generator. No build step, no backend.

## Deploy on Vercel

**Option A — Vercel CLI (fastest):**
```bash
npm i -g vercel
cd pod-toolkit-repo
vercel --prod
```

**Option B — Git + Vercel dashboard:**
```bash
cd pod-toolkit-repo
git init
git add .
git commit -m "Initial commit: POD design generator"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```
Then in vercel.com → Add New Project → import that repo. Vercel auto-detects the static `index.html` + `vercel.json` and needs zero config — just click Deploy.

**Option C — drag and drop:**
Go to vercel.com/new, drag the whole `pod-toolkit-repo` folder onto the upload area. Done.

## Local dev / testing
No build step needed — just open `index.html` directly in a browser, or run any static server:
```bash
npx serve .
```

## Files
- `index.html` — the entire app (HTML/CSS/JS, loads Google Fonts + html2canvas + JSZip from CDN)
- `vercel.json` — tells Vercel this is a static site with no build command

## Notes
- All state (saved templates, design settings) persists via `localStorage` in the visitor's own browser — nothing is stored server-side, so this works fine on Vercel's static hosting with no database.
- Internet access is required at runtime for the Google Fonts and CDN script tags.
