import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// BASE_PATH is set by the GitHub Pages workflow ("/" for username.github.io,
// "/repo-name/" for a project site). Locally it defaults to "/".
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
})
