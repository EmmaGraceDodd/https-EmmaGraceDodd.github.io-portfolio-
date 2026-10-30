import { useEffect, useRef } from "react"
import * as THREE from "three"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/* The homepage hero background: soft pink and lilac light that drifts,
   with blurry stars floating through it (based on Emma's star gradients).
   Drawn with three.js in a single shader; GSAP drives every input:
     - the big stars breathe and twinkle, and lean away from the cursor
     - tiny glints sparkle on and off, brighter near the pointer
     - a soft glow follows the pointer (or your finger on a phone)
     - every so often a shooting star crosses the sky
     - as you scroll away, the layers drift up at different speeds (depth)
   It pauses when off screen and holds still for people who turn off motion. */

const fragment = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform float uScroll;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
// five-point star distance (Inigo Quilez)
float sdStar5(vec2 p, float r, float rf){
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// a big soft star that breathes, and leans away from the cursor
float star(vec2 uv, vec2 pos, vec2 mouse, float size, float spin, float blur, float phase){
  vec2 away = pos - mouse;
  pos += normalize(away + 1e-4) * 0.05 * exp(-dot(away, away) * 5.0) * uHover;
  float breathe = 1.0 + 0.06 * sin(uTime * 0.7 + phase);
  vec2 p = rot(spin) * (uv - pos) / (size * breathe);
  float d = sdStar5(p, 0.5, 0.45);
  float twinkle = 0.82 + 0.18 * sin(uTime * 1.1 + phase * 3.0);
  return (1.0 - smoothstep(-blur, blur, d)) * twinkle;
}

// tiny four-point glints scattered on a grid, each on its own twinkle clock
float glints(vec2 p, float scale, float seed, vec2 mouse){
  vec2 g = p * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id + seed);
  if (h < 0.74) return 0.0;
  vec2 off = (vec2(hash(id + seed + 1.3), hash(id + seed + 7.1)) - 0.5) * 0.6;
  vec2 d = f - off;
  float tw = pow(0.5 + 0.5 * sin(uTime * (0.8 + h * 2.2) + h * 40.0), 5.0);
  float core = exp(-dot(d, d) * 700.0);
  float rays = max(0.0, 1.0 - abs(d.x) * 55.0) * max(0.0, 1.0 - abs(d.y) * 7.0)
             + max(0.0, 1.0 - abs(d.y) * 55.0) * max(0.0, 1.0 - abs(d.x) * 7.0);
  vec2 cellPos = (id + 0.5 + off) / scale;
  float near = exp(-dot(cellPos - mouse, cellPos - mouse) * 14.0) * uHover;
  return (core + rays * 0.55) * (tw * 0.9 + near * 1.3);
}

// a shooting star every 11 seconds, on a new path each time
float shooting(vec2 p, float aspect){
  float period = 11.0;
  float k = floor(uTime / period);
  float t = fract(uTime / period) * period;
  if (t > 1.4) return 0.0;
  vec2 start = vec2((0.2 + hash(vec2(k, 1.0)) * 0.6) * aspect, 0.92 - hash(vec2(k, 2.0)) * 0.15);
  vec2 dir = normalize(vec2(-0.85 - hash(vec2(k, 3.0)) * 0.4, -0.42));
  float prog = t / 1.4;
  vec2 head = start + dir * prog * 0.9;
  vec2 tail = head - dir * 0.22;
  vec2 pa = p - tail, ba = head - tail;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float dist = length(pa - ba * h);
  float line = exp(-dist * dist * 90000.0) * h * h;
  float fade = smoothstep(0.0, 0.15, prog) * (1.0 - smoothstep(0.65, 1.0, prog));
  return line * fade;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = uv; p.x *= aspect;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.06;
  vec2 mouseP = vec2(uMouse.x * aspect, uMouse.y);

  // drifting mesh of light (the deepest layer: barely moves on scroll)
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 3.1));
  float n = fbm(p * 1.1 + q * 1.6 + m * 4.0 + vec2(0.0, uScroll * 0.15));

  vec3 pink   = vec3(0.996, 0.855, 0.925);
  vec3 rose   = vec3(0.976, 0.737, 0.871);
  vec3 lilac  = vec3(0.871, 0.812, 0.976);
  vec3 violet = vec3(0.776, 0.690, 0.957);

  vec3 col = mix(pink, lilac, smoothstep(0.25, 0.75, uv.x + (n - 0.5) * 0.6));
  col = mix(col, rose, smoothstep(0.45, 0.85, n) * 0.55);
  col = mix(col, violet, smoothstep(0.55, 0.95, fbm(p * 0.8 - t * 0.6)) * 0.35);

  // soft glow that follows the pointer
  vec2 gd = p - mouseP;
  col += vec3(1.0, 0.93, 0.98) * exp(-dot(gd, gd) * 7.0) * 0.13 * uHover;

  // big stars (the middle layer: they rise as you scroll away)
  vec2 sp = p - vec2(0.0, uScroll * 0.35);
  vec3 starCol = vec3(0.95, 0.62, 0.84);
  vec3 starCol2 = vec3(0.70, 0.58, 0.95);
  float s = 0.0, s2 = 0.0;
  s  += star(sp, vec2(0.12 * aspect + m.x, 0.78 + sin(t * 3.0) * 0.03), mouseP, 0.42, 0.25 + t * 0.6, 0.12, 0.0);
  s2 += star(sp, vec2(0.86 * aspect - m.x, 0.84 + cos(t * 2.4) * 0.03), mouseP, 0.34, -0.4 - t * 0.5, 0.11, 1.7);
  s  += star(sp, vec2(0.72 * aspect + m.x * 1.4, 0.16 + sin(t * 2.0) * 0.04), mouseP, 0.5, 0.9 + t * 0.4, 0.13, 3.1);
  s2 += star(sp, vec2(0.30 * aspect - m.x, 0.12 + cos(t * 2.8) * 0.03), mouseP, 0.22, -1.1 + t * 0.7, 0.09, 4.4);
  col = mix(col, starCol, clamp(s, 0.0, 1.0) * 0.45);
  col = mix(col, starCol2, clamp(s2, 0.0, 1.0) * 0.38);

  // glints (the nearest layers: they rise fastest)
  float g = glints(p - vec2(0.0, uScroll * 0.6) + m * 0.5, 9.0, 0.0, mouseP);
  g += glints(p - vec2(0.0, uScroll * 0.9) + m, 15.0, 4.2, mouseP) * 0.7;
  col = mix(col, vec3(1.0), clamp(g, 0.0, 1.0) * 0.75);

  col = mix(col, vec3(1.0, 0.97, 1.0), clamp(shooting(p, aspect), 0.0, 1.0) * 0.85);

  // a little grain so it doesn't look like a flat gradient
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`

export default function HeroBackdrop() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" })
    } catch {
      return // no WebGL: the CSS gradient underneath stays visible
    }
    // phones get a slightly softer render to save battery
    const small = window.matchMedia("(max-width: 700px)").matches
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.15 : 1.5))
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute("aria-hidden", "true")

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
      uScroll: { value: 0 },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: "void main(){ gl_Position = vec4(position, 1.0); }",
      fragmentShader: fragment,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    const render = () => renderer.render(scene, camera)
    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height, false)
      const ratio = renderer.getPixelRatio()
      uniforms.uRes.value.set(width * ratio, height * ratio)
      render()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (still) {
      return () => {
        ro.disconnect()
        mesh.geometry.dispose()
        material.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    // GSAP smooths every input, so the sky never jumps
    const mouse = uniforms.uMouse.value
    const mouseX = gsap.quickTo(mouse, "x", { duration: 1.4, ease: "power3.out" })
    const mouseY = gsap.quickTo(mouse, "y", { duration: 1.4, ease: "power3.out" })
    const hover = gsap.quickTo(uniforms.uHover, "value", { duration: 0.9, ease: "power2.out" })
    const scroll = gsap.quickTo(uniforms.uScroll, "value", { duration: 0.6, ease: "power2.out" })
    const hero = el.parentElement ?? el

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const inside = e.clientY >= r.top && e.clientY <= r.bottom
      mouseX((e.clientX - r.left) / r.width)
      mouseY(1 - (e.clientY - r.top) / r.height)
      hover(inside ? 1 : 0)
    }
    const onLeave = () => hover(0)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)

    const st = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => scroll(self.progress),
    })

    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(el)

    const tick = (time: number) => {
      if (!visible) return
      uniforms.uTime.value = time
      render()
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      st.kill()
      gsap.killTweensOf([mouse, uniforms.uHover, uniforms.uScroll])
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      io.disconnect()
      ro.disconnect()
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="hero-backdrop" ref={host} />
}
