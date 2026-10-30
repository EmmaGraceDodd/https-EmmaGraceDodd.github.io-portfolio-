import gsap from "gsap"
import { Flip } from "gsap/Flip"

gsap.registerPlugin(Flip)

/* Clicking a project card grows its cover image into the project page.
   launchCard() lifts a copy of the cover off the card (fixed to the screen)
   just before the route changes. When the project page mounts, landCard()
   uses Flip.fit to fly that copy onto the page's hero image, then hands
   over to the real image. Pages without a matching hero image (Treasury,
   Roundbird) get the copy filling the screen and fading away instead. */

let ghost: HTMLImageElement | null = null

/** Returns false when the transition shouldn't run, so the link navigates normally. */
export function launchCard(frame: HTMLElement | null, radius: string) {
  if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  const media = frame.querySelector<HTMLImageElement | HTMLVideoElement>(":scope > img, :scope > video")
  const src = media instanceof HTMLVideoElement ? media.poster : media?.currentSrc || media?.src
  if (!src) return false

  ghost?.remove()
  const r = frame.getBoundingClientRect()
  const copy = document.createElement("img")
  copy.src = src
  copy.alt = ""
  copy.className = "card-ghost"
  Object.assign(copy.style, {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    borderRadius: radius,
  })
  document.body.appendChild(copy)
  ghost = copy
  return true
}

export function landCard(target: Element | null) {
  const copy = ghost
  if (!copy) return
  ghost = null
  // measure the new page from the top, where it opens
  window.scrollTo({ top: 0, behavior: "instant" })
  const fade = () => gsap.to(copy, { autoAlpha: 0, duration: 0.5, ease: "power1.out", onComplete: () => copy.remove() })

  if (target instanceof HTMLElement && target.getBoundingClientRect().height > 40) {
    gsap.set(target, { autoAlpha: 0 })
    gsap.to(copy, { borderRadius: getComputedStyle(target.parentElement ?? target).borderRadius, duration: 0.9, ease: "expo.inOut" })
    Flip.fit(copy, target, {
      duration: 0.9,
      ease: "expo.inOut",
      scale: false,
      onComplete: () => {
        gsap.set(target, { autoAlpha: 1 })
        fade()
      },
    })
  } else {
    gsap.to(copy, {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      duration: 0.75,
      ease: "expo.inOut",
      onComplete: fade,
    })
  }
}
