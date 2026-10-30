import { useLayoutEffect, useRef } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MOTION_OK } from "./interactions"
import { Arrow } from "./Media"

gsap.registerPlugin(ScrollTrigger)

/* The one top bar used on every page. It stays fixed to the top of the
   screen, so the way back is always one click away, even while the Treasury
   page is pinned for the printer. On project pages it leads with a big
   "All work" button and shows a thin line for how far down you've read.
   Once you scroll, it picks up a more solid background so it reads over
   any section. */

const RESUME = `${import.meta.env.BASE_URL}Emma-Dodd-Resume.pdf`
const EMAIL = "emmagdodd1@gmail.com"

export function SiteNav({ variant }: { variant: "home" | "project" }) {
  const bar = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = bar.current
    if (!el) return
    const solid = ScrollTrigger.create({
      start: 24,
      end: "max",
      onToggle: (self) => el.classList.toggle("is-scrolled", self.isActive || self.progress === 1),
    })
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from(el.firstElementChild, { yPercent: -140, duration: 1, ease: "expo.out", delay: 0.15 })
      const line = el.querySelector(".site-nav-progress")
      if (line) {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } })
      }
    })
    return () => {
      solid.kill()
      mm.revert()
    }
  }, [])

  return (
    <header className={`site-nav site-nav--${variant}`} ref={bar}>
      <div className="site-nav-bar">
        {variant === "project" ? (
          <>
            <Link className="site-nav-back" to={{ pathname: "/", hash: "#work" }} data-magnetic="0.2">
              <Arrow className="arrow--back" />
              <span>All work</span>
            </Link>
            <Link className="site-nav-brand" to="/">
              Emma Dodd
            </Link>
          </>
        ) : (
          <a className="site-nav-brand" href="#top">
            Emma Dodd
          </a>
        )}

        <nav className="site-nav-links" aria-label="Main navigation">
          {variant === "home" && (
            <>
              <a href="#work" data-magnetic="0.2">Work</a>
              <a href="#about" data-magnetic="0.2">About</a>
            </>
          )}
          <a href={RESUME} target="_blank" rel="noreferrer" data-magnetic="0.2">
            Resume
          </a>
          <a href={variant === "home" ? "#contact" : `mailto:${EMAIL}`} data-magnetic="0.2">
            Contact
          </a>
        </nav>
        {variant === "project" && <span className="site-nav-progress" aria-hidden="true" />}
      </div>
    </header>
  )
}
