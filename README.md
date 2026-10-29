# Emma Dodd · Portfolio

React + Vite site, ready for GitHub Pages.

## Edit content

- **All project copy, numbers, and images:** `src/app/projectData.ts`
- **Headline, About section, toolbox, contact info:** `src/app/Home.tsx`
  (the alternate headline options are listed at the top of the file)
- **Styles:** `src/index.css`
- **Images and videos:** `public/media/` (WebP and compressed MP4)
- **Resume:** `public/Emma-Dodd-Resume.pdf`. To change it, edit `resume/resume.html`,
  then run `node resume/pdf.cjs out.png` (needs Playwright).

## Run it on your computer

```
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Put it on GitHub Pages

1. Create a new GitHub repository. Name it `YOURUSERNAME.github.io` for a site at
   `https://YOURUSERNAME.github.io`, or anything else (like `portfolio`) for
   `https://YOURUSERNAME.github.io/portfolio/`.
2. Move `deploy.yml` (in this folder) into a new `.github/workflows/` folder, then upload
   the contents of this `site` folder to the repository (not `node_modules`).
3. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds the site and
   publishes it. It works out the correct base path from the repo name automatically.

Direct links to project pages (like `/work/roundbird-coffee`) work because the build
copies `index.html` to `404.html`.
