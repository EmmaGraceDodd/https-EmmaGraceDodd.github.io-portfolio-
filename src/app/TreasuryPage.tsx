import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Arrow } from "./Media"
import { ImageViewer } from "./ImageViewer"
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
            end: pin ? "+=170%" : "bottom top",
            scrub: 0.5,
            pin,
            anticipatePin: 1,
            onUpdate: (st) => {
              if (!rig) return
              rig.classList.toggle("is-printing", st.progress > 0.015 && st.progress < 0.88)
              rig.classList.toggle("is-done", st.progress >= 0.88)
            },
          },
        })
        // The paper feeds out in small steps, the way a real printer pushes it.
        tl.fromTo(
          ".tm-receipt",
          { yPercent: 100 },
          { yPercent: 0, ease: "steps(26)", duration: 1 },
        )
          // then it tears off and settles
          .to(".tm-receipt", { rotate: -2.5, x: -8, y: -10, ease: "power2.out", duration: 0.18 })
        return tl
      }

      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        printTimeline(true)
      })
      mm.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        printTimeline(false)
      })

      // Each piece climbs out of its folder.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".tm-folder").forEach((folder) => {
          const pieces = gsap.utils.toArray<HTMLElement>(".tm-piece", folder)
          const front = folder.querySelector(".tm-folder-front")
          const back = folder.querySelector(".tm-folder-back")
          const copy = folder.querySelector(".tm-folder-copy")

          gsap.from(copy, {
            y: 40,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: folder, start: "top 78%" },
          })
          gsap.fromTo([back, front], { y: 80, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: folder, start: "top 80%" },
          })

          const tl = gsap.timeline({
            scrollTrigger: { trigger: folder, start: "top 70%", end: "bottom 85%", scrub: 0.8 },
          })
          pieces.forEach((piece, i) => {
            tl.fromTo(
              piece,
              { x: 0, y: 0, yPercent: 30, scale: 0.62, autoAlpha: 0, rotate: 0 },
              { yPercent: -30, scale: 1, autoAlpha: 1, rotate: i === 0 ? -2.5 : 3.5, ease: "power2.out", duration: 0.7 },
              i * 0.22,
            )
          })
          // the front pocket tips toward you as the work comes out
          tl.fromTo(front, { rotateX: 0 }, { rotateX: -22, duration: 0.8, ease: "power1.out" }, 0)
        })
      })
    }, root)

    const imgs = Array.from(root.current?.querySelectorAll("img") ?? [])
    const refresh = () => ScrollTrigger.refresh()
    imgs.forEach((img) => img.complete || img.addEventListener("load", refresh, { once: true }))
    return () => {
      imgs.forEach((img) => img.removeEventListener("load", refresh))
      ctx.revert()
    }
  }, [])

  useTextMotion(root)

  return (
    <main className="case-page tm-page" ref={root}>
      <header className="case-header">
        <Link className="case-back" to={{ pathname: "/", hash: "#work" }}>
          <span>Back to all work</span>
          <span aria-hidden="true">×</span>
        </Link>
      </header>

      <section className="tm-hero">
        <div className="tm-hero-text">
          <p className="eyebrow">
            Project {project.number} · {project.year}
          </p>
          <h1 data-split="lines" data-split-now>
            Treasury Management
            <span>Campaign</span>
          </h1>
          <p className="tm-lede" data-split="lines" data-split-now>
            Florida Capital Bank’s business fees beat the competition. My job was getting business owners
            to care.
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
              <p className="tm-r-sub">Business Fee Review · 2026</p>
              <div className="tm-r-rule" aria-hidden="true" />

              <p className="tm-r-head">The problem</p>
              <p className="tm-r-body">
                Most business owners never look closely at their bank fees, so they don’t know if they’re
                overpaying.
              </p>

              <p className="tm-r-head">The solution</p>
              <p className="tm-r-body">
                A free business fee review that compares what they pay now to what they could save with us.
                To get dental offices to take one, I made tooth-shaped mailers, social ads and newspaper ads.
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
          <span className="tm-light" aria-hidden="true" />
        </div>
      </section>

      <section className="tm-work" aria-label="The campaign pieces">
        {folders.map((folder) => (
          <article className={`tm-folder tm-folder--${folder.id}`} key={folder.id}>
            <div className="tm-folder-copy">
              <span className="tm-folder-label">{folder.label}</span>
              <h2 data-split="lines">{folder.title}</h2>
              <p>{folder.line}</p>
            </div>

            <div className="tm-folder-stage">
              <div className="tm-folder-back" aria-hidden="true">
                <span className="tm-folder-tabshape" />
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
        <strong data-split="words">{next.shortTitle}</strong>
        <Arrow />
      </Link>
      {viewer && <ImageViewer items={viewer.items} start={viewer.start} onClose={() => setViewer(null)} />}
    </main>
  )
}
