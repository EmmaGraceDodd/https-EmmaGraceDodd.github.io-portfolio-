import { useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"

/* Printed pieces you can handle: a brochure you page through and a postcard
   you flip over. Both are GSAP-driven 3D transforms on the real artwork. */

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches

/* ---------- Brochure flipbook ----------
   The brochure is a bi-fold: 4 panels on 2 leaves.
     leaf 1: front = cover (outside, right half)  back = inside left
     leaf 2: front = inside right                 back = back cover (outside, left half)
   `p` runs 0 → 2 (leaves turned). Each leaf rotates around the spine, and
   the book slides so whatever is showing stays centered. Drag to turn by
   hand, tap a side to turn, or use the buttons / arrow keys. */

type Half = { src: string; side: "left" | "right" }

function Face({ half, back = false }: { half: Half; back?: boolean }) {
  return (
    <div className={`cl-fb-face${back ? " cl-fb-face--back" : ""}`}>
      <img src={half.src} alt="" draggable={false} className={`cl-fb-img cl-fb-img--${half.side}`} />
      <span className="cl-fb-shade" />
    </div>
  )
}

export function Flipbook({ outside, inside, name, onEnlarge }: { outside: string; inside: string; name: string; onEnlarge: () => void }) {
  const book = useRef<HTMLDivElement>(null)
  const state = useRef({ p: 0 })
  const [page, setPage] = useState(0)
  const leaves: [Half, Half][] = [
    [{ src: outside, side: "right" }, { src: inside, side: "left" }],
    [{ src: inside, side: "right" }, { src: outside, side: "left" }],
  ]

  const render = () => {
    const el = book.current
    if (!el) return
    const p = state.current.p
    el.querySelectorAll<HTMLElement>(".cl-fb-leaf").forEach((leaf, i) => {
      const t = gsap.utils.clamp(0, 1, p - i)
      const angle = t * 180
      gsap.set(leaf, {
        rotationY: -angle,
        z: Math.sin(t * Math.PI) * 40,
        zIndex: angle > 90 ? 10 + i : 20 - i,
      })
      // the turning page darkens as it tilts away from the light
      const [front, back] = leaf.querySelectorAll<HTMLElement>(".cl-fb-shade")
      gsap.set(front, { opacity: angle < 90 ? (angle / 90) * 0.45 : 0 })
      gsap.set(back, { opacity: angle > 90 ? ((180 - angle) / 90) * 0.45 : 0 })
    })
    // keep what's showing centered: cover alone, the open spread, back cover alone
    const shift = p <= 1 ? gsap.utils.interpolate(-25, 0, p) : gsap.utils.interpolate(0, 25, p - 1)
    gsap.set(el.querySelector(".cl-fb-book"), { xPercent: shift })
    const cast = el.querySelector(".cl-fb-cast")
    gsap.set(cast, { opacity: Math.sin(gsap.utils.clamp(0, 1, p % 1 || 0) * Math.PI) * 0.6 })
  }

  const goTo = (target: number) => {
    const to = gsap.utils.clamp(0, 2, Math.round(target))
    setPage(to)
    gsap.to(state.current, { p: to, duration: still() ? 0 : 0.9, ease: "power3.inOut", overwrite: true, onUpdate: render })
  }

  useLayoutEffect(() => {
    render()
    const el = book.current
    if (!el) return
    // drag to turn: a page's worth of drag is one leaf
    let startX = 0
    let startP = 0
    let dragging = false
    let moved = false
    const pageWidth = () => (el.querySelector(".cl-fb-book") as HTMLElement).offsetWidth / 2
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return
      dragging = true
      moved = false
      startX = e.clientX
      startP = state.current.p
      gsap.killTweensOf(state.current)
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 6) moved = true
      if (!moved) return
      state.current.p = gsap.utils.clamp(0, 2, startP - dx / pageWidth())
      render()
    }
    const up = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (moved) {
        const p = state.current.p
        // finish the turn in whichever direction it was going
        goTo(p > startP ? Math.ceil(p - 0.2) : Math.floor(p + 0.2))
        return
      }
      // a tap: right side turns forward, left side turns back
      const r = el.getBoundingClientRect()
      goTo(state.current.p + (e.clientX > r.left + r.width / 2 ? 1 : -1))
    }
    el.addEventListener("pointerdown", down)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)
    return () => {
      el.removeEventListener("pointerdown", down)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up)
      el.removeEventListener("pointercancel", up)
      gsap.killTweensOf(state.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const labels = ["Cover", "Inside", "Back cover"]
  return (
    <div className="cl-flipbook">
      <div
        className="cl-fb-stage"
        ref={book}
        tabIndex={0}
        role="group"
        aria-roledescription="brochure"
        aria-label={`Brochure for ${name}: ${labels[page]}. Use the arrow keys to turn the page.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") goTo(page + 1)
          if (e.key === "ArrowLeft") goTo(page - 1)
        }}
      >
        <span className="cl-fb-cast" aria-hidden="true" />
        <div className="cl-fb-book">
          <div className="cl-fb-spine" aria-hidden="true" />
          {leaves.map(([front, back], i) => (
            <div className="cl-fb-leaf" key={i} aria-hidden="true">
              <Face half={front} />
              <Face half={back} back />
            </div>
          ))}
        </div>
      </div>
      {/* one frosted capsule: back, where you are, next. Then "view full size". */}
      <div className="cl-fb-controls">
        <div className="cl-fb-pager">
          <button type="button" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Previous page">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14.5 6l-6 6 6 6" />
            </svg>
          </button>
          <span className="cl-fb-where">
            <span aria-live="polite">{labels[page]}</span>
            <span className="cl-fb-dots" aria-hidden="true">
              {labels.map((label, i) => (
                <i key={label} className={i === page ? "is-on" : undefined} />
              ))}
            </span>
          </span>
          <button type="button" onClick={() => goTo(page + 1)} disabled={page === 2} aria-label="Next page">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.5 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <button type="button" className="cl-fb-enlarge" onClick={onEnlarge}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
          </svg>
          View full size
        </button>
      </div>
    </div>
  )
}

/* ---------- Postcard ----------
   Click (or tap) to flip it over and back. It lifts a little mid-flip, the
   way a card does when you turn it in your hand. With a mouse it also tilts
   toward the cursor so it reads as something you can pick up. */

export function Postcard({ front, back, name }: { front: { src: string; alt: string }; back: { src: string; alt: string }; name: string }) {
  const root = useRef<HTMLButtonElement>(null)
  const [flipped, setFlipped] = useState(false)
  const first = useRef(true)

  useLayoutEffect(() => {
    const card = root.current?.querySelector(".cl-pc-card")
    if (!card) return
    if (first.current) {
      first.current = false
      return
    }
    const d = still() ? 0 : 0.9
    gsap.to(card, { rotationY: flipped ? 180 : 0, duration: d, ease: "power3.inOut", overwrite: "auto" })
    if (d) gsap.fromTo(card, { z: 0 }, { z: 70, duration: d / 2, ease: "power2.out", yoyo: true, repeat: 1, overwrite: false })
  }, [flipped])

  useLayoutEffect(() => {
    const el = root.current
    const tilt = el?.querySelector<HTMLElement>(".cl-pc-tilt")
    if (!el || !tilt || still() || !finePointer()) return
    const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3.out" })
    const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3.out" })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ry(((e.clientX - r.left) / r.width - 0.5) * 10)
      rx(((e.clientY - r.top) / r.height - 0.5) * -8)
    }
    const leave = () => {
      rx(0)
      ry(0)
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
    }
  }, [])

  // a new lender starts on the front again
  useLayoutEffect(() => {
    setFlipped(false)
  }, [front.src])

  return (
    <button
      type="button"
      className="cl-postcard"
      ref={root}
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={`Postcard for ${name}, showing the ${flipped ? "back" : "front"}. Flip it over.`}
    >
      <span className="cl-pc-tilt">
        <span className="cl-pc-card">
          <span className="cl-pc-face">
            <img src={front.src} alt={front.alt} draggable={false} />
          </span>
          <span className="cl-pc-face cl-pc-face--back">
            <img src={back.src} alt={back.alt} draggable={false} />
          </span>
        </span>
      </span>
      <span className="cl-pc-hint" aria-hidden="true">
        {flipped ? "Tap to flip back ↺" : "Tap to flip ↻"}
      </span>
    </button>
  )
}
