import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/* Emma's favorite song, styled like her pink player.
   It hides off the right edge of the homepage with just a little tab
   peeking out. Click the tab and the player pops out as a surprise; click
   it again, press Escape or scroll a little way and it tucks itself away.
   The album art is swapped for a spinning record so we're not reposting
   Queen's cover art; play opens the song on Spotify. */

const SPOTIFY = "https://open.spotify.com/search/Cool%20Cat%20Queen"
const SCROLL_AWAY = 280

export function MusicPlayer() {
  const dock = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  openRef.current = open

  // closed = slid right until only the tab and a sliver of the player show
  const hiddenX = () => {
    const el = dock.current
    if (!el) return 0
    return el.offsetWidth + parseFloat(getComputedStyle(el).right || "0") - 14
  }

  useLayoutEffect(() => {
    const el = dock.current
    if (!el) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    gsap.set(el, { x: hiddenX })
    const ctx = gsap.context(() => {
      if (still) return
      // a little wiggle now and then, to say "there's something here"
      gsap.to(".player-tab", { x: -6, duration: 0.18, ease: "power1.inOut", yoyo: true, repeat: 3, repeatDelay: 0, delay: 4 })
      gsap.to(".player-tab", { x: -6, duration: 0.18, ease: "power1.inOut", yoyo: true, repeat: 3, repeatDelay: 9, delay: 16 })
    }, el)
    const onResize = () => !openRef.current && gsap.set(el, { x: hiddenX })
    window.addEventListener("resize", onResize)

    // step aside while the contact buttons are on screen, so it never covers them
    const aside = ScrollTrigger.create({
      trigger: "#contact",
      start: "top 85%",
      end: "max",
      onToggle: (self) => {
        if (self.isActive) setOpen(false)
        gsap.to(el, { autoAlpha: self.isActive ? 0 : 1, duration: still ? 0 : 0.3, ease: "power1.out" })
      },
    })
    return () => {
      aside.kill()
      window.removeEventListener("resize", onResize)
      ctx.revert()
    }
  }, [])

  useLayoutEffect(() => {
    const el = dock.current
    if (!el) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const player = el.querySelector(".player")
    if (open) {
      gsap.to(el, { x: 0, duration: still ? 0 : 0.8, ease: "back.out(1.5)", overwrite: true })
      if (!still) gsap.fromTo(player, { rotation: 9, scale: 0.9 }, { rotation: 1.5, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.55)" })
    } else {
      gsap.to(el, { x: hiddenX, duration: still ? 0 : 0.55, ease: "power3.in", overwrite: true })
    }
    if (!open) return

    // tuck it away again once they scroll on, or press Escape
    const openedAt = window.scrollY
    const watch = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: () => Math.abs(window.scrollY - openedAt) > SCROLL_AWAY && setOpen(false),
    })
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      watch.kill()
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <aside className={`player-dock${open ? " is-open" : ""}`} ref={dock} aria-label="Emma's favorite song">
      <button
        type="button"
        className="player-tab"
        aria-expanded={open}
        aria-controls="player"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{open ? "×" : "♪"}</span>
        <span>{open ? "Hide" : "On repeat"}</span>
      </button>

      <figure className="player" id="player" aria-label="Cool Cat by Queen" inert={!open}>
        <div className="player-screen">
          <span className="player-label">On repeat</span>
          <div className="vinyl" aria-hidden="true">
            <span className="vinyl-label">
              <span>Cool Cat</span>
            </span>
          </div>
        </div>
        <figcaption className="player-meta">
          <strong>Cool Cat</strong>
          <span>Queen · Hot Space</span>
        </figcaption>
        <div className="player-progress" aria-hidden="true">
          <span />
        </div>
        <div className="player-times" aria-hidden="true">
          <span>1:12</span>
          <span>-2:17</span>
        </div>
        <div className="player-controls">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="pc-small">
            <path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 5l2 2-2 2M18 15l2 2-2 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M11 6 3 12l8 6V6zm9 0-8 6 8 6V6z" fill="currentColor" />
          </svg>
          <a className="player-play" href={SPOTIFY} target="_blank" rel="noreferrer" aria-label="Listen to Cool Cat by Queen on Spotify">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </a>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M13 6l8 6-8 6V6zM4 6l8 6-8 6V6z" fill="currentColor" />
          </svg>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="pc-small">
            <path d="M5 9a4 4 0 0 1 4-4h9l-3-3M19 15a4 4 0 0 1-4 4H6l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </figure>
    </aside>
  )
}
