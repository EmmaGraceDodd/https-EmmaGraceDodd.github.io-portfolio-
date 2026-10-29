import { useLayoutEffect, type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(ScrollTrigger, SplitText)

/* Text animation for the whole site. Mark an element with data-split:
     data-split="chars"  letters rise one by one (big headlines)
     data-split="words"  words rise in a quick stagger
     data-split="lines"  each line wipes up from behind a mask
     data-split="write"  each line of handwriting writes itself in
   Add data-split-now to play on load instead of on scroll.
   Mark numbers with data-count to count up from zero.
   Nothing moves for people who turn off motion. */

export function useTextMotion(scope: RefObject<HTMLElement | null>, dep?: unknown) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // handwriting: each line writes itself in, left to right
        root.querySelectorAll<HTMLElement>('[data-split="write"]').forEach((el) => {
          const split = SplitText.create(el.querySelectorAll("p"), { type: "lines", linesClass: "split-line" })
          gsap.fromTo(
            split.lines,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.55,
              ease: "power1.inOut",
              stagger: 0.16,
              scrollTrigger: { trigger: el, start: "top 75%", once: true },
            },
          )
        })

        root.querySelectorAll<HTMLElement>("[data-split]:not([data-split='write'])").forEach((el) => {
          const type = (el.dataset.split || "lines") as "chars" | "words" | "lines"
          const split = SplitText.create(el, {
            type: type === "lines" ? "lines" : `lines,${type}`,
            mask: "lines",
            linesClass: "split-line",
          })
          const targets = type === "chars" ? split.chars : type === "words" ? split.words : split.lines
          const now = el.hasAttribute("data-split-now")
          gsap.from(targets, {
            yPercent: 115,
            rotate: type === "chars" ? 6 : 0,
            duration: type === "chars" ? 0.9 : 0.8,
            ease: "expo.out",
            stagger: type === "chars" ? 0.028 : type === "words" ? 0.04 : 0.1,
            delay: now ? 0.15 : 0,
            scrollTrigger: now ? undefined : { trigger: el, start: "top 88%", once: true },
          })
        })

        root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
          const raw = el.textContent ?? ""
          const m = raw.match(/[\d.,]+/)
          if (!m) return
          const target = parseFloat(m[0].replace(/,/g, ""))
          const decimals = (m[0].split(".")[1] ?? "").length
          const withCommas = m[0].includes(",")
          const [before, after] = [raw.slice(0, m.index), raw.slice((m.index ?? 0) + m[0].length)]
          const state = { v: 0 }
          const fmt = (v: number) => {
            const n = v.toFixed(decimals)
            return before + (withCommas ? Number(n).toLocaleString("en-US", { minimumFractionDigits: decimals }) : n) + after
          }
          el.textContent = fmt(0)
          gsap.to(state, {
            v: target,
            duration: 1.6,
            ease: "power3.out",
            onUpdate: () => (el.textContent = fmt(state.v)),
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          })
        })
      })
    }, root)
    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [scope, dep])
}
