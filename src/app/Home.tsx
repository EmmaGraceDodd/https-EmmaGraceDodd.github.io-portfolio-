import { useEffect, useRef } from "react"
import { Link } from "react-router"
import { Arrow, Media, useReveal } from "./Media"
import { media, projects } from "./projectData"

// Headline: swap these two lines to try the other options.
//   ["Pretty smart", "ideas."]      ← current
//   ["Ideas that", "actually work."]
//   ["Big ideas,", "done right."]
//   ["I design", "with purpose"]   ← the original
const HEADLINE = ["Pretty smart", "ideas."]

const RESUME = `${import.meta.env.BASE_URL}Emma-Dodd-Resume.pdf`
const EMAIL = "emmagdodd1@gmail.com"

const toolbox = [
  "InDesign",
  "Illustrator",
  "Photoshop",
  "Figma",
  "Canva",
  "WordPress",
  "Meta & LinkedIn Ads",
  "Constant Contact",
  "CallRail",
  "Google Analytics",
  "Video editing",
  "AI-assisted workflows",
]

export function Home() {
  const heroRef = useRef<HTMLElement>(null)
  useReveal()

  useEffect(() => {
    const requested = window.location.hash
    if (requested) {
      requestAnimationFrame(() => document.querySelector(requested)?.scrollIntoView())
    }
  }, [])

  const moveHero = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    event.currentTarget.style.setProperty("--hero-x", `${x * 2.2}rem`)
    event.currentTarget.style.setProperty("--hero-y", `${y * 1.5}rem`)
  }

  return (
    <main>
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
        onPointerMove={moveHero}
        onPointerLeave={() => {
          heroRef.current?.style.setProperty("--hero-x", "0rem")
          heroRef.current?.style.setProperty("--hero-y", "0rem")
        }}
      >
        <div className="hero-sun" aria-hidden="true">
          <span />
        </div>
        <div className="hero-cutout hero-cutout--one" aria-hidden="true" />
        <div className="hero-cutout hero-cutout--two" aria-hidden="true" />
        <p className="eyebrow hero-eyebrow">Big ideas · Pretty details · Smart strategy</p>
        <h1>
          {HEADLINE[0]}
          <span>{HEADLINE[1]}</span>
        </h1>
        <div className="hero-portrait">
          <span className="portrait-spark portrait-spark--one" aria-hidden="true">
            ✦
          </span>
          <span className="portrait-spark portrait-spark--two" aria-hidden="true">
            ✦
          </span>
          <div className="portrait-frame">
            <span className="portrait-dot portrait-dot--one" aria-hidden="true" />
            <span className="portrait-dot portrait-dot--two" aria-hidden="true" />
            <img src={media("emma-headshot.webp")} alt="Emma Dodd smiling" fetchPriority="high" />
          </div>
          <p className="portrait-note">
            <span>Hi, I’m</span>
            Emma
          </p>
        </div>
        <div className="hero-bottom">
          <div className="hero-intro">
            <p className="eyebrow">Creative marketer · Jacksonville, FL</p>
            <p>
              Give me a problem to figure out and I’m happy. I like taking an idea from the messy first
              thought to something that makes sense and looks good, too.
            </p>
          </div>
          <a className="scroll-cue" href="#work">
            <span>Explore projects</span>
            <Arrow />
          </a>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          {[0, 1].map((n) => (
            <span className="ticker-set" key={n}>
              <span>Big ideas</span>
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
          <h2>My work</h2>
          <p className="section-count">01—{String(projects.length).padStart(2, "0")}</p>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              className={`project-stack reveal ${project.className}`}
              key={project.slug}
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
                    <span>{project.category}</span>
                    <span>{project.year}</span>
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-heading reveal">
          <p className="eyebrow">About me</p>
          <h2>
            A little
            <span>about me.</span>
          </h2>
          <img
            className="about-sticker"
            src={media("girl-with-ideas.webp")}
            alt="Hand-lettered sticker: I am just a girl with ideas"
            loading="lazy"
          />
        </div>
        <div className="about-body reveal">
          <p className="about-lead">
            I’ve loved art and design since I was little. What I enjoy most is using creativity to solve a
            real problem.
          </p>
          <p>
            After four years in a Digital Media Academy and studying advertising and marketing at the
            University of North Florida, I learned that I like figuring out why something isn’t working,
            understanding the people involved, and finding an idea that makes sense for them. I bring an
            analytical side to that process, along with a strong interest in how the result looks and feels.
          </p>
          <p>
            I joined Florida Capital Bank as an intern in 2024 and became a Marketing Coordinator after
            graduating in December 2025. Today I take campaigns from the first idea through research, copy,
            design, production, and launch, across print, direct mail, social, web, and video.
          </p>
          <p>
            I’m looking for a role where I can keep growing in campaigns and design, with more room to create
            for social media.
          </p>

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
          <ul className="about-toolbox">
            {toolbox.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>

          <div className="about-actions">
            <a className="scroll-cue" href={RESUME} target="_blank" rel="noreferrer">
              <span>View my resume</span>
              <Arrow diagonal />
            </a>
            <a className="text-link" href="https://www.linkedin.com/in/emma-dodd/" target="_blank" rel="noreferrer">
              Say hi on LinkedIn
            </a>
          </div>
        </div>
      </section>

      <footer id="contact">
        <a className="footer-mail" href={`mailto:${EMAIL}`} aria-label="Email Emma">
          <img src={media("mail-icon.webp")} alt="" />
        </a>
        <p className="eyebrow">Okay, your turn</p>
        <a className="contact-link" href={`mailto:${EMAIL}`}>
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
