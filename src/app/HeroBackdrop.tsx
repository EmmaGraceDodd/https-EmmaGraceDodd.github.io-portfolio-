import { useEffect, useRef } from "react"
import * as THREE from "three"

/* The homepage hero background: soft pink and lilac light that drifts,
   with blurry stars floating through it (based on Emma's star gradients).
   Drawn with three.js in a single shader. It follows the cursor a little,
   pauses when off screen, and holds still for people who turn off motion. */

const fragment = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

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

float star(vec2 uv, vec2 pos, float size, float spin, float blur){
  vec2 p = rot(spin) * (uv - pos) / size;
  float d = sdStar5(p, 0.5, 0.45);
  return 1.0 - smoothstep(-blur, blur, d);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv; p.x *= uRes.x / uRes.y;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * 0.06;

  // drifting mesh of light
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 3.1));
  float n = fbm(p * 1.1 + q * 1.6 + m * 4.0);

  vec3 pink   = vec3(0.996, 0.855, 0.925);
  vec3 rose   = vec3(0.976, 0.737, 0.871);
  vec3 lilac  = vec3(0.871, 0.812, 0.976);
  vec3 violet = vec3(0.776, 0.690, 0.957);

  vec3 col = mix(pink, lilac, smoothstep(0.25, 0.75, uv.x + (n - 0.5) * 0.6));
  col = mix(col, rose, smoothstep(0.45, 0.85, n) * 0.55);
  col = mix(col, violet, smoothstep(0.55, 0.95, fbm(p * 0.8 - t * 0.6)) * 0.35);

  // soft stars drifting through
  float aspect = uRes.x / uRes.y;
  vec3 starCol = vec3(0.95, 0.62, 0.84);
  vec3 starCol2 = vec3(0.70, 0.58, 0.95);
  float s = 0.0, s2 = 0.0;
  s  += star(p, vec2(0.12 * aspect + m.x, 0.78 + sin(t * 3.0) * 0.03), 0.42, 0.25 + t * 0.6, 0.12);
  s2 += star(p, vec2(0.86 * aspect - m.x, 0.84 + cos(t * 2.4) * 0.03), 0.34, -0.4 - t * 0.5, 0.11);
  s  += star(p, vec2(0.72 * aspect + m.x * 1.4, 0.16 + sin(t * 2.0) * 0.04), 0.5, 0.9 + t * 0.4, 0.13);
  s2 += star(p, vec2(0.30 * aspect - m.x, 0.12 + cos(t * 2.8) * 0.03), 0.22, -1.1 + t * 0.7, 0.09);
  col = mix(col, starCol, clamp(s, 0.0, 1.0) * 0.45);
  col = mix(col, starCol2, clamp(s2, 0.0, 1.0) * 0.38);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute("aria-hidden", "true")

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: "void main(){ gl_Position = vec4(position, 1.0); }",
      fragmentShader: fragment,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height, false)
      const ratio = renderer.getPixelRatio()
      uniforms.uRes.value.set(width * ratio, height * ratio)
      renderer.render(scene, camera)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const target = new THREE.Vector2(0.5, 0.5)
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(el)

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      if (!visible) return
      uniforms.uTime.value = (now - start) / 1000
      uniforms.uMouse.value.lerp(target, 0.04)
      renderer.render(scene, camera)
    }
    if (!still) frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
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
