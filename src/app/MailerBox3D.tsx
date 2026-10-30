import { useEffect, useImperativeHandle, useRef, type Ref } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import gsap from "gsap"
import { media } from "./projectData"

/* The Commercial Lending mailer, built as a real fold-up box in three.js and
   wrapped in Emma's print artwork (cut from the box's print files).

   Built like the real mailer:
     tray  — a bottom, a single back wall, and double-thick front and side
             walls (the board folds over the top edge)
     lid   — hinged on the back wall's top edge. It carries a front tuck flap
             (with rounded corners) and two side flaps that fold down inside
             the tray walls when it's closed.
   Opening is a pure rotation around the hinge. As the lid rises, the tuck
   flap relaxes outward the way cardboard does; nothing changes shape.

   It only draws a frame when something moves and stops while off screen.
   GSAP drives all motion; the page choreographs what happens around it. */

export type MailerBoxHandle = {
  /** lid opening (and camera easing out), as a timeline the page can sequence */
  openTimeline: () => gsap.core.Timeline
  /** where the box's opening is on screen, for pieces to pop out of */
  mouthPoint: () => { x: number; y: number }
  /** a little lift of the lid, to invite a click */
  peek: (on: boolean) => void
}

/* Inside walls: the skyline repeats across each wall (every other copy
   mirrored, so the seams match) and sits on the bottom edge.
   height = how tall the skyline is, as a share of the wall's height. */
export const SKYLINE = { height: 0.66 }

// sizes, in scene units, proportioned to match the mailer in the photos
const W = 1.4 // width
const D = 1.05 // depth
const H = 0.36 // height
const T = 0.012 // board thickness
const WALL = 2.2 * T // folded (double) walls
const OPEN = -1.97 // about 113°, just past upright like the real one
// closed, a real lid never sits perfectly flat: it rides a hair above the
// tray and lifts a fraction at the front, leaving a thin shadow line
const LID_GAP = 0.0035
const REST = -0.007
const PAPER = "#b2d6f0"

export default function MailerBox3D({
  ref,
  onReady,
  onFail,
}: {
  ref?: Ref<MailerBoxHandle>
  onReady?: () => void
  onFail?: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<MailerBoxHandle | null>(null)

  useImperativeHandle(ref, () => ({
    openTimeline: () => api.current?.openTimeline() ?? gsap.timeline(),
    mouthPoint: () => api.current?.mouthPoint() ?? { x: 0, y: 0 },
    peek: (on) => api.current?.peek(on),
  }))

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
    } catch {
      onFail?.()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // keeps the brand navy and blue true while handling bright highlights softly
    renderer.toneMapping = THREE.NeutralToneMapping
    // real shadows: the walls shade the inside, and the box shades the desk
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.setAttribute("aria-hidden", "true")
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    // a soft "photo studio" light all around, so surfaces get gentle highlights
    // and falloff instead of flat color (computed once, then reused)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const studio = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = studio
    scene.environmentIntensity = 0.28
    pmrem.dispose()
    const camera = new THREE.PerspectiveCamera(27, 4 / 3, 0.1, 50)
    // the canvas has extra room above the box (for the open lid), so aim a bit high
    const look = new THREE.Vector3(0, 0.36, 0)
    camera.position.set(2.45, 2.3, 3.1)
    camera.lookAt(look)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc3, 0.35))
    // the key light: upper left, like the page's lighting, and it casts shadows
    const key = new THREE.DirectionalLight(0xfff6ec, 1.6)
    key.position.set(-2, 4, 3)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -1.4
    key.shadow.camera.right = 1.4
    key.shadow.camera.top = 1.4
    key.shadow.camera.bottom = -1.4
    key.shadow.camera.near = 1
    key.shadow.camera.far = 10
    key.shadow.bias = -0.0005
    key.shadow.normalBias = 0.012
    key.shadow.radius = 5 // soft edges, like diffused studio light
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xdbe9ff, 0.35)
    fill.position.set(3, 1.5, -1)
    scene.add(fill)

    // ---- materials from the print artwork ----
    const loader = new THREE.TextureLoader()
    const disposables: { dispose: () => void }[] = []
    let dirty = true
    const requestRender = () => (dirty = true)
    const tex = (file: string) => {
      const t = loader.load(media(file), requestRender)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      disposables.push(t)
      return t
    }
    const mat = (opts: THREE.MeshStandardMaterialParameters) => {
      const m = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, ...opts })
      disposables.push(m)
      return m
    }

    /* Baked shading for the inside of the box: real boxes get darker where
       the floor meets the walls and toward the corners (light can't reach).
       Painting it into the inside artwork once is free at draw time. */
    const shade = (ctx: CanvasRenderingContext2D, w: number, h: number, kind: "wall" | "floor") => {
      ctx.save()
      ctx.globalCompositeOperation = "multiply"
      const edge = (x0: number, y0: number, x1: number, y1: number, strength: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1)
        g.addColorStop(0, `rgba(30, 45, 80, ${strength})`)
        g.addColorStop(1, "rgba(30, 45, 80, 0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      if (kind === "wall") {
        edge(0, h, 0, h * 0.55, 0.32) // down at the floor
        edge(0, 0, w * 0.08, 0, 0.18) // into the corners
        edge(w, 0, w * 0.92, 0, 0.18)
      } else {
        const m = Math.min(w, h) * 0.16
        edge(0, 0, m, 0, 0.3)
        edge(w, 0, w - m, 0, 0.3)
        edge(0, 0, 0, m, 0.34) // the back, deepest in shadow
        edge(0, h, 0, h - m, 0.26)
      }
      ctx.restore()
    }
    const shadedPaper = (aspect: number, kind: "wall" | "floor") => {
      const canvas = document.createElement("canvas")
      canvas.height = 256
      canvas.width = Math.round(256 * aspect)
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = PAPER
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      shade(ctx, canvas.width, canvas.height, kind)
      const t = new THREE.CanvasTexture(canvas)
      t.colorSpace = THREE.SRGBColorSpace
      disposables.push(t)
      return t
    }

    /* skyline walls are drawn on a canvas so the artwork keeps its
       proportions on any wall size (see SKYLINE above) */
    const skylineWall = (aspect: number) => {
      const canvas = document.createElement("canvas")
      canvas.height = 512
      canvas.width = Math.round(512 * aspect)
      const t = new THREE.CanvasTexture(canvas)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
      disposables.push(t)
      return { canvas, texture: t }
    }
    const backSky = skylineWall(W / H)
    const sideSky = skylineWall(D / H)
    const skyline = loader.load(media("cl-tex-skyline.webp"), (img) => {
      const image = img.image as HTMLImageElement
      for (const { canvas, texture } of [backSky, sideSky]) {
        const ctx = canvas.getContext("2d")!
        ctx.fillStyle = PAPER
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const h = canvas.height * SKYLINE.height
        const w = h * (image.width / image.height)
        // centered, repeating outward, alternate copies mirrored
        const count = Math.ceil(canvas.width / w / 2) * 2 + 1
        const start = canvas.width / 2 - (count * w) / 2
        for (let i = 0; i < count; i++) {
          const x = start + i * w
          ctx.save()
          if (i % 2) {
            ctx.translate(x + w, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(image, 0, canvas.height - h, w, h)
          } else {
            ctx.drawImage(image, x, canvas.height - h, w, h)
          }
          ctx.restore()
        }
        shade(ctx, canvas.width, canvas.height, "wall")
        texture.needsUpdate = true
      }
      requestRender()
    })
    disposables.push(skyline)

    /* ---- material details ----
       paper: a faint, fine grain in the surface, so light catches it unevenly
       like printed board instead of looking like smooth plastic */
    const canvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      draw(canvas.getContext("2d")!)
      const t = new THREE.CanvasTexture(canvas)
      disposables.push(t)
      return t
    }
    const grain = canvasTexture(256, 256, (ctx) => {
      const img = ctx.createImageData(256, 256)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 22
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    })
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping
    grain.repeat.set(6, 6)
    const paperFeel = { bumpMap: grain, bumpScale: 0.6 }

    // worn fold edges: where the board bends, the print rubs a little lighter
    const worn = canvasTexture(256, 64, (ctx) => {
      ctx.fillStyle = "#223373"
      ctx.fillRect(0, 0, 256, 64)
      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = `rgba(170, 186, 230, ${0.05 + Math.random() * 0.14})`
        ctx.fillRect(Math.random() * 256, 20 + Math.random() * 24, 2 + Math.random() * 14, 1 + Math.random() * 2)
      }
      const rub = ctx.createLinearGradient(0, 0, 0, 64)
      rub.addColorStop(0, "rgba(140, 160, 215, 0)")
      rub.addColorStop(0.5, "rgba(140, 160, 215, 0.22)")
      rub.addColorStop(1, "rgba(140, 160, 215, 0)")
      ctx.fillStyle = rub
      ctx.fillRect(0, 0, 256, 64)
    })
    worn.colorSpace = THREE.SRGBColorSpace

    /* satin print: the white logo ink is a touch glossier than the navy board.
       Its roughness comes from the artwork itself: brighter ink = smoother. */
    const lidTopMap = tex("cl-tex-lid-top.webp")
    const satin = new THREE.Texture()
    disposables.push(satin)
    new THREE.ImageLoader().load(media("cl-tex-lid-top.webp"), (image) => {
      const c = document.createElement("canvas")
      c.width = 512
      c.height = Math.round((512 * image.height) / image.width)
      const ctx = c.getContext("2d")!
      ctx.drawImage(image, 0, 0, c.width, c.height)
      const px = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < px.data.length; i += 4) {
        const lum = (px.data[i] * 0.3 + px.data[i + 1] * 0.59 + px.data[i + 2] * 0.11) / 255
        const rough = 255 * (0.86 - 0.5 * Math.max(0, lum - 0.35) / 0.65)
        px.data[i] = px.data[i + 1] = px.data[i + 2] = rough
      }
      ctx.putImageData(px, 0, 0)
      satin.image = c
      satin.needsUpdate = true
      lidTop.roughnessMap = satin
      lidTop.roughness = 1
      lidTop.needsUpdate = true
      requestRender()
    })

    const outside = mat({ map: tex("cl-tex-wall.webp"), ...paperFeel })
    const lidTop = mat({ map: lidTopMap, ...paperFeel })
    const lidInside = mat({ map: tex("cl-tex-lid-inside.webp"), ...paperFeel })
    const paper = mat({ color: PAPER, ...paperFeel })
    const floorInside = mat({ map: shadedPaper((W - 2 * WALL) / (D - WALL - T), "floor"), ...paperFeel })
    const frontInside = mat({ map: shadedPaper(W / H, "wall"), ...paperFeel })
    const backInside = mat({ map: backSky.texture, ...paperFeel })
    const sideInside = mat({ map: sideSky.texture, ...paperFeel })
    const navy = mat({ color: 0x1d2b63, ...paperFeel })
    const fold = mat({ map: worn, roughness: 0.7 }) // the folded-over top edges, a little rubbed
    const qrMat = mat({ map: tex("cl-tex-qr.webp"), roughness: 0.5 })

    /* Every board is a slab with softly rounded edges: real folded cardboard
       is never razor sharp, and that's the first thing that reads as "CG".
       Faces (same order as a box): +x, -x, +y, -y, +z, -z */
    const slab = (w: number, h: number, d: number, faces: THREE.Material[]) => {
      const radius = Math.min(0.011, Math.min(w, h, d) * 0.45)
      const g = new RoundedBoxGeometry(w, h, d, 3, radius)
      disposables.push(g)
      const mesh = new THREE.Mesh(g, faces)
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    /* A flat cardboard panel from a 2D outline, printed differently on each
       side. UVs are normalized to the outline's bounds so artwork maps 0–1. */
    const panel = (shape: THREE.Shape, front: THREE.Material, back: THREE.Material) => {
      const g = new THREE.ShapeGeometry(shape, 12)
      g.computeBoundingBox()
      const bb = g.boundingBox!
      const uv = g.attributes.uv
      const pos = g.attributes.position
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y))
      }
      disposables.push(g)
      const group = new THREE.Group()
      const a = new THREE.Mesh(g, front)
      const b = new THREE.Mesh(g, back)
      ;(a.material as THREE.Material).side = THREE.FrontSide
      b.material = (back as THREE.MeshStandardMaterial).clone()
      ;(b.material as THREE.Material).side = THREE.BackSide
      disposables.push(b.material as THREE.Material)
      for (const m of [a, b]) {
        m.castShadow = true
        m.receiveShadow = true
      }
      group.add(a, b)
      return group
    }

    const box = new THREE.Group()
    scene.add(box)

    // ---- the tray ----
    // the bottom sits inside the walls (no shared faces, so nothing flickers)
    // the inside runs from the back wall (T thick) to the front wall (WALL thick)
    const innerZ = (T - WALL) / 2
    const bottom = slab(W - 2 * WALL, T, D - WALL - T, [navy, navy, floorInside, navy, navy, navy])
    bottom.position.set(0, T / 2, innerZ)
    const front = slab(W, H, WALL, [navy, navy, fold, navy, outside, frontInside])
    front.position.set(0, H / 2, D / 2 - WALL / 2)
    const back = slab(W, H, T, [navy, navy, fold, navy, backInside, outside])
    back.position.set(0, H / 2, -D / 2 + T / 2)
    const sideDepth = D - WALL - T
    const left = slab(WALL, H, sideDepth, [sideInside, outside, fold, navy, navy, navy])
    left.position.set(-W / 2 + WALL / 2, H / 2, innerZ)
    const right = slab(WALL, H, sideDepth, [outside, sideInside, fold, navy, navy, navy])
    right.position.set(W / 2 - WALL / 2, H / 2, innerZ)
    box.add(bottom, front, back, left, right)

    const qrGeo = new THREE.PlaneGeometry(0.2, 0.2)
    disposables.push(qrGeo)
    const qr = new THREE.Mesh(qrGeo, qrMat)
    qr.rotation.set(-Math.PI / 2, 0, 0.12)
    qr.position.set(0.22, T + 0.002, -0.12)
    qr.receiveShadow = true
    box.add(qr)

    // ---- the lid: pivot on the hinge (back top edge) ----
    const lid = new THREE.Group()
    lid.position.set(0, H + LID_GAP, -D / 2)
    lid.rotation.x = REST
    box.add(lid)
    // the lid's edges are folds too, so they get the rubbed look
    const lidPanel = slab(W, T, D, [fold, fold, lidTop, lidInside, fold, fold])
    lidPanel.position.set(0, T / 2, D / 2)
    lid.add(lidPanel)

    // front tuck flap, hinged on the lid's front edge, rounded at its corners
    const flapW = W - 2 * WALL - 0.02
    const flapH = H * 0.62
    const r = 0.07
    const tuck = new THREE.Shape()
    tuck.moveTo(-flapW / 2, 0)
    tuck.lineTo(flapW / 2, 0)
    tuck.lineTo(flapW / 2, -flapH + r)
    tuck.quadraticCurveTo(flapW / 2, -flapH, flapW / 2 - r, -flapH)
    tuck.lineTo(-flapW / 2 + r, -flapH)
    tuck.quadraticCurveTo(-flapW / 2, -flapH, -flapW / 2, -flapH + r)
    tuck.closePath()
    const flapHinge = new THREE.Group()
    flapHinge.position.set(0, 0, D - WALL - 0.004)
    flapHinge.add(panel(tuck, outside, paper)) // printed side faces the front wall
    lid.add(flapHinge)

    // side flaps: trapezoids hanging off the lid's sides, inside the tray walls
    const sideFlap = () => {
      const s = new THREE.Shape()
      const len = D * 0.84
      const drop = H * 0.78
      s.moveTo(0.05, 0)
      s.lineTo(0.05 + len, 0)
      s.lineTo(0.05 + len - drop * 0.55, -drop)
      s.lineTo(0.1, -drop)
      s.closePath()
      return s
    }
    // the printed (navy) side of the board faces outward on both flaps.
    // rotated so shape x → +z (front); a panel's front face then looks at -x
    const leftFlap = panel(sideFlap(), navy, paper)
    leftFlap.rotation.y = -Math.PI / 2
    leftFlap.position.set(-W / 2 + WALL + 0.004, 0, 0)
    const rightFlap = panel(sideFlap(), paper, navy)
    rightFlap.rotation.y = -Math.PI / 2
    rightFlap.position.set(W / 2 - WALL - 0.004, 0, 0)
    lid.add(leftFlap, rightFlap)

    /* Two shadows, like a real shoot: a tight, dark contact shadow where the
       box meets the paper, and a broad, soft one cast away from the key
       light (upper left, so it falls back and to the right). Both are flat
       planes just under the box, so they cost almost nothing to draw. */
    const shadowPlane = (w: number, d: number, stops: [number, number][], x: number, z: number, y: number) => {
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = 128
      const ctx = canvas.getContext("2d")!
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
      stops.forEach(([at, alpha]) => grad.addColorStop(at, `rgba(45,32,24,${alpha})`))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 128, 128)
      const t = new THREE.CanvasTexture(canvas)
      const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
      const g = new THREE.PlaneGeometry(w, d)
      disposables.push(t, m, g)
      const mesh = new THREE.Mesh(g, m)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(x, y, z)
      mesh.renderOrder = -1
      scene.add(mesh)
    }
    shadowPlane(W * 1.14, D * 1.2, [[0, 0.5], [0.72, 0.36], [0.88, 0.1], [1, 0]], 0.015, 0.02, -0.003) // contact
    // the real cast shadow: an invisible "desk" that only shows the box's shadow
    const catcherGeo = new THREE.PlaneGeometry(6, 6)
    const catcherMat = new THREE.ShadowMaterial({ opacity: 0.15, color: 0x2d2018 })
    disposables.push(catcherGeo, catcherMat)
    const catcher = new THREE.Mesh(catcherGeo, catcherMat)
    catcher.rotation.x = -Math.PI / 2
    catcher.position.y = -0.001
    catcher.receiveShadow = true
    scene.add(catcher)

    // ---- drawing only when needed ----
    let visible = true
    const moving = () =>
      gsap.isTweening(lid.rotation) ||
      gsap.isTweening(flapHinge.rotation) ||
      gsap.isTweening(box.rotation) ||
      gsap.isTweening(camera.position) ||
      gsap.isTweening(look)
    const tick = () => {
      if (!visible || !(dirty || moving())) return
      camera.lookAt(look)
      renderer.render(scene, camera)
      dirty = false
    }
    gsap.ticker.add(tick)

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      // keep the whole box in frame on tall, narrow layouts
      camera.zoom = Math.min(1, camera.aspect / 1.2)
      camera.updateProjectionMatrix()
      requestRender()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) requestRender()
    })
    io.observe(el)

    // mouse only: the box turns a touch toward the cursor (listen on the
    // button, since the canvas overhangs it and ignores the mouse)
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches
    const target = el.parentElement ?? el
    const turnY = gsap.quickTo(box.rotation, "y", { duration: 1, ease: "power3.out" })
    const onMove = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect()
      turnY(((e.clientX - rect.left) / rect.width - 0.5) * 0.18)
    }
    const onLeave = () => turnY(0)
    if (fine) {
      target.addEventListener("pointermove", onMove)
      target.addEventListener("pointerleave", onLeave)
    }

    let opened = false
    api.current = {
      openTimeline: () => {
        opened = true
        return (
          gsap
            .timeline({ onReverseComplete: () => (opened = false) })
            // the lid unsticks from the tuck, then swings open on its hinge and settles
            .to(lid.rotation, { x: -0.1, duration: 0.22, ease: "power2.out" })
            .to(lid.rotation, { x: OPEN, duration: 1.05, ease: "back.out(1.25)" })
            // freed from the front wall, the tuck flap falls open a little
            .to(flapHinge.rotation, { x: -0.95, duration: 0.9, ease: "power2.out" }, 0.35)
            // the camera eases back and up so the open lid stays in frame
            .to(camera.position, { x: 2.75, y: 2.6, z: 3.8, duration: 1.3, ease: "power2.inOut" }, 0.1)
            .to(look, { y: 0.4, z: -0.2, duration: 1.3, ease: "power2.inOut" }, 0.1)
        )
      },
      mouthPoint: () => {
        const p = new THREE.Vector3(0, H * 0.9, 0.05)
        box.localToWorld(p)
        p.project(camera)
        const rect = el.getBoundingClientRect()
        return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height }
      },
      peek: (on) => {
        if (opened || !fine) return
        gsap.to(lid.rotation, { x: on ? -0.09 : REST, duration: on ? 0.4 : 0.6, ease: on ? "power2.out" : "elastic.out(1, 0.5)", overwrite: true })
      },
    }

    // first frame once the artwork is in, then let the page show us
    loader.manager.onLoad = () => {
      requestRender()
      tick()
      onReady?.()
    }
    loader.manager.onError = () => onFail?.()

    return () => {
      api.current = null
      gsap.ticker.remove(tick)
      gsap.killTweensOf([lid.rotation, flapHinge.rotation, box.rotation, camera.position, look])
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerleave", onLeave)
      ro.disconnect()
      io.disconnect()
      disposables.forEach((d) => d.dispose())
      studio.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="cl-box-3d" ref={host} />
}
