import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"

gsap.registerPlugin(ScrollToPlugin)

/* Small touches used across the whole site:
     data-magnetic    buttons and links lean toward the cursor (mouse only)
     useSmoothAnchors "#section" links glide to their section
     <Sparkles />     a little burst of stars wherever you click or tap
   None of it runs for people who turn off motion. */

export const FINE_POINTER = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"

export function useMagnetic(scope: RefObject<HTMLElement | null>, dep?: unknown) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const mm = gsap.matchMedia()
    mm.add(FINE_POINTER, () => {
      const cleanups = gsap.utils.toArray<HTMLElement>("[data-magnetic]", root).map((el) => {
        const strength = Number(el.dataset.magnetic) || 0.3
        const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" })
        const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - (r.left + r.width / 2)) * strength)
          yTo((e.clientY - (r.top + r.height / 2)) * strength)
        }
        const leave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: true })
        }
        el.addEventListener("pointermove", move)
        el.addEventListener("pointerleave", leave)
        return () => {
          el.removeEventListener("pointermove", move)
          el.removeEventListener("pointerleave", leave)
        }
      })
      return () => cleanups.forEach((fn) => fn())
    })
    return () => mm.revert()
  }, [scope, dep])
}

export function useSmoothAnchors(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current
    // the private preview link routes with #hashes, so leave those alone there
    if (!root || import.meta.env.VITE_PREVIEW) return
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
      if (!link || link.classList.contains("skip-link")) return
      const target = document.querySelector<HTMLElement>(link.getAttribute("href") || "")
      if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      e.preventDefault()
      // CSS smooth scrolling would ease every frame GSAP sets, so pause it
      const html = document.documentElement
      const restore = () => (html.style.scrollBehavior = "")
      html.style.scrollBehavior = "auto"
      gsap.to(window, {
        duration: 1.2,
        ease: "power3.inOut",
        scrollTo: { y: target, autoKill: true },
        onInterrupt: restore,
        onComplete: () => {
          restore()
          history.replaceState(null, "", link.getAttribute("href"))
          target.focus({ preventScroll: true })
        },
      })
    }
    root.addEventListener("click", onClick)
    return () => root.removeEventListener("click", onClick)
  }, [scope])
}

const SPARK_COLORS = ["#f59ac6", "#c6b0f4", "#ffd36e", "#e86aa7", "#ffffff"]

export function Sparkles() {
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = layer.current
    if (!host) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const burst = (e: PointerEvent) => {
        // let dragging the bubbles and the image viewer stay clean
        if (e.target instanceof Element && e.target.closest(".bubble, dialog, input, textarea")) return
        const count = 7
        for (let i = 0; i < count; i++) {
          const star = document.createElement("span")
          star.className = "sparkle"
          star.textContent = i % 3 ? "✦" : "✧"
          star.style.color = SPARK_COLORS[i % SPARK_COLORS.length]
          host.appendChild(star)
          const angle = (i / count) * Math.PI * 2 + gsap.utils.random(-0.4, 0.4)
          const reach = gsap.utils.random(28, 64)
          gsap.set(star, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50, scale: 0 })
          gsap
            .timeline({ onComplete: () => star.remove() })
            .to(star, {
              x: e.clientX + Math.cos(angle) * reach,
              y: e.clientY + Math.sin(angle) * reach,
              rotation: gsap.utils.random(-120, 120),
              scale: gsap.utils.random(0.7, 1.25),
              duration: 0.55,
              ease: "power3.out",
            })
            .to(star, { y: "+=18", autoAlpha: 0, scale: 0.2, duration: 0.45, ease: "power1.in" }, ">-0.1")
        }
      }
      window.addEventListener("pointerdown", burst, { passive: true })
      return () => window.removeEventListener("pointerdown", burst)
    })
    return () => mm.revert()
  }, [])

  return <div className="sparkle-layer" ref={layer} aria-hidden="true" />
}
