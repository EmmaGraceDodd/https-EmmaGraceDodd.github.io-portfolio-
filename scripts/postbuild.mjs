// GitHub Pages has no server-side routing. Serving index.html as 404.html lets
// links like /work/roundbird-coffee load the app, which then shows the right page.
import { copyFileSync, writeFileSync } from "node:fs"
copyFileSync("dist/index.html", "dist/404.html")
writeFileSync("dist/.nojekyll", "")
console.log("postbuild: wrote 404.html and .nojekyll")
