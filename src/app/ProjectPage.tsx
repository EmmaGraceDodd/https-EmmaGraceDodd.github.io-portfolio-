import { useEffect } from "react"
import { Link, Navigate, useParams } from "react-router"
import { Arrow, Media, useReveal } from "./Media"
import { getProject, projects, type GalleryItem } from "./projectData"

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
      <figcaption>
        <span>{String(index + 1).padStart(2, "0")}</span>
        {item.caption}
        {isScroll && <em className="scroll-hint">Hover or scroll inside the page</em>}
      </figcaption>
    </figure>
  )
}

export function ProjectPage() {
  const { slug } = useParams()
  const project = getProject(slug)
  useReveal(slug)

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

  return (
    <main className={`case-page case-page--${project.slug}`}>
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
        <h1>
          {project.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <div className="case-hero-meta">
          <p>{project.category}</p>
          <p>{project.role}</p>
        </div>
        <div className={`case-hero-image case-hero-image--${project.hero.length}`}>
          {project.hero.map((item) => (
            <Media item={item} key={item.src} eager />
          ))}
        </div>
      </section>

      <section className="case-intro">
        <p className="eyebrow">The quick version</p>
        <p className="case-summary">{project.summary}</p>
        <dl className="case-details">
          <div>
            <dt>What I did</dt>
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

      <section className="case-story">
        <article>
          <p className="story-number">01</p>
          <p className="eyebrow">The starting point</p>
          <h2>{project.challengeTitle}</h2>
          <p>{project.challenge}</p>
        </article>
        <article>
          <p className="story-number">02</p>
          <p className="eyebrow">What I made</p>
          <h2>{project.approachTitle}</h2>
          <p>{project.approach}</p>
        </article>
      </section>

      {project.metrics && (
        <section className="metrics-section">
          <p className="eyebrow">The numbers</p>
          <div className="metrics-grid">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="reveal">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(project.palette || project.marks) && (
        <section className="brand-section">
          <p className="eyebrow">The brand</p>
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

      <section className="case-outcome">
        <p className="eyebrow">How it turned out</p>
        <p>{project.outcome}</p>
      </section>

      <Link className="next-project" to={`/work/${nextProject.slug}`}>
        <span className="eyebrow">Keep looking</span>
        <strong>{nextProject.shortTitle}</strong>
        <Arrow />
      </Link>
    </main>
  )
}
