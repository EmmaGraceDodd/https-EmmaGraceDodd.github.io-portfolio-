import { useLayoutEffect, useRef } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Arrow, Media } from "./Media"
import { useMagnetic } from "./interactions"
import { useTextMotion } from "./motion"
import { media, type Project } from "./projectData"
import { SiteNav } from "./SiteNav"
import "./roundbird.css"

gsap.registerPlugin(ScrollTrigger)

function FramedPhoto({ src, alt, trimBorder = false }: { src: string; alt: string; trimBorder?: boolean }) {
  return <div className={`rb-glass-frame${trimBorder ? " rb-glass-frame--trim" : ""}`}>
    <div className="rb-frame-window"><img src={media(src)} alt={alt} loading="lazy" /></div>
  </div>
}

export default function RoundbirdPage({ project, next }: { project: Project; next: Project }) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const page = root.current
      if (!page) return
      const context = gsap.context(() => {
        const title = page.querySelector<HTMLElement>("#rb-title")
        const focus = page.querySelector<HTMLElement>(".rb-letter-focus")
        const letters = Array.from(page.querySelectorAll<HTMLElement>(".rb-letter"))
        if (title && focus && letters.length) {
          let active = -1
          const followLetter = (progress: number, immediate = false) => {
            const index = Math.min(letters.length - 1, Math.floor(progress * letters.length))
            if (index === active && !immediate) return
            active = index
            const rect = letters[index].getBoundingClientRect()
            const bounds = title.getBoundingClientRect()
            gsap.to(focus, { x: rect.left - bounds.left - 4, y: rect.top - bounds.top - 2,
              width: rect.width + 8, height: rect.height + 4, autoAlpha: 1,
              duration: immediate ? 0 : 0.22, ease: "power2.out", overwrite: true })
          }
          ScrollTrigger.create({ trigger: page, start: "top top",
            end: () => `+=${window.innerWidth < 600 ? 160 : 260}`,
            onUpdate: (st) => followLetter(st.progress),
            onRefresh: (st) => followLetter(st.progress, true),
          })
        }
        gsap.from(".rb-story-word", { y: 14, rotate: 1.5, duration: 0.6, stagger: 0.025,
          ease: "power2.out", scrollTrigger: { trigger: ".rb-story", start: "top 85%", once: true } })
        const light = gsap.timeline({ scrollTrigger: {
          trigger: page, start: "top top", end: "bottom bottom", scrub: 0.8,
        } })
        light.to(page, { "--rb-sky": "#e0a154", ease: "none", duration: 0.5 })
          .to(page, { "--rb-sky": "#3c3b34", ease: "none", duration: 0.5 })
        // Switch text at the black/white contrast crossover rather than fading
        // it through low-contrast gray while the background gets darker.
        light.eventCallback("onUpdate", () => {
          const t = Math.max(0, (light.progress() - 0.5) * 2)
          const rgb = [224 + (60 - 224) * t, 161 + (59 - 161) * t, 84 + (52 - 84) * t]
          const linear = rgb.map((value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
          const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
          page.style.setProperty("--rb-text", t === 0 ? "#282521" : luminance > 0.179 ? "#000000" : "#ffffff")
        })
        gsap.utils.toArray<HTMLElement>(".rb-reveal", page).forEach((el) => {
          gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true } })
        })
      }, page)
      return () => { context.revert(); page.style.removeProperty("--rb-text") }
    })
    const images = Array.from(root.current?.querySelectorAll("img") ?? [])
    const refresh = () => ScrollTrigger.refresh()
    images.forEach((img) => { if (!img.complete) img.addEventListener("load", refresh, { once: true }) })
    return () => {
      images.forEach((img) => img.removeEventListener("load", refresh))
      mm.revert()
    }
  }, [])

  useTextMotion(root)
  useMagnetic(root)

  return (
    <main className="rb-page" ref={root}>
      <SiteNav variant="project" />
      <p className="rb-header">
        <span>Project {project.number} · {project.year}</span>
      </p>

      <section className="rb-hero" aria-labelledby="rb-title">
        <div className="rb-hero-copy">
          <h1 id="rb-title" aria-label="Roundbird Coffee" data-ripple=".rb-letter">
            {["Roundbird", "Coffee"].map((word) => <span className="rb-title-word" aria-hidden="true" key={word}>
              {Array.from(word).map((letter, index) => <span className="rb-letter" key={index}>{letter}</span>)}
              {word === "Coffee" && <span className="rb-title-dot">.</span>}
            </span>)}
            <span className="rb-letter-focus" aria-hidden="true" />
          </h1>
          <p>{project.summary}</p>
          <p className="rb-note">{project.note}</p>
        </div>
        <img className="rb-hero-art" src={media("rb-social-hero.png")} alt="Two Roundbird social post mockups featuring a coffee meetup and an espresso pour" fetchPriority="high" />
      </section>

      <section className="rb-intro rb-reveal">
        <p>{project.challenge}</p>
        <dl>
          <div><dt>My role</dt><dd>{project.role}</dd></div>
          <div><dt>Where it lived</dt><dd>{project.channels}</dd></div>
        </dl>
      </section>

      <section className="rb-morning" aria-label="Coffee photography and concept">
        <figure className="rb-pour rb-reveal"><FramedPhoto src="rb-cup.webp" alt="Espresso pouring into a Roundbird cup" /></figure>
        <p className="rb-story"><span className="sr-only">{project.approach}</span><span aria-hidden="true">
          {project.approach.split(/\s+/).reduce<string[]>((words, word, index, all) => {
            if (index === all.length - 1) words[words.length - 1] += `\u00a0${word}`
            else words.push(word)
            return words
          }, []).map((word, index) => <span key={index}><span className="rb-story-word">{word}</span>{" "}</span>)}
        </span></p>
      </section>

      <section className="rb-identity" aria-label="Roundbird brand identity">
        <img className="rb-wordmark rb-reveal" src={media("rb-wordmark.png")} alt="Roundbird wordmark" loading="lazy" />
        <ul className="rb-palette" aria-label="Roundbird brand colors">
          {project.palette?.map((color) => <li key={color.hex} style={{ background: color.hex, color: color.dark ? "#fff6e8" : "#282521" }}><span>{color.name}</span><span>{color.hex}</span></li>)}
        </ul>
        <div className="rb-brand-spreads">
          <div className="rb-reveal"><FramedPhoto src="rb-kit-1.webp" alt="Roundbird brand presentation with the bird mark, photography, and colors" /></div>
          <div className="rb-reveal"><FramedPhoto src="rb-kit-2.webp" alt="Roundbird coffee and wine brand presentation" /></div>
        </div>
      </section>

      <section className="rb-afternoon" aria-label="Social video and shop applications">
        <figure className="rb-video rb-reveal">
          <div className="rb-phone">
            <span className="rb-phone-speaker" aria-hidden="true" />
            <Media item={{ src: media("rb-coffee-date.mp4"), poster: media("rb-coffee-date-poster.webp"), video: "controls", alt: "Roundbird coffee social video" }} />
          </div>
        </figure>
        <div className="rb-shop-images">
          <div className="rb-reveal"><FramedPhoto src="rb-shop.webp" alt="Roundbird lettering on a storefront window" /></div>
          <div className="rb-reveal"><FramedPhoto src="rb-hat.webp" alt="Black Roundbird hat with the bird mark" /></div>
        </div>
      </section>

      <section className="rb-evening" aria-label="Roundbird wine glass branding">
        <figure className="rb-reveal"><FramedPhoto src="rb-wine.webp" alt="Wine glasses etched with the Roundbird bird mark" trimBorder /></figure>
      </section>

      <Link className="rb-next" to={`/work/${next.slug}`}><span>Next project</span><strong>{next.shortTitle}</strong><Arrow /></Link>
    </main>
  )
}
