import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"
import { Arrow, Media, useReveal } from "./Media"
import { MusicPlayer } from "./MusicPlayer"
import { useTextMotion } from "./motion"
import { media, projects, type Project } from "./projectData"

gsap.registerPlugin(Draggable)

// three.js only loads on the homepage, after everything else
const HeroBackdrop = lazy(() => import("./HeroBackdrop"))

// Headline: swap these two lines to try the other options.
//   ["Pretty smart", "ideas."]      ← current
//   ["Ideas that", "actually work."]
//   ["Big ideas,", "done right."]
//   ["I design", "with purpose"]   ← the original
const HEADLINE = ["Pretty smart", "ideas."]

const RESUME = `${import.meta.env.BASE_URL}Emma-Dodd-Resume.pdf`
const EMAIL = "emmagdodd1@gmail.com"

const toolbox = [
  { group: "Design", tools: ["InDesign", "Illustrator", "Photoshop", "Figma", "Canva"] },
  { group: "Digital", tools: ["WordPress", "Google Analytics", "Video editing", "AI-assisted workflows"] },
  { group: "Marketing", tools: ["Meta & LinkedIn Ads", "Constant Contact", "CallRail"] },
]

const featured = projects.filter((p) => p.featured)
const moreWork = projects.filter((p) => !p.featured)

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      className={`project-stack reveal ${project.className}`}
      to={`/work/${project.slug}`}
      aria-label={`Open ${project.shortTitle} case study`}
    >
      <span className="stack-layer stack-layer--back" />
      <span className="stack-layer stack-layer--middle" />
      <span className="project-card">
        <span className="project-image-wrap">
          <Media item={project.cover} eager />
          <span className="project-number">{project.number}</span>
          <span className="project-open">
            <Arrow diagonal />
          </span>
          <span className="project-view">Take a peek</span>
        </span>
        <span className="project-meta">
          <span className="project-title">
            {project.title.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
          <span className="project-info">
            <span>{project.year}</span>
          </span>
        </span>
      </span>
    </Link>
  )
}

export function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const pageRef = useRef<HTMLElement>(null)
  useReveal()
  useTextMotion(pageRef)

  useLayoutEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const mm = gsap.matchMedia()
    const drags: Draggable[] = []
    const ctx = gsap.context(() => {
      const bubbles = gsap.utils.toArray<HTMLElement>(".bubble", hero)
      // Draggable owns only the outer position. Entrance/float effects belong
      // to the inner label so drag initialization cannot capture scale zero.
      bubbles.forEach((bubble) => {
        gsap.set(bubble, { scale: 1, autoAlpha: 1 })
        drags.push(...Draggable.create(bubble, { bounds: hero, inertia: false, zIndexBoost: true }))
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const swing = hero.querySelector(".badge-swing")
        const reaction = hero.querySelector<HTMLElement>(".badge-react")
        if (swing) {
          gsap.fromTo(swing, { yPercent: -60, rotate: 9 }, { yPercent: 0, rotate: 0, duration: 1.6, ease: "elastic.out(1, 0.45)", delay: 0.2 })
          gsap.to(swing, { rotate: 2.2, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 })
        }
        bubbles.forEach((bubble, i) => {
          gsap.fromTo(bubble.firstElementChild, { scale: 0.8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(2)", delay: 0.6 + i * 0.18 })
          gsap.to(bubble.firstElementChild, {
            y: i % 2 ? 10 : -10,
            duration: 2.4 + i * 0.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          })
        })
        if (!reaction) return
        const rotateTo = gsap.quickTo(reaction, "rotation", { duration: 0.3, ease: "power2.out" })
        const shiftTo = gsap.quickTo(reaction, "x", { duration: 0.3, ease: "power2.out" })
        const settle = gsap.to(reaction, { rotation: 0, x: 0, duration: 1.8, ease: "elastic.out(1, 0.35)", paused: true })
        let previousX: number | null = null
        const onMove = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return
          settle.pause()
          const rect = reaction.getBoundingClientRect()
          const velocity = previousX === null ? 0 : event.clientX - previousX
          previousX = event.clientX
          const push = gsap.utils.clamp(-12, 12, ((event.clientX - rect.left) / rect.width - 0.5) * 16 + velocity * 0.2)
          rotateTo(push)
          shiftTo(push * 0.5)
        }
        const onLeave = () => {
          previousX = null
          rotateTo.tween.pause()
          shiftTo.tween.pause()
          settle.invalidate().restart()
        }
        reaction.addEventListener("pointermove", onMove)
        reaction.addEventListener("pointerleave", onLeave)
        return () => {
          reaction.removeEventListener("pointermove", onMove)
          reaction.removeEventListener("pointerleave", onLeave)
        }
      })
    }, hero)
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
      <header className="site-header">
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href={RESUME} target="_blank" rel="noreferrer">
            Resume
          </a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

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
          <h1 data-split="chars" data-split-now>
            {HEADLINE[0]}
            <span>{HEADLINE[1]}</span>
          </h1>
          <p className="hero-intro" data-split="lines" data-split-now>
            I’m Emma, a creative marketer who loves where good design meets smart strategy. I take ideas from
            the messy first thought all the way to launch.
          </p>
          <a className="scroll-cue" href="#work">
            <span>Explore projects</span>
            <Arrow />
          </a>
        </div>

        {/* little pink bubbles you can drag around */}
        <div className="bubbles">
          <span className="bubble bubble--one">
            <span>Creative marketing · Advertising · Design</span>
          </span>
          <span className="bubble bubble--two">
            <span>Hi, I’m Emma ✦</span>
          </span>
          <span className="bubble bubble--three">
            <span>Jacksonville, FL</span>
          </span>
        </div>

        <div className="badge-rig" aria-label="Emma's work badge: Florida Capital Bank, Marketing Coordinator">
          <div className="badge-swing">
            <div className="badge-react">
            <span className="badge-strap" aria-hidden="true" />
            <div className="badge-holder">
              <img className="badge-holder-img" src={media("prop-badge.webp")} alt="" aria-hidden="true" />
              <div className="badge-card">
                <p className="badge-org">Florida Capital Bank</p>
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
          <h2 data-split="chars">My work</h2>
          <p className="section-count">01—{String(featured.length).padStart(2, "0")}</p>
        </div>

        <div className="projects-grid">
          {featured.map((project) => (
            <ProjectCard project={project} key={project.slug} />
          ))}
        </div>

        <div className="more-work">
          <div className="more-work-heading reveal">
            <h3 data-split="words">
              More things <span>I’ve made</span>
            </h3>
            <p className="section-count">
              {moreWork[0]?.number}—{moreWork[moreWork.length - 1]?.number}
            </p>
          </div>
          <div className="more-work-grid">
            {moreWork.map((project) => (
              <Link
                className={`more-card reveal ${project.className}`}
                key={project.slug}
                to={`/work/${project.slug}`}
                aria-label={`Open ${project.shortTitle}`}
              >
                <span className="more-card-image">
                  <Media item={project.cover} />
                </span>
                <span className="more-card-text">
                  <span className="project-number-small">{project.number}</span>
                  <strong>{project.shortTitle}</strong>
                  <span className="more-card-category">
                    {project.year}
                  </span>
                </span>
                <span className="project-open">
                  <Arrow diagonal />
                </span>
              </Link>
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
          <h2 data-split="lines">
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
            <a className="scroll-cue" href={RESUME} target="_blank" rel="noreferrer">
              <span>View my resume</span>
              <Arrow diagonal />
            </a>
            <a className="text-link" href="https://www.linkedin.com/in/emma-dodd/" target="_blank" rel="noreferrer">
              Say hi on LinkedIn
            </a>
          </div>

          <MusicPlayer />
        </div>
      </section>

      <footer id="contact">
        <a className="footer-mail" href={`mailto:${EMAIL}`} aria-label="Email Emma">
          <img src={media("mail-icon.webp")} alt="" />
        </a>
        <p className="eyebrow">Okay, your turn</p>
        <a className="contact-link" href={`mailto:${EMAIL}`} data-split="lines">
          Let’s make
          <span>something lovely.</span>
        </a>
        <div className="footer-bottom">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a href="tel:+19044661148">904.466.1148</a>
          <a href="https://www.linkedin.com/in/emma-dodd/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </footer>
    </main>
  )
}
