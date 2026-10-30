import { useEffect, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { MediaItem } from "./projectData"

gsap.registerPlugin(ScrollTrigger)

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Renders an image or a video. Autoplay videos are muted loops that pause
 *  when off screen and never autoplay for people who prefer reduced motion. */
export function Media({ item, className, eager = false }: { item: MediaItem; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || item.video !== "autoplay") return
    if (reducedMotion()) {
      video.controls = true
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [item.video])

  if (item.video) {
    const auto = item.video === "autoplay"
    return (
      <video
        ref={ref}
        className={className}
        src={item.src}
        poster={item.poster}
        aria-label={item.alt}
        controls={!auto}
        muted={auto}
        loop={auto}
        playsInline
        preload={auto ? "auto" : "metadata"}
      />
    )
  }

  return <img className={className} src={item.src} alt={item.alt} loading={eager ? "eager" : "lazy"} decoding="async" />
}

/** Elements with the .reveal class rise in as they scroll into view. Ones that
 *  arrive together are batched, so a row of cards comes in as a stagger. */
export function useReveal(dep?: unknown) {
  useLayoutEffect(() => {
    const items = gsap.utils.toArray<HTMLElement>(".reveal")
    if (!items.length) return
    const mm = gsap.matchMedia()
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(items, { autoAlpha: 0, y: 48 })
      ScrollTrigger.batch(items, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.12,
            overwrite: true,
            clearProps: "transform",
          }),
      })
    })
    return () => mm.revert()
  }, [dep])
}

export function Arrow({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${diagonal ? "arrow arrow--diagonal" : "arrow"} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
