import { createBrowserRouter } from "react-router"
import { Home } from "./Home"
import { ProjectPage } from "./ProjectPage"

// BASE_URL is "/" locally and "/<repo-name>/" on GitHub Pages project sites.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

export const router = createBrowserRouter(
  [
    { path: "/", Component: Home },
    { path: "/work/:slug", Component: ProjectPage },
    { path: "*", Component: Home },
  ],
  { basename },
)
