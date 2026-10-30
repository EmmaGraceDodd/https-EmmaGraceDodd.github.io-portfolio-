import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Arrow } from "./Media"
import { landCard } from "./cardFlip"
import { ImageViewer } from "./ImageViewer"
import { refreshOnImageLoad, useMagnetic } from "./interactions"
import { SiteNav } from "./SiteNav"
import { useTextMotion } from "./motion"
import { media, type Project } from "./projectData"

gsap.registerPlugin(ScrollTrigger)

/* Treasury Management case study.
   A receipt prints out of the printer as you scroll, then each piece of the
   campaign comes out of its folder.
   Numbers: Meta + LinkedIn reporting, Jul 9 – Oct 22, 2026. */

const results = [
  ["Times our ads were seen", "1.58M"],
  ["Visits to the sign-up page", "6,100+"],
  ["LinkedIn ad click rate", "2.36%"],
]

type Folder = {
  id: string
  label: string
  title: string
  line: string
  pieces: { src: string; alt: string }[]
}

const folders: Folder[] = [
  {
    id: "mail",
    label: "Direct mailer",
    title: "A tooth-shaped mailer",
    line: "Sent to dental offices: “Let’s get to the root of your banking fees.”",
    pieces: [{ src: "tm-tooth.webp", alt: "Front and back of the tooth-shaped mailer" }],
  },
  {
    id: "social",
    label: "Social",
    title: "Is your money leaking?",
    line: "Ads on Facebook, Instagram and LinkedIn.",
    pieces: [
      { src: "tm-social.webp", alt: "Collection of social ads with leaking piggy banks" },
      { src: "tm-social-alt.webp", alt: "Four more social ads from the campaign" },
    ],
  },
  {
    id: "print",
    label: "Print ads",
    title: "Fees hiding below the surface",
    line: "Ads in the Gainesville Sun and The Independent Florida Alligator.",
    pieces: [
      { src: "tm-sun-print.webp", alt: "Gainesville Sun newspaper ad with a leaking piggy bank" },
      { src: "tm-gator-print.webp", alt: "Independent Florida Alligator ad with an alligator above the waterline" },
    ],
  },
  {
    id: "web",
    label: "Landing pages",
    title: "The sign-up page",
    line: "Where every ad and mailer sent people to book a free fee review.",
    pieces: [
      { src: "tm-landing.webp", alt: "The fee review sign-up page on a laptop and phone" },
      { src: "tm-gator-landing.webp", alt: "The alligator version of the sign-up page" },
    ],
  },
]


export default function TreasuryPage({ project, next }: { project: Project; next: Project }) {
  const root = useRef<HTMLElement>(null)
  const [viewer, setViewer] = useState<{ items: { src: string; alt: string }[]; start: number } | null>(null)
  const openImage = (folder: Folder, start: number) => setViewer({ items: folder.pieces.map((piece) => ({ ...piece, src: media(piece.src) })), start })

  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia()
      const rig = self.selector?.(".tm-rig")[0] as HTMLElement | undefined

      const printTimeline = (pin: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".tm-hero",
            start: pin ? "top top" : "top 70%",
            // long enough to watch it print line by line, short enough not to drag
            end: pin ? "+=150%" : "bottom top",
            // a longer catch-up makes the feed glide instead of jumping with each wheel tick
            scrub: 1.2,
            pin,
            anticipatePin: 1,
            onUpdate: (st) => {
              if (!rig) return
              rig.classList.toggle("is-printing", st.progress > 0.015 && st.progress < 0.86)
              rig.classList.toggle("is-done", st.progress >= 0.86)
            },
          },
        })
        // The paper feeds out in one smooth run, swaying a little as it
        // comes free of the rollers...
        tl.fromTo(".tm-receipt", { yPercent: 100 }, { yPercent: 0, ease: "none", duration: 1 })
          .fromTo(
            ".tm-receipt",
            { rotation: 0 },
            { keyframes: { rotation: [0, -0.8, 0.6, -0.5, 0.3, 0] }, ease: "none", duration: 1 },
            0,
          )
          // ...then it tears off, hops up and settles at an angle.
          .to(".tm-receipt", { y: -14, x: -8, rotation: -2.5, ease: "back.out(2.5)", duration: 0.2 })

        // Ink appears only as each line passes the print head, so the bank's
        // name prints first and the rest follows, top to bottom. A line a
        // fraction f down the paper reaches the slot at time f of the feed.
        const receipt = rig?.querySelector<HTMLElement>(".tm-receipt")
        if (receipt) {
          Array.from(receipt.children as HTMLCollectionOf<HTMLElement>).forEach((line) => {
            const f = (line.offsetTop + line.offsetHeight) / receipt.offsetHeight
            tl.fromTo(line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, Math.max(0, f - 0.05))
          })
        }
        return tl
      }

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        printTimeline(true)
      })
      mm.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        printTimeline(false)
      })

      // Each folder opens like a real one: the front pocket tips toward you,
      // the back leans away, and the work slides up out of the pocket. The
      // pieces start fully tucked inside, hidden behind the front.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".tm-folder").forEach((folder) => {
          const pieces = gsap.utils.toArray<HTMLElement>(".tm-piece", folder)
          const front = folder.querySelector<HTMLElement>(".tm-folder-front")!
          const back = folder.querySelector<HTMLElement>(".tm-folder-back")!
          const stack = folder.querySelector<HTMLElement>(".tm-pieces")!
          const copy = folder.querySelector(".tm-folder-copy")
          gsap.set([back, front], { xPercent: -50, x: 0 })

          gsap.from(copy, {
            y: 40,
            autoAlpha: 0,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: folder, start: "top 78%" },
          })
          // the folder slides onto the desk
          gsap.from([back, front], {
            y: 90,
            rotation: -3,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: folder, start: "top 85%" },
          })

          // how far down a piece must sit so its top edge hides behind the front pocket
          const tucked = (piece: HTMLElement) => front.offsetTop + 14 - (stack.offsetTop - piece.offsetHeight)

          const tl = gsap.timeline({
            scrollTrigger: { trigger: folder, start: "top 72%", end: "bottom 80%", scrub: 1, invalidateOnRefresh: true },
          })
          tl.fromTo(front, { rotationX: 0 }, { rotationX: -24, transformOrigin: "50% 100%", ease: "power2.out", duration: 0.5 }, 0)
            .fromTo(back, { rotationX: 0 }, { rotationX: 9, transformOrigin: "50% 100%", ease: "power2.out", duration: 0.5 }, 0)
          pieces.forEach((piece, i) => {
            tl.fromTo(
              piece,
              { x: 0, y: () => tucked(piece), yPercent: 0, rotation: 0, scale: 0.96 },
              { x: 0, y: 0, yPercent: i === 0 ? -30 : -38, rotation: i === 0 ? -2.5 : 3.5, scale: 1, ease: "power3.out", duration: 0.75 },
              0.12 + i * 0.2,
            )
          })
        })
      })

      // Mouse only: each piece tilts toward the cursor like a card you're holding.
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const offs = gsap.utils.toArray<HTMLElement>(".tm-piece").map((piece) => {
          const img = piece.querySelector("img")!
          gsap.set(img, { transformPerspective: 900 })
          const rx = gsap.quickTo(img, "rotationX", { duration: 0.5, ease: "power3.out" })
          const ry = gsap.quickTo(img, "rotationY", { duration: 0.5, ease: "power3.out" })
          const lift = gsap.quickTo(img, "y", { duration: 0.5, ease: "power3.out" })
          const move = (e: PointerEvent) => {
            const r = piece.getBoundingClientRect()
            ry(((e.clientX - r.left) / r.width - 0.5) * 12)
            rx(((e.clientY - r.top) / r.height - 0.5) * -10)
            lift(-10)
          }
          const leave = () => {
            rx(0)
            ry(0)
            lift(0)
          }
          piece.addEventListener("pointermove", move)
          piece.addEventListener("pointerleave", leave)
          return () => {
            piece.removeEventListener("pointermove", move)
            piece.removeEventListener("pointerleave", leave)
          }
        })
        return () => offs.forEach((off) => off())
      })
    }, root)

    const offImages = root.current ? refreshOnImageLoad(root.current, () => ScrollTrigger.refresh()) : undefined
    return () => {
      offImages?.()
      ctx.revert()
    }
  }, [])

  useTextMotion(root)
  useMagnetic(root)
  // no matching hero image here, so a clicked card's cover fills the screen and fades
  useLayoutEffect(() => landCard(null), [])

  return (
    <main className="case-page tm-page" ref={root}>
      <SiteNav variant="project" />

      <section className="tm-hero">
        <div className="tm-hero-text">
          <p className="eyebrow">
            Project {project.number} · {project.year}
          </p>
          <h1 data-split="lines" data-split-now data-ripple>
            Treasury Management
            <span>Campaign</span>
          </h1>
          <p className="tm-lede" data-split="lines" data-split-now>
            I proposed this campaign because our treasury fees were lower than the competition’s. My job was
            getting business owners to care about their banking fees.
          </p>
        </div>

        <div className="tm-rig">
          <div className="tm-feed">
            <article
              className="tm-receipt"
              aria-label="Campaign summary, printed as a receipt"
              style={{ "--paper-texture": `url(${media("prop-paper-texture.webp")})` } as CSSProperties}
            >
              <p className="tm-r-store">Florida Capital Bank</p>
              <div className="tm-r-rule" aria-hidden="true" />

              <p className="tm-r-head">The problem</p>
              <p className="tm-r-body">
                Most business owners never look closely at their bank fees, so they don’t know if they’re
                overpaying.
              </p>

              <p className="tm-r-head">The solution</p>
              <p className="tm-r-body">
                A free business fee review that compares what businesses pay now to what they could save with us.
              </p>

              <p className="tm-r-head">The results</p>
              <dl className="tm-r-results">
                {results.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="tm-r-rule" aria-hidden="true" />
              <p className="tm-r-total">
                <span>Total</span>
                <strong>Fees worth a second look</strong>
              </p>
              <div className="tm-r-barcode" aria-hidden="true" />
            </article>
          </div>

          <img className="tm-printer-img" src={media("prop-printer.webp")} alt="" aria-hidden="true" />
          <span className="tm-slot-glow" aria-hidden="true" />
          <span className="tm-light" aria-hidden="true" />
        </div>
      </section>

      <section className="tm-work" aria-label="The campaign pieces">
        {folders.map((folder) => (
          <article className={`tm-folder tm-folder--${folder.id}`} key={folder.id}>
            <div className="tm-folder-copy">
              <span className="tm-folder-label">{folder.label}</span>
              <h2 data-split="lines" data-ripple>{folder.title}</h2>
              <p>{folder.line}</p>
            </div>

            <div className="tm-folder-stage">
              <div className="tm-folder-back" aria-hidden="true">
                <span className="tm-folder-tabshape" />
                <span className="tm-folder-inside" />
              </div>
              <div className="tm-pieces">
                {folder.pieces.map((piece, index) => (
                  <button type="button" className="tm-piece" onClick={() => openImage(folder, index)} aria-label={`Enlarge: ${piece.alt}`} key={piece.src}>
                    <img src={media(piece.src)} alt={piece.alt} />
                  </button>
                ))}
              </div>
              <div className="tm-folder-front" aria-hidden="true">
                <span className="tm-folder-tab">{folder.label}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Link className="next-project" to={`/work/${next.slug}`}>
        <span className="eyebrow">Keep looking</span>
        <strong data-split="words" data-ripple>{next.shortTitle}</strong>
        <Arrow />
      </Link>
      {viewer && <ImageViewer items={viewer.items} start={viewer.start} onClose={() => setViewer(null)} />}
    </main>
  )
}
