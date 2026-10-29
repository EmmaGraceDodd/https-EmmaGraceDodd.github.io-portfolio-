import { Suspense, lazy, useEffect, useRef } from "react"
import { Link, Navigate, useParams } from "react-router"
import { Arrow, Media, useReveal } from "./Media"
import { useTextMotion } from "./motion"
import { getProject, projects, type GalleryItem } from "./projectData"
// The Treasury page brings in GSAP, so it only loads when someone opens it.
const TreasuryPage = lazy(() => import("./TreasuryPage"))
const RoundbirdPage = lazy(() => import("./RoundbirdPage"))

function GalleryFigure({ item, index }: { item: GalleryItem; index: number }) {
  const pieces = item.group ?? [item]
  const isScroll = item.layout === "scroll"

  return (
    <figure className={`gallery-item gallery-item--${item.layout} reveal`}>
      <div
        className={`${pieces.length > 1 ? `gallery-group gallery-group--${pieces.length}` : "gallery-single"}${item.ratio === "auto" ? " gallery-group--natural" : ""}`}
        style={item.ratio && item.ratio !== "auto" ? ({ "--ratio": item.ratio } as React.CSSProperties) : undefined}
      >
        {pieces.map((piece) =>
          isScroll ? (
            <div className="browser" key={piece.src}>
              <span className="browser-bar" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <div className="browser-window" tabIndex={0} aria-label={`${piece.alt}, scrollable`}>
                <img src={piece.src} alt={piece.alt} loading="lazy" decoding="async" />
              </div>
            </div>
          ) : (
            <div className="gallery-frame" key={piece.src}>
              <Media item={piece} />
            </div>
          ),
        )}
      </div>
      {(item.caption || isScroll) && <figcaption>
        <span>{String(index + 1).padStart(2, "0")}</span>
        {item.caption}
        {isScroll && <em className="scroll-hint">Hover or scroll inside the page</em>}
      </figcaption>}
    </figure>
  )
}

/* Each project gets a fresh page. The text animations rearrange the words on
   the page, so reusing the old page for a new project crashes React. */
export function ProjectPage() {
  const { slug } = useParams()
  return <ProjectView key={slug} />
}

function ProjectView() {
  const { slug } = useParams()
  const project = getProject(slug)
  const pageRef = useRef<HTMLElement>(null)
  useReveal(slug)
  useTextMotion(pageRef, slug)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [slug])

  useEffect(() => {
    if (project) document.title = `${project.shortTitle} · Emma Dodd`
    return () => {
      document.title = "Emma Dodd · Creative Marketing Portfolio"
    }
  }, [project])

  if (!project) return <Navigate to="/" replace />

  const projectIndex = projects.findIndex((item) => item.slug === project.slug)
  const nextProject = projects[(projectIndex + 1) % projects.length]

  if (project.slug === "roundbird-coffee")
    return <Suspense fallback={<main className="rb-page" />}><RoundbirdPage project={project} next={nextProject} /></Suspense>

  if (project.slug === "fee-advantage-review")
    return (
      <Suspense fallback={<main className="case-page tm-page" />}>
        <TreasuryPage project={project} next={nextProject} key={project.slug} />
      </Suspense>
    )

  return (
    <main className={`case-page case-page--${project.slug}`} ref={pageRef}>
      <header className="case-header">
        <Link className="case-back" to={{ pathname: "/", hash: "#work" }}>
          <span>Back to all work</span>
          <span aria-hidden="true">×</span>
        </Link>
      </header>

      <section className="case-hero">
        <p className="eyebrow">
          Project {project.number} · {project.year}
        </p>
        <h1 data-split="lines" data-split-now>
          {project.title.split("\n").map((line, i) => (
            <span key={line} className={i === 1 ? "h1-accent" : undefined}>
              {line}
            </span>
          ))}
        </h1>
        <div className={`case-hero-image case-hero-image--${project.hero.length}`}>
          {project.hero.map((item) => (
            <Media item={item} key={item.src} eager />
          ))}
        </div>
      </section>

      <section className="case-intro">
        <p className="case-summary" data-split="lines">{project.summary}</p>
        <dl className="case-details">
          <div>
            <dt>My role</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>Where it lived</dt>
            <dd>{project.channels}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>
        {project.note && <p className="case-note">{project.note}</p>}
      </section>

      {project.metrics && (
        <section className="metrics-section">
          <div className="metrics-grid">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="reveal">
                <strong data-count>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="case-story">
        <article>
          <p className="story-number">01</p>
          <h2 data-split="lines">{project.challengeTitle}</h2>
          <p>{project.challenge}</p>
        </article>
        <article>
          <p className="story-number">02</p>
          <h2 data-split="lines">{project.approachTitle}</h2>
          <p>{project.approach}</p>
        </article>
      </section>


      {(project.palette || project.marks) && (
        <section className="brand-section">
          {project.marks && (
            <div className="brand-marks">
              {project.marks.map((mark) => (
                <div className="brand-mark reveal" key={mark.src}>
                  <img src={mark.src} alt={mark.alt} loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {project.palette && (
            <ul className="palette" aria-label="Brand colors">
              {project.palette.map((swatch) => (
                <li
                  key={swatch.hex}
                  className={`reveal ${swatch.dark ? "swatch--dark" : ""}`}
                  style={{ background: swatch.hex }}
                >
                  <strong>{swatch.name}</strong>
                  <span>{swatch.hex}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="case-gallery">
        {project.gallery.map((item, index) => (
          <GalleryFigure item={item} index={index} key={item.src + index} />
        ))}
      </section>

      <section className="case-outcome" aria-label="Project outcome">
        <p>{project.outcome}</p>
      </section>

      <Link className="next-project" to={`/work/${nextProject.slug}`}>
        <span className="eyebrow">Keep looking</span>
        <strong data-split="words">{nextProject.shortTitle}</strong>
        <Arrow />
      </Link>
    </main>
  )
}
