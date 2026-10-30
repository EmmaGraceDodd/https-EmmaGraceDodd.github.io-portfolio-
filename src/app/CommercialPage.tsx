import { Suspense, lazy, useLayoutEffect, useRef, useState } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Flipbook, Postcard } from "./CampaignPieces"
import { ImageViewer } from "./ImageViewer"
import { FINE_POINTER, MOTION_OK, useMagnetic, useMedia, useSmoothAnchors } from "./interactions"
import type { MailerBoxHandle } from "./MailerBox3D"
import { Arrow } from "./Media"
import { useTextMotion } from "./motion"
import { media, type Project } from "./projectData"
import { SiteNav } from "./SiteNav"

gsap.registerPlugin(ScrollTrigger)

// three.js only loads for this page, after the page itself is on screen
const MailerBox3D = lazy(() => import("./MailerBox3D"))

/* Commercial Lending case study: "a box worth opening".
   Design language: the mailroom and the print shop. Crop marks, a postmark,
   perforated dividers and typewriter captions, all quiet, so the work leads.

   The mailer sits closed with an "Open me" tag. Click it and the lid swings
   open on its hinge (a real 3D box wrapped in the print artwork), then the
   pieces pop out one by one and settle around it. Each piece leads to its
   own section: a brochure you page through and a postcard you flip
   (desktop), shown as crisp flat artwork on phones, and the organizer with
   your own initials on it.
   Without WebGL, or with reduced motion, the box is a photo that opens with
   a simple crossfade and nothing bounces. */

type Picture = { src: string; alt: string }

const LENDERS = [
  { id: "harmon", name: "Andrew Harmon", city: "Jacksonville" },
  { id: "wendell", name: "Bill Wendell", city: "Jacksonville" },
  { id: "greene", name: "Matt Greene", city: "Jacksonville" },
  { id: "owston", name: "Chuck Owston", city: "Orlando" },
  { id: "allport", name: "Peter Allport", city: "Orlando" },
] as const
type Lender = (typeof LENDERS)[number]

const lenderSet = (l: Lender) => ({
  outside: { src: media(`cl-brochure-${l.id}-outside.webp`), alt: `Outside of the brochure for ${l.name}, with ${l.name}'s phone, email and QR code` },
  inside: { src: media("cl-brochure-inside.webp"), alt: "Inside of the CPA brochure: We speak your language, Why Florida Capital Bank, and The professional advantage" },
  front: {
    src: media(l.city === "Orlando" ? "cl-postcard-front-orlando.webp" : "cl-postcard-front-jax.webp"),
    alt: `Postcard front: we'll cover up to $5,000 in closing costs on owner-occupied commercial real estate loans, over the ${l.city} skyline`,
  },
  back: { src: media(`cl-postcard-${l.id}-back.webp`), alt: `Postcard back with ${l.name}'s contact details and QR code` },
})

const ORGANIZER: Picture = { src: media("cl-organizer-cutout.webp"), alt: "Brown leather cord organizer holding a charger and earbuds, rolled up beside it with gold initials" }

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* A round postmark, drawn in SVG so it stays crisp at any size. */
function Postmark() {
  return (
    <svg className="cl-postmark" viewBox="0 0 220 120" aria-hidden="true">
      <defs>
        <path id="cl-postmark-ring" d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
      </defs>
      <circle cx="60" cy="60" r="52" />
      <circle cx="60" cy="60" r="32" />
      <text>
        <textPath href="#cl-postmark-ring" startOffset="0">
          FLORIDA CAPITAL BANK · COMMERCIAL LENDING ·
        </textPath>
      </text>
      <text className="cl-postmark-mid" x="60" y="57" textAnchor="middle">
        CPA
      </text>
      <text className="cl-postmark-small" x="60" y="72" textAnchor="middle">
        MAIL
      </text>
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M118 ${34 + i * 17} q12 -7 24 0 t24 0 t24 0 t24 0`} />
      ))}
    </svg>
  )
}

export default function CommercialPage({ project, next }: { project: Project; next: Project }) {
  const root = useRef<HTMLElement>(null)
  const boxApi = useRef<MailerBoxHandle>(null)
  const sequence = useRef<gsap.core.Timeline | null>(null)
  const floats = useRef<gsap.core.Tween[]>([])
  const [viewer, setViewer] = useState<{ items: Picture[]; start: number } | null>(null)
  const [lender, setLender] = useState<Lender>(LENDERS[0])
  const [initials, setInitials] = useState("ANB")
  const [use3d, setUse3d] = useState(() => typeof window !== "undefined" && !reduced())
  const [ready3d, setReady3d] = useState(false)
  const [opened, setOpened] = useState(false)
  // phones and small tablets get flat, crisp artwork instead of 3D flips
  const flat = useMedia("(max-width: 900px)")
  const set = lenderSet(lender)
  const hero = lenderSet(LENDERS[0])

  const pieces = [
    { key: "organizer", label: "The gift", href: "#cl-gift", src: ORGANIZER.src, alt: "Engraved leather cord organizer" },
    { key: "brochure", label: "Brochure", href: "#cl-brochure", src: hero.outside.src, alt: "Lender brochure, outside" },
    { key: "postcard", label: "Postcard", href: "#cl-postcard", src: hero.front.src, alt: "Special-offer postcard" },
  ]

  // arriving: a quiet fade-in (this page has no card-to-hero flight)
  useLayoutEffect(() => {
    const page = root.current
    if (!page || reduced()) return
    const tween = gsap.from(page, { autoAlpha: 0, duration: 0.5, ease: "power1.out" })
    return () => {
      tween.revert()
    }
  }, [])

  // pieces wait inside the box; the tag sways on its string
  useLayoutEffect(() => {
    const page = root.current
    if (!page) return
    const ctx = gsap.context(() => {
      gsap.set(".cl-piece", { autoAlpha: 0 })
      if (!reduced()) {
        gsap.fromTo(".cl-open-tag", { rotation: -7 }, { rotation: 5, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 0%" })
      }
    }, page)
    return () => ctx.revert()
  }, [])

  // the 3D box crossfades in over the photo once its first frame is drawn
  useLayoutEffect(() => {
    if (!ready3d) return
    const page = root.current
    gsap.to(page?.querySelector(".cl-box-3d") ?? [], { autoAlpha: 1, duration: 0.5, ease: "power1.out" })
    gsap.to(page?.querySelector(".cl-box-closed") ?? [], { autoAlpha: 0, duration: 0.5, ease: "power1.out" })
  }, [ready3d])

  /* Pieces pop out of the box's opening one at a time: up in an arc, a
     little spin, then they spring into place and keep floating gently. */
  const popPieces = () => {
    const page = root.current!
    const items = gsap.utils.toArray<HTMLElement>(".cl-piece", page)
    gsap.set(items, { x: 0, y: 0, rotation: 0, scale: 1 })
    const button = page.querySelector<HTMLElement>(".cl-box-button")!.getBoundingClientRect()
    const mouth = use3d && ready3d && boxApi.current ? boxApi.current.mouthPoint() : { x: button.left + button.width / 2, y: button.top + button.height * 0.52 }
    const tl = gsap.timeline()
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect()
      const dx = mouth.x - (r.left + r.width / 2)
      const dy = mouth.y - (r.top + r.height / 2)
      const spin = (i - 1) * 14
      tl.fromTo(
        el,
        { x: dx, y: dy, scale: 0.12, rotation: spin * 2, autoAlpha: 0 },
        {
          keyframes: [
            { x: dx * 0.55, y: Math.min(dy, 0) - 110, scale: 0.75, rotation: -spin, autoAlpha: 1, duration: 0.38, ease: "power2.out" },
            { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.15, ease: "elastic.out(1, 0.55)" },
          ],
        },
        i * 0.2,
      )
    })
    tl.call(() => {
      floats.current = items.map((el, i) =>
        gsap.to(el.querySelector(".cl-piece-float"), { y: -6, rotation: i % 2 ? 0.8 : -0.8, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 }),
      )
    })
    return tl
  }

  const stopFloating = () => {
    floats.current.forEach((t) => t.revert())
    floats.current = []
  }

  const toggleBox = () => {
    stopFloating()
    if (!opened) {
      setOpened(true) // the pieces' row exists from here on; the effect below animates
      return
    }
    const page = root.current
    if (!page) return
    if (reduced() || !sequence.current) {
      gsap.set(page.querySelectorAll(".cl-piece"), { autoAlpha: 0 })
      gsap.set(page.querySelector(".cl-box-open-photo"), { autoAlpha: 0 })
      gsap.set([page.querySelector(".cl-box-closed"), page.querySelector(".cl-open-tag")], { autoAlpha: 1 })
      setOpened(false)
      return
    }
    // pack it back up: run the opening backwards, then let the row collapse
    sequence.current
      .eventCallback("onReverseComplete", () => setOpened(false))
      .timeScale(1.6)
      .reverse()
  }

  // opening runs after the layout has room for the pieces (on phones their row appears now)
  useLayoutEffect(() => {
    const page = root.current
    if (!opened || !page || sequence.current?.reversed()) return
    if (reduced()) {
      gsap.set(page.querySelectorAll(".cl-piece"), { autoAlpha: 1 })
      gsap.set(page.querySelector(".cl-box-open-photo"), { autoAlpha: 1 })
      gsap.set([page.querySelector(".cl-box-closed"), page.querySelector(".cl-open-tag")], { autoAlpha: 0 })
      return
    }
    const tl = gsap.timeline()
    tl.to(page.querySelector(".cl-open-tag"), { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in" }, 0)
    if (use3d && ready3d && boxApi.current) {
      tl.add(boxApi.current.openTimeline(), 0)
    } else {
      // photo fallback: a simple, honest crossfade from closed to open
      tl.to(page.querySelector(".cl-box-closed"), { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 0)
      tl.fromTo(page.querySelector(".cl-box-open-photo"), { autoAlpha: 0, scale: 0.98 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power1.out" }, 0)
    }
    tl.add(popPieces(), use3d && ready3d ? 0.8 : 0.4)
    sequence.current = tl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  // when it closes, the next open builds a fresh sequence
  useLayoutEffect(() => {
    if (!opened) sequence.current = null
  }, [opened])

  useLayoutEffect(() => {
    const page = root.current
    if (!page) return
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add(MOTION_OK, () => {
        // the postmark turns slowly as you scroll past, like it's being stamped
        gsap.fromTo(".cl-postmark", { rotation: -8 }, { rotation: 10, ease: "none", scrollTrigger: { trigger: ".cl-hero", start: "top top", end: "bottom top", scrub: 0.6 } })
        gsap.utils.toArray<HTMLElement>(".cl-journey figure").forEach((fig, i) => {
          gsap.from(fig, { y: 60, rotation: i ? 3 : -3, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: fig, start: "top 85%", once: true } })
        })
        gsap.from(".cl-result-lead, .cl-result-side > div, .cl-outcome", {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".cl-results", start: "top 75%", once: true },
        })
      })
      // mouse only: the organizer tilts like you're holding it
      mm.add(FINE_POINTER, () => {
        const card = page.querySelector<HTMLElement>(".cl-gift-photo")
        if (!card) return
        gsap.set(card, { transformPerspective: 900 })
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" })
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" })
        const move = (e: PointerEvent) => {
          const r = card.getBoundingClientRect()
          ry(((e.clientX - r.left) / r.width - 0.5) * 8)
          rx(((e.clientY - r.top) / r.height - 0.5) * -6)
        }
        const leave = () => {
          rx(0)
          ry(0)
        }
        card.addEventListener("pointermove", move)
        card.addEventListener("pointerleave", leave)
        return () => {
          card.removeEventListener("pointermove", move)
          card.removeEventListener("pointerleave", leave)
        }
      })
    }, page)
    const imgs = Array.from(page.querySelectorAll("img"))
    const refresh = () => ScrollTrigger.refresh()
    imgs.forEach((img) => img.complete || img.addEventListener("load", refresh, { once: true }))
    return () => {
      imgs.forEach((img) => img.removeEventListener("load", refresh))
      floats.current.forEach((t) => t.kill())
      sequence.current?.kill()
      mm.revert()
      ctx.revert()
    }
  }, [])

  // switching lenders: the new versions settle in
  const lenderStage = useRef<HTMLDivElement>(null)
  const firstLender = useRef(true)
  useLayoutEffect(() => {
    if (firstLender.current) {
      firstLender.current = false
      return
    }
    if (reduced()) return
    const items = lenderStage.current?.querySelectorAll(".cl-material")
    if (items) gsap.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, overwrite: "auto" })
  }, [lender])

  // a new monogram is stamped in: it presses down into the leather
  const monogram = useRef<HTMLSpanElement>(null)
  const firstInitials = useRef(true)
  useLayoutEffect(() => {
    if (firstInitials.current) {
      firstInitials.current = false
      return
    }
    if (!monogram.current || reduced()) return
    gsap.fromTo(monogram.current, { scale: 1.25, autoAlpha: 0.2, filter: "blur(1.5px)" }, { scale: 1, autoAlpha: 1, filter: "blur(0.2px)", duration: 0.45, ease: "power3.out" })
  }, [initials])

  useTextMotion(root)
  useMagnetic(root)
  useSmoothAnchors(root)

  const [loans, cost, lenders] = project.metrics ?? []

  return (
    <main className="case-page cl-page" ref={root}>
      <SiteNav variant="project" />

      <section className="cl-hero">
        <Postmark />
        <div className="cl-hero-text">
          <p className="eyebrow">
            Project {project.number} · {project.year}
          </p>
          <h1 data-split="lines" data-split-now data-ripple>
            Commercial Lending
            <span>Campaign</span>
          </h1>
          <p className="cl-lede" data-split="lines" data-split-now>
            {project.summary}
          </p>
        </div>

        <div className={`cl-stage${opened ? " is-open" : ""}`}>
          <span className="cl-crops" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <button
            type="button"
            className="cl-box-button"
            onClick={toggleBox}
            onPointerEnter={() => boxApi.current?.peek(true)}
            onPointerLeave={() => boxApi.current?.peek(false)}
            aria-label={opened ? "Close the mailer box" : "Open the mailer box"}
            aria-expanded={opened}
          >
            <img className="cl-box-closed" src={media("cl-box-closed-cutout.webp")} alt="" fetchPriority="high" />
            <img className="cl-box-open-photo" src={media("cl-box-open-cutout.webp")} alt="" />
            {use3d && (
              <Suspense fallback={null}>
                <MailerBox3D ref={boxApi} onReady={() => setReady3d(true)} onFail={() => setUse3d(false)} />
              </Suspense>
            )}
            <span className="cl-open-tag" aria-hidden="true">
              Open me
            </span>
          </button>
          <p className="cl-fig cl-fig--box" aria-hidden="true">
            The mailer
          </p>
          {opened && (
            <button type="button" className="cl-repack" onClick={toggleBox}>
              Pack it back up ↺
            </button>
          )}

          <ul className="cl-pieces" aria-label="What was inside the box">
            {pieces.map((piece) => (
              <li className={`cl-piece cl-piece--${piece.key}`} key={piece.key}>
                <a href={piece.href} aria-label={`${piece.label}: jump to it`}>
                  <span className="cl-piece-float">
                    <span className="cl-piece-card">
                      <img src={piece.src} alt={piece.alt} draggable={false} />
                    </span>
                    <span className="cl-piece-tag">{piece.label} ↓</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cl-story">
        <article>
          <h2 data-split="lines" data-ripple>
            {project.challengeTitle}
          </h2>
          <p>{project.challenge}</p>
        </article>
        <article>
          <h2 data-split="lines" data-ripple>
            {project.approachTitle}
          </h2>
          <p>{project.approach}</p>
        </article>
      </section>

      <section className="cl-lenders">
        <div className="cl-lenders-head">
          <h2 data-split="lines" data-ripple>
            Five lenders, five versions.
          </h2>
          <p>Every brochure and postcard carried one lender’s name, phone, email and QR code, so a CPA always knew exactly who to call.</p>
          <div className="cl-lender-picker" role="group" aria-label="Choose a lender">
            {LENDERS.map((l) => (
              <button type="button" key={l.id} aria-pressed={l.id === lender.id} onClick={() => setLender(l)}>
                {l.name}
                <small>{l.city}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="cl-lender-stage" ref={lenderStage}>
          <figure className="cl-material" id="cl-brochure" tabIndex={-1}>
            <figcaption className="cl-fig cl-material-label">Brochure</figcaption>
            {flat ? (
              <div className="cl-flat">
                <img src={set.outside.src} alt={set.outside.alt} loading="lazy" />
                <img src={set.inside.src} alt={set.inside.alt} loading="lazy" />
              </div>
            ) : (
              <Flipbook outside={set.outside.src} inside={set.inside.src} name={lender.name} onEnlarge={() => setViewer({ items: [set.outside, set.inside], start: 0 })} />
            )}
          </figure>
          <figure className="cl-material cl-material--postcard" id="cl-postcard" tabIndex={-1}>
            <figcaption className="cl-fig cl-material-label">Postcard</figcaption>
            {flat ? (
              <div className="cl-flat">
                <img src={set.front.src} alt={set.front.alt} loading="lazy" />
                <img src={set.back.src} alt={set.back.alt} loading="lazy" />
              </div>
            ) : (
              <Postcard front={set.front} back={set.back} name={lender.name} />
            )}
          </figure>
        </div>
      </section>

      <section className="cl-gift" id="cl-gift" tabIndex={-1}>
        <div className="cl-gift-copy">
          <h2 data-split="lines" data-ripple>
            Every CPA got their own.
          </h2>
          <p>A leather cord organizer, embossed with each CPA’s initials. Something useful they’d keep on their desk.</p>
          <label className="cl-gift-field">
            <span>Try your initials</span>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
              maxLength={3}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="cl-gift-preview"
            />
          </label>
        </div>
        <figure className="cl-gift-photo" id="cl-gift-preview">
          <span className="cl-gift-frame">
            <img src={media("cl-organizer-blank.webp")} alt={`Leather cord organizer embossed with the initials ${initials.split("").join(" ") || "(none)"}`} loading="lazy" />
            <span className="cl-monogram" ref={monogram} aria-hidden="true">
              {initials}
            </span>
          </span>
          <figcaption className="cl-fig">Leather cord organizer</figcaption>
        </figure>
      </section>

      <section className="cl-journey">
        <h2 data-split="lines" data-ripple>
          From my desk to the mailroom.
        </h2>
        <figure>
          <img src={media("cl-package-photo.webp")} alt="Finished mailer box, engraved organizer, and brochure on a desk" loading="lazy" />
          <figcaption>Packed and ready</figcaption>
        </figure>
        <figure>
          <img src={media("cl-mailing-day.webp")} alt="Stack of packed mailer boxes on a cart, addresses hidden" loading="lazy" />
          <figcaption>Mailing day</figcaption>
        </figure>
      </section>

      <section className="cl-results" id="cl-results" aria-label="Results">
        {loans && (
          <div className="cl-result-lead">
            <strong data-count>{loans.value}</strong>
            <span data-nowidow>{loans.label}</span>
          </div>
        )}
        <div className="cl-result-side">
          {[cost, lenders].filter(Boolean).map((metric) => (
            <div key={metric.label}>
              <strong data-count>{metric.value}</strong>
              <span data-nowidow>{metric.label}</span>
            </div>
          ))}
        </div>
        <p className="cl-outcome">{project.outcome}</p>
      </section>

      <Link className="next-project" to={`/work/${next.slug}`}>
        <span className="eyebrow">Keep looking</span>
        <strong data-split="words" data-ripple>
          {next.shortTitle}
        </strong>
        <Arrow />
      </Link>

      {viewer && <ImageViewer items={viewer.items} start={viewer.start} onClose={() => setViewer(null)} />}
    </main>
  )
}
