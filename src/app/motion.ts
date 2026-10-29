import { useLayoutEffect, type RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(ScrollTrigger, SplitText)

/* Text animation for the whole site. Mark an element with data-split:
     data-split="chars"  letters rise one by one (big headlines)
     data-split="words"  words rise in a quick stagger
     data-split="lines"  the text block rises gently without clipping masks
     data-split="write"  handwriting paragraphs appear in sequence
   Add data-split-now to play on load instead of on scroll.
   Mark numbers with data-count to count up from zero.
   Nothing moves for people who turn off motion. */

export function useTextMotion(scope: RefObject<HTMLElement | null>, dep?: unknown) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const originalEndings: Array<[Text, string]> = []
    root.querySelectorAll("p, dd, figcaption, h2, h3").forEach((el) => {
      const node = el.lastChild
      if (node?.nodeType !== 3 || !node.textContent || node.textContent.trim().split(/\s+/).length < 3) return
      originalEndings.push([node as Text, node.textContent])
      node.textContent = node.textContent.replace(/(\S+)\s+(\S+)(\s*)$/, "$1\u00a0$2$3")
    })
    const originalCounts = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"), (el) => [el, el.textContent] as const)
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // handwriting: each line writes itself in, left to right
        root.querySelectorAll<HTMLElement>('[data-split="write"]').forEach((el) => {
          gsap.from(
            el.querySelectorAll("p"),
            {
              autoAlpha: 0,
              y: 12,
              duration: 0.55,
              ease: "power1.inOut",
              stagger: 0.16,
              scrollTrigger: { trigger: el, start: "top 75%", once: true },
            },
          )
        })

        root.querySelectorAll<HTMLElement>("[data-split]:not([data-split='write'])").forEach((el) => {
          const type = (el.dataset.split || "lines") as "chars" | "words" | "lines"
          const now = el.hasAttribute("data-split-now")
          if (type === "lines") {
            // Animate the complete text block so glyphs and responsive lines
            // never pass through a clipping mask.
            gsap.from(el, {
              y: 16, autoAlpha: 0, duration: 0.65, ease: "power2.out",
              scrollTrigger: now ? undefined : { trigger: el, start: "top 88%", once: true },
            })
            return
          }
          const split = SplitText.create(el, {
            type: `lines,${type}`,
            linesClass: "split-line",
          })
          const targets = type === "chars" ? split.chars : split.words
          gsap.from(targets, {
            y: 16,
            autoAlpha: 0,
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
          // Keep the final value readable until the animation actually starts.
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
      originalCounts.forEach(([el, text]) => { el.textContent = text })
      originalEndings.forEach(([node, text]) => { node.textContent = text })
    }
  }, [scope, dep])
}
