import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from "react"
import { Link, useNavigate } from "react-router"
import { launchCard } from "./cardFlip"
import { ContactFooter } from "./Contact"
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { FINE_POINTER, MOTION_OK, useMagnetic, useSmoothAnchors } from "./interactions"
import { Arrow, Media, useReveal } from "./Media"
import { MusicPlayer } from "./MusicPlayer"
import { SiteNav } from "./SiteNav"
import { useTextMotion } from "./motion"
import { media, projects, type Project } from "./projectData"

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger)

// three.js only loads on the homepage, after everything else
const HeroBackdrop = lazy(() => import("./HeroBackdrop"))

// Headline: swap these two lines to try other options.
//   ["My", "Portfolio"]             ← current
//   ["Pretty smart", "ideas."]
//   ["I design", "with purpose"]   ← the original
const HEADLINE = ["My", "Portfolio"]

const RESUME = `${import.meta.env.BASE_URL}Emma-Dodd-Resume.pdf`

const toolbox = [
  { group: "Design", tools: ["InDesign", "Illustrator", "Photoshop", "Figma", "Canva"] },
  { group: "Digital", tools: ["WordPress", "Google Analytics", "Video editing", "AI-assisted workflows"] },
  { group: "Marketing", tools: ["Meta & LinkedIn Ads", "Constant Contact", "CallRail"] },
]

const featured = projects.filter((p) => p.featured)
const moreWork = projects.filter((p) => !p.featured)

/** Plain clicks fly the cover image into the project page (see cardFlip.ts).
 *  Ctrl/cmd-clicks and reduced motion keep the normal link behavior. */
function useCardOpen(slug: string, frameSelector: string, radius: string) {
  const navigate = useNavigate()
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    // Commercial Lending opens on a 3D box that doesn't match its card photo,
    // so it gets the page's own fade-in instead of the cover flying over
    if (slug === "commercial-lending") return
    if (!launchCard(e.currentTarget.querySelector<HTMLElement>(frameSelector), radius)) return
    e.preventDefault()
    navigate(`/work/${slug}`)
  }
}

function ProjectCard({ project }: { project: Project }) {
  const open = useCardOpen(project.slug, ".work-card-media", "28px")
  return (
    <Link
      className={`work-card ${project.className}`}
      to={`/work/${project.slug}`}
      aria-label={`Open ${project.shortTitle} case study`}
      onClick={open}
    >
      <span className="work-card-media">
        <Media item={project.cover} eager />
        <span className="work-card-glare" aria-hidden="true" />
      </span>
      <span className="work-card-chip">{project.number}</span>
      <span className="work-card-panel">
        <span className="work-card-title">
          {project.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
        <span className="work-card-meta">
          <span>{project.year}</span>
          <span className="work-card-open">
            <Arrow diagonal />
          </span>
        </span>
      </span>
      <span className="work-card-cursor" aria-hidden="true">
        View
      </span>
    </Link>
  )
}

function MoreCard({ project }: { project: Project }) {
  const open = useCardOpen(project.slug, ".more-card-image", "16px")
  return (
    <Link className={`more-card reveal ${project.className}`} to={`/work/${project.slug}`} aria-label={`Open ${project.shortTitle}`} onClick={open}>
      <span className="more-card-image">
        <Media item={project.cover} />
      </span>
      <span className="more-card-text">
        <span className="project-number-small">{project.number}</span>
        <strong>{project.shortTitle}</strong>
        <span className="more-card-category">{project.year}</span>
      </span>
      <span className="project-open">
        <Arrow diagonal />
      </span>
    </Link>
  )
}

export function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  useReveal()
  useTextMotion(pageRef)
  useMagnetic(pageRef)
  useSmoothAnchors(pageRef)

  // Runs after useTextMotion, so the headline is already split into letters.
  useLayoutEffect(() => {
    const page = pageRef.current
    const hero = heroRef.current
    if (!page || !hero) return
    const mm = gsap.matchMedia()
    const drags: Draggable[] = []
    const ctx = gsap.context(() => {
      const bubbles = gsap.utils.toArray<HTMLElement>(".bubble", hero)
      // Draggable owns only the outer position. Entrance/float effects belong
      // to the inner label so drag initialization cannot capture scale zero.
      // Throw a bubble and it glides to a stop, leaning into the throw.
      bubbles.forEach((bubble) => {
        const label = bubble.firstElementChild as HTMLElement
        const lean = gsap.quickTo(label, "rotation", { duration: 0.4, ease: "power3.out" })
        gsap.set(bubble, { scale: 1, autoAlpha: 1 })
        drags.push(
          ...Draggable.create(bubble, {
            bounds: hero,
            inertia: true,
            edgeResistance: 0.8,
            zIndexBoost: true,
            onPress() {
              gsap.to(label, { scale: 1.1, duration: 0.25, ease: "back.out(3)", overwrite: "auto" })
            },
            onDrag(this: Draggable) {
              lean(gsap.utils.clamp(-14, 14, this.deltaX * 1.4))
            },
            onThrowUpdate(this: Draggable) {
              lean(gsap.utils.clamp(-14, 14, this.deltaX * 1.4))
            },
            onRelease() {
              gsap.to(label, { scale: 1, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: "auto" })
            },
            onThrowComplete() {
              lean(0)
            },
          }),
        )
      })

      mm.add(MOTION_OK, () => {
        const swing = hero.querySelector(".badge-swing")
        const reaction = hero.querySelector<HTMLElement>(".badge-react")
        if (swing) {
          gsap.fromTo(swing, { yPercent: -60, rotate: 9 }, { yPercent: 0, rotate: 0, duration: 1.6, ease: "elastic.out(1, 0.45)", delay: 0.2 })
          gsap.to(swing, { rotate: 2.2, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 })
        }
        bubbles.forEach((bubble, i) => {
          gsap.fromTo(bubble.firstElementChild, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(2)", delay: 0.6 + i * 0.25 })
          gsap.to(bubble.firstElementChild, {
            y: i % 2 ? 8 : -8,
            duration: 2.4 + i * 0.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          })
        })

        // The ticker runs on GSAP so scrolling can push it: faster, in the
        // direction you scroll, then it eases back to its own pace.
        const ticker = page.querySelector<HTMLElement>(".ticker")
        const track = ticker?.firstElementChild as HTMLElement | null
        if (ticker && track) {
          gsap.set(track, { animation: "none" })
          const loop = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 26, ease: "none", repeat: -1 })
          const skew = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3.out" })
          ScrollTrigger.create({
            trigger: ticker,
            start: "top bottom",
            end: "bottom top",
            onUpdate(self) {
              const v = self.getVelocity()
              const speed = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 400)
              skew(gsap.utils.clamp(-10, 10, v / -250))
              gsap.to(loop, {
                timeScale: self.direction * speed,
                duration: 0.2,
                overwrite: true,
                onComplete: () => {
                  skew(0)
                  gsap.to(loop, { timeScale: self.direction, duration: 1.4, ease: "power2.out" })
                },
              })
            },
          })
        }

        // Project cards wipe open from the bottom like a curtain, the photo
        // settles from a zoom, then the number chip and title panel float up.
        // The photo also drifts gently as you scroll past.
        const cards = gsap.utils.toArray<HTMLElement>(".work-card", page)
        cards.forEach((card) => {
          const frame = card.querySelector(".work-card-media")
          const cover = card.querySelector(".work-card-media > img, .work-card-media > video")
          gsap.set(frame, { clipPath: "inset(100% 0% 0% 0% round 28px)" })
          gsap.set(card.querySelectorAll(".work-card-chip, .work-card-panel"), { autoAlpha: 0, y: 28 })
          if (cover) {
            gsap.set(cover, { scale: 1.3 })
            gsap.fromTo(
              cover,
              { yPercent: -5 },
              { yPercent: 5, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } },
            )
          }
        })
        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            batch.forEach((card, i) => {
              const cover = card.querySelector(".work-card-media > img, .work-card-media > video")
              gsap
                .timeline({ delay: i * 0.18 })
                .to(card.querySelector(".work-card-media"), { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.3, ease: "expo.inOut" })
                .to(cover, { scale: 1.12, duration: 1.8, ease: "expo.out" }, 0.1)
                .to(card.querySelectorAll(".work-card-chip, .work-card-panel"), { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.12 }, 0.75)
            }),
        })

        const holder = reaction?.querySelector<HTMLElement>(".badge-holder")
        const gloss = reaction?.querySelector<HTMLElement>(".badge-gloss")
        if (!reaction || !holder || !gloss) return

        // The swing is a damped spring run on GSAP's ticker, so a swipe of the
        // mouse gives the badge a push and it swings back and settles on its
        // own. The tilt and shine follow the cursor with quickTo.
        gsap.set(holder, { transformPerspective: 800 })
        const tiltX = gsap.quickTo(holder, "rotationX", { duration: 0.6, ease: "power3.out" })
        const tiltY = gsap.quickTo(holder, "rotationY", { duration: 0.6, ease: "power3.out" })
        const shine = gsap.quickTo(gloss, "xPercent", { duration: 0.8, ease: "power3.out" })
        const setAngle = gsap.quickSetter(reaction, "rotation", "deg")
        let angle = 0
        let spin = 0
        let previousX: number | null = null
        let running = false
        const step = (_time: number, deltaMs: number) => {
          const dt = Math.min(deltaMs, 32) / 1000
          spin += (-90 * angle - 5 * spin) * dt
          angle = gsap.utils.clamp(-16, 16, angle + spin * dt)
          setAngle(angle)
          if (Math.abs(angle) < 0.02 && Math.abs(spin) < 0.02) {
            setAngle(0)
            gsap.ticker.remove(step)
            running = false
          }
        }
        const nudge = (amount: number) => {
          spin = gsap.utils.clamp(-120, 120, spin + amount)
          if (!running) {
            gsap.ticker.add(step)
            running = true
          }
        }
        const onEnter = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return
          previousX = event.clientX
          gsap.to(holder, { scale: 1.04, duration: 0.5, ease: "back.out(2)", overwrite: "auto" })
        }
        const onMove = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return
          // measure against the card, which rotates only a little, not the swinging rig
          const rect = holder.getBoundingClientRect()
          const px = gsap.utils.clamp(-0.5, 0.5, (event.clientX - rect.left) / rect.width - 0.5)
          const py = gsap.utils.clamp(-0.5, 0.5, (event.clientY - rect.top) / rect.height - 0.5)
          tiltY(px * 24)
          tiltX(py * -16)
          shine(px * 60)
          if (previousX !== null) nudge((previousX - event.clientX) * 1.6)
          previousX = event.clientX
        }
        const onLeave = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return
          previousX = null
          tiltX(0)
          tiltY(0)
          shine(0)
          gsap.to(holder, { scale: 1, duration: 0.7, ease: "power3.out", overwrite: "auto" })
        }
        // On a phone there's no hover, so a tap flicks the badge instead.
        const onTap = (event: PointerEvent) => {
          if (event.pointerType === "mouse") return
          const rect = reaction.getBoundingClientRect()
          nudge(event.clientX < rect.left + rect.width / 2 ? -70 : 70)
        }
        reaction.addEventListener("pointerenter", onEnter)
        reaction.addEventListener("pointermove", onMove)
        reaction.addEventListener("pointerleave", onLeave)
        reaction.addEventListener("pointerdown", onTap)
        return () => {
          gsap.ticker.remove(step)
          reaction.removeEventListener("pointerenter", onEnter)
          reaction.removeEventListener("pointermove", onMove)
          reaction.removeEventListener("pointerleave", onLeave)
          reaction.removeEventListener("pointerdown", onTap)
          gsap.set([reaction, holder, gloss], { clearProps: "transform" })
        }
      })

      // Mouse only: the card tilts toward the cursor, a soft glare follows it
      // across the photo, the glass panel drifts the other way for depth, and
      // a round "View" cursor trails the pointer.
      mm.add(FINE_POINTER, () => {
        const offs = gsap.utils.toArray<HTMLElement>(".work-card", page).map((card) => {
          const frame = card.querySelector<HTMLElement>(".work-card-media")!
          const panel = card.querySelector<HTMLElement>(".work-card-panel")!
          const disc = card.querySelector<HTMLElement>(".work-card-cursor")!
          const cover = frame.querySelector<HTMLElement>(":scope > img, :scope > video")
          gsap.set(card, { transformPerspective: 1200 })
          gsap.set(disc, { scale: 0, autoAlpha: 0 })
          const opts = { duration: 0.7, ease: "power3.out" }
          const rx = gsap.quickTo(card, "rotationX", opts)
          const ry = gsap.quickTo(card, "rotationY", opts)
          const lift = gsap.quickTo(card, "y", opts)
          const panelX = gsap.quickTo(panel, "x", opts)
          const drift = cover ? gsap.quickTo(cover, "x", { duration: 1, ease: "power3.out" }) : null
          const discX = gsap.quickTo(disc, "x", { duration: 0.5, ease: "power3.out" })
          const discY = gsap.quickTo(disc, "y", { duration: 0.5, ease: "power3.out" })

          const enter = (e: PointerEvent) => {
            const r = card.getBoundingClientRect()
            gsap.set(disc, { x: e.clientX - r.left, y: e.clientY - r.top })
            gsap.to(disc, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(2)", overwrite: "auto" })
            lift(-10)
            if (cover) gsap.to(cover, { scale: 1.18, duration: 1.2, ease: "power3.out", overwrite: "auto" })
          }
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            ry(nx * 7)
            rx(ny * -6)
            panelX(nx * -14)
            drift?.(nx * -18)
            discX(e.clientX - r.left)
            discY(e.clientY - r.top)
            frame.style.setProperty("--gx", `${(nx + 0.5) * 100}%`)
            frame.style.setProperty("--gy", `${(ny + 0.5) * 100}%`)
          }
          const leave = () => {
            rx(0)
            ry(0)
            lift(0)
            panelX(0)
            drift?.(0)
            gsap.to(disc, { scale: 0, autoAlpha: 0, duration: 0.35, ease: "power2.in", overwrite: "auto" })
            if (cover) gsap.to(cover, { scale: 1.12, duration: 1, ease: "power3.out", overwrite: "auto" })
          }
          card.addEventListener("pointerenter", enter)
          card.addEventListener("pointermove", move)
          card.addEventListener("pointerleave", leave)
          return () => {
            card.removeEventListener("pointerenter", enter)
            card.removeEventListener("pointermove", move)
            card.removeEventListener("pointerleave", leave)
          }
        })
        return () => offs.forEach((off) => off())
      })
    }, page)
    return () => { mm.revert(); drags.forEach((drag) => drag.kill()); ctx.revert() }
  }, [])

  useEffect(() => {
    const requested = window.location.hash
    if (requested) {
      requestAnimationFrame(() => document.querySelector(requested)?.scrollIntoView())
    }
  }, [])

  return (
    <main ref={pageRef}>
      <a className="skip-link" href="#work">
        Skip to my work
      </a>
      <SiteNav variant="home" />
      <MusicPlayer />

      <section
        className="hero"
        id="top"
        ref={heroRef}
        style={{ "--hero-bg": `url(${media("bg-stars-pink.webp")})` } as React.CSSProperties}
      >
        <Suspense fallback={null}>
          <HeroBackdrop />
        </Suspense>

        <div className="hero-copy">
          {/* little pink bubbles you can grab and throw */}
          <span className="bubble bubble--one">
            <span>Creative marketing · Advertising · Design</span>
          </span>
          <h1 data-split="chars" data-split-now data-ripple>
            {HEADLINE[0]}
            <span>{HEADLINE[1]}</span>
          </h1>
          <p className="hero-intro" data-split="lines" data-split-now>
            I’m Emma, a creative marketer who loves where good design meets smart strategy. I take ideas from
            the messy first thought all the way to launch.
          </p>
          <a className="scroll-cue" href="#work" data-magnetic="0.35">
            <span>Explore projects</span>
            <Arrow />
          </a>
        </div>

        <div className="badge-rig" aria-label="Emma's work badge: Emma Dodd, Marketing Coordinator">
          <span className="bubble bubble--two">
            <span>Hi, I’m Emma ✦</span>
          </span>
          <div className="badge-swing">
            <div className="badge-react">
            <span className="badge-strap" aria-hidden="true" />
            <div className="badge-holder">
              <img className="badge-holder-img" src={media("prop-badge.webp")} alt="" aria-hidden="true" />
              <div className="badge-card">
                <span className="badge-org" aria-hidden="true" />
                <div className="badge-photo" style={{ backgroundImage: `url(${media("bg-stars-pink.webp")})` }}>
                  <img src={media("emma-headshot.webp")} alt="Emma Dodd smiling" fetchPriority="high" />
                </div>
                <p className="badge-name">Emma Dodd</p>
                <p className="badge-title">Marketing Coordinator</p>
                <span className="badge-barcode" aria-hidden="true" />
              </div>
              <span className="badge-gloss" aria-hidden="true" />
            </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          {[0, 1].map((n) => (
            <span className="ticker-set" key={n}>
              <span>Big ideas</span>
              <i>✦</i>
              <span>Pretty details</span>
              <i>✦</i>
              <span>Smart strategy</span>
              <i>✦</i>
              <span>Pretty layouts</span>
              <i>✦</i>
              <span>Campaign magic</span>
              <i>✦</i>
              <span>Web moments</span>
              <i>✦</i>
              <span>Brand crushes</span>
              <i>✦</i>
              <span>Video, too</span>
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <section className="work-section" id="work">
        <div className="section-heading reveal">
          <h2 data-split="chars" data-ripple>My work</h2>
          <p className="section-count">01—{String(featured.length).padStart(2, "0")}</p>
        </div>

        <div className="projects-grid">
          {featured.map((project) => (
            <ProjectCard project={project} key={project.slug} />
          ))}
        </div>

        <div className="more-work">
          <div className="more-work-heading reveal">
            <h3 data-split="words" data-ripple>
              More things <span>I’ve made</span>
            </h3>
            <p className="section-count">
              {moreWork[0]?.number}—{moreWork[moreWork.length - 1]?.number}
            </p>
          </div>
          <div className="more-work-grid">
            {moreWork.map((project) => (
              <MoreCard project={project} key={project.slug} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="about-section"
        id="about"
        style={{ "--about-bg": `url(${media("bg-stars-purple.webp")})` } as React.CSSProperties}
      >
        <div className="notebook reveal">
          <img className="notebook-img" src={media("prop-notebook-page.webp")} alt="" aria-hidden="true" />
          <div className="notebook-text" data-split="write">
            <p className="nb-hello">Hi, I’m Emma ♡</p>
            <p>
              I’ve loved art and design for as long as I can remember. Advertising is where I get to use that
              to solve real problems.
            </p>
            <p>
              Four years in a Digital Media Academy and a degree in advertising from UNF taught me to pair
              creative ideas with an analytical side: figuring out why something isn’t working, who it’s
              really for, and what will actually connect.
            </p>
            <p>
              I joined Florida Capital Bank as an intern in 2024 and became a Marketing Coordinator after
              graduating in December 2025. Today I take campaigns from the first idea through research, copy,
              design, production, and launch.
            </p>
            <p>Next, I’m looking for a creative role where I can keep growing in advertising, design, and brand work.</p>
          </div>
        </div>

        <div className="about-side">
          <h2 data-split="lines" data-ripple>
            A little
            <span>about me.</span>
          </h2>

          <dl className="about-facts">
            <div>
              <dt>Based in</dt>
              <dd>Jacksonville, FL</dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd>B.S. Communication, Advertising · UNF</dd>
            </div>
            <div>
              <dt>Certified</dt>
              <dd>ABA Marketing Planning</dd>
            </div>
          </dl>

          <p className="eyebrow about-toolbox-label">In my toolbox</p>
          <div className="about-toolbox-groups">
            {toolbox.map(({ group, tools }) => (
              <div className="about-toolbox-group" key={group}>
                <p>{group}</p>
                <ul className="about-toolbox">
                  {tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="about-actions">
            <a className="scroll-cue" href={RESUME} target="_blank" rel="noreferrer" data-magnetic="0.35">
              <span>View my resume</span>
              <Arrow diagonal />
            </a>
            <a className="text-link" href="https://www.linkedin.com/in/emma-dodd/" target="_blank" rel="noreferrer">
              Say hi on LinkedIn
            </a>
          </div>
        </div>
      </section>

      <ContactFooter />
    </main>
  )
}
