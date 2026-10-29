import { useEffect, useRef } from "react"
import type { MediaItem } from "./projectData"

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

/** Fades elements with the .reveal class in as they scroll into view. */
export function useReveal(dep?: unknown) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        }),
      { threshold: 0.12 },
    )
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
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
