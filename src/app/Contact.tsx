import { useRef, useState } from "react"
import gsap from "gsap"
import { media } from "./projectData"

/* The homepage footer: every way to reach Emma, as big easy buttons.
   Email links open the visitor's mail app. Not everyone has one set up, so
   clicking them also copies the address and says so, and there's a plain
   "Copy my email" button. */

const EMAIL = "emmagdodd1@gmail.com"
const PHONE = { label: "904.466.1148", href: "tel:+19044661148" }
const LINKEDIN = "https://www.linkedin.com/in/emma-dodd/"
const RESUME = `${import.meta.env.BASE_URL}Emma-Dodd-Resume.pdf`

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // older browsers / non-secure pages
    const field = document.createElement("textarea")
    field.value = text
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.opacity = "0"
    document.body.appendChild(field)
    field.select()
    const ok = document.execCommand("copy")
    field.remove()
    return ok
  }
}

export function ContactFooter() {
  const toast = useRef<HTMLParagraphElement>(null)
  const [copied, setCopied] = useState(false)

  const say = (text: string) => {
    const el = toast.current
    if (!el) return
    el.textContent = text
    gsap.killTweensOf(el)
    gsap
      .timeline()
      .fromTo(el, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(2)" })
      .to(el, { autoAlpha: 0, y: 10, duration: 0.35, ease: "power1.in" }, "+=2.6")
  }

  const copyEmail = async () => {
    const ok = await copyText(EMAIL)
    if (!ok) return say(`My email is ${EMAIL}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
    say("Email copied ✦ paste it anywhere")
  }

  // the mail app still opens (no preventDefault); this is the backup
  const onEmailLink = () => {
    copyText(EMAIL).then((ok) => say(ok ? "Opening your email app… (address copied too ✦)" : "Opening your email app…"))
  }

  return (
    <footer id="contact">
      <a className="footer-mail" href={`mailto:${EMAIL}`} aria-label={`Email Emma at ${EMAIL}`} data-magnetic="0.45" onClick={onEmailLink}>
        <img src={media("mail-icon.webp")} alt="" />
      </a>
      <p className="eyebrow">Okay, your turn</p>
      <a className="contact-link" href={`mailto:${EMAIL}`} data-split="lines" data-ripple onClick={onEmailLink}>
        Let’s make
        <span>something lovely.</span>
      </a>

      <p className="contact-note">Pick whatever’s easiest for you.</p>
      <div className="contact-actions">
        <a className="contact-action contact-action--main" href={`mailto:${EMAIL}`} onClick={onEmailLink} data-magnetic="0.15">
          <span className="contact-action-label">Email me</span>
          <span className="contact-action-detail">{EMAIL}</span>
        </a>
        <button type="button" className="contact-action" onClick={copyEmail} data-magnetic="0.15">
          <span className="contact-action-label">{copied ? "Copied!" : "Copy my email"}</span>
          <span className="contact-action-detail">For your own mail app</span>
        </button>
        <a className="contact-action" href={LINKEDIN} target="_blank" rel="noreferrer" data-magnetic="0.15">
          <span className="contact-action-label">LinkedIn</span>
          <span className="contact-action-detail">Send me a message</span>
        </a>
        <a className="contact-action" href={PHONE.href} data-magnetic="0.15">
          <span className="contact-action-label">Call or text</span>
          <span className="contact-action-detail">{PHONE.label}</span>
        </a>
        <a className="contact-action" href={RESUME} target="_blank" rel="noreferrer" data-magnetic="0.15">
          <span className="contact-action-label">Resume</span>
          <span className="contact-action-detail">Open the PDF</span>
        </a>
      </div>

      <div className="footer-bottom">
        <span>Emma Dodd · Jacksonville, FL</span>
        <a href="#top">Back to top ↑</a>
      </div>
      <p className="contact-toast" ref={toast} role="status" aria-live="polite" />
    </footer>
  )
}
