import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router"
import { Home } from "./Home"
import { ProjectPage } from "./ProjectPage"
import { projects } from "./projectData"

const routes: RouteObject[] = [
  { path: "/", Component: Home },
  { path: "/work/:slug", Component: ProjectPage },
  { path: "*", Component: Home },
]

const isSlug = (h: string) => projects.some((p) => p.slug === h)

/** Preview mode (private Claude preview link): pages are addressed as #slug
 *  because that viewer only allows plain #name links. The real site uses
 *  normal paths like /work/roundbird-coffee. */
function createPreviewRouter() {
  const hash = () => window.location.hash.slice(1)
  const router = createMemoryRouter(routes, {
    initialEntries: [isSlug(hash()) ? `/work/${hash()}` : { pathname: "/", hash: window.location.hash }],
  })
  let syncing = false
  router.subscribe((state) => {
    const { pathname, hash: h } = state.location
    const want = pathname.startsWith("/work/") ? pathname.slice(6) : h.slice(1)
    if (hash() !== want) {
      syncing = true
      window.location.hash = want
    }
  })
  window.addEventListener("hashchange", () => {
    if (syncing) {
      syncing = false
      return
    }
    const h = hash()
    if (isSlug(h)) router.navigate(`/work/${h}`)
    else if (router.state.location.pathname !== "/") router.navigate({ pathname: "/", hash: h ? `#${h}` : "" })
  })
  return router
}

// BASE_URL is "/" locally and "/<repo-name>/" on GitHub Pages project sites.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

export const router = import.meta.env.VITE_PREVIEW
  ? createPreviewRouter()
  : createBrowserRouter(routes, { basename })
