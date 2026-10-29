import { useEffect, useRef, useState } from "react"

type Picture = { src: string; alt: string }

export function ImageViewer({ items, start, onClose }: { items: Picture[]; start: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(start)
  useEffect(() => {
    const el = dialog.current
    el?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = overflow }
  }, [])
  const move = (step: number) => setIndex((value) => (value + step + items.length) % items.length)
  return (
    <dialog ref={dialog} className="image-viewer" aria-label="Campaign image viewer" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); move(1) }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1) }
      }}>
      <div className="image-viewer-toolbar">
        {items.length > 1 && <><button onClick={() => move(-1)} aria-label="Previous image">←</button><span aria-live="polite">{index + 1} / {items.length}</span><button onClick={() => move(1)} aria-label="Next image">→</button></>}
        <button className="image-viewer-close" onClick={onClose} aria-label="Close image viewer" autoFocus>Close ×</button>
      </div>
      <img src={items[index].src} alt={items[index].alt} />
    </dialog>
  )
}
