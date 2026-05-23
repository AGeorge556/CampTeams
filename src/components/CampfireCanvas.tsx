import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function CampfireCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    let W = canvas.offsetWidth || window.innerWidth
    let H = canvas.offsetHeight || window.innerHeight
    renderer.setSize(W, H, false)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100)
    camera.position.z = 10

    // ── Stars ─────────────────────────────────────────────────────────────
    const STARS = isMobile ? 600 : 1200
    const sPos  = new Float32Array(STARS * 3)
    const sCol  = new Float32Array(STARS * 3)
    const sBase = new Float32Array(STARS * 3)
    const sPhase = new Float32Array(STARS)
    const sSpeed = new Float32Array(STARS)

    for (let i = 0; i < STARS; i++) {
      sPos[i * 3]     = (Math.random() - 0.5) * W * 1.15
      sPos[i * 3 + 1] = H * (0.15 + Math.random() * 0.65) - H * 0.25
      sPos[i * 3 + 2] = 0
      const warm = Math.random()
      const r = 0.82 + warm * 0.18
      const g = 0.78 + warm * 0.14
      const b = 0.60 + (1 - warm) * 0.40
      sBase[i*3]=sCol[i*3]=r; sBase[i*3+1]=sCol[i*3+1]=g; sBase[i*3+2]=sCol[i*3+2]=b
      sPhase[i] = Math.random() * Math.PI * 2
      sSpeed[i] = 0.007 + Math.random() * 0.022
    }

    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(sCol, 3))
    const starMat = new THREE.PointsMaterial({
      size: 1.8, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── Embers ────────────────────────────────────────────────────────────
    const EMBERS = isMobile ? 140 : 320
    const ePos  = new Float32Array(EMBERS * 3)
    const eCol  = new Float32Array(EMBERS * 3)
    const eLife = new Float32Array(EMBERS)
    const eVX   = new Float32Array(EMBERS)
    const eVY   = new Float32Array(EMBERS)

    const spawnEmber = (i: number, scatter = false) => {
      ePos[i*3]     = (Math.random() - 0.5) * (scatter ? 140 : 50)
      ePos[i*3+1]   = -H / 2 + 28 + (scatter ? Math.random() * H * 0.28 : 0)
      ePos[i*3+2]   = 0
      eLife[i]      = scatter ? Math.random() : 0
      eVX[i]        = (Math.random() - 0.5) * 0.85
      eVY[i]        = 0.55 + Math.random() * 1.9
    }

    for (let i = 0; i < EMBERS; i++) spawnEmber(i, true)

    const emberGeo = new THREE.BufferGeometry()
    emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3))
    emberGeo.setAttribute('color',    new THREE.BufferAttribute(eCol, 3))
    const emberMat = new THREE.PointsMaterial({
      size: 2.2, vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false,
    })
    scene.add(new THREE.Points(emberGeo, emberMat))

    // ── Campfire glow sprites ─────────────────────────────────────────────
    const makeGlowTex = (size: number, r: number, g: number, b: number, a: number) => {
      const c = document.createElement('canvas')
      c.width = c.height = size
      const ctx = c.getContext('2d')!
      const gr = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      gr.addColorStop(0,    `rgba(${r},${g},${b},${a})`)
      gr.addColorStop(0.30, `rgba(${Math.round(r*.9)},${Math.round(g*.55)},${Math.round(b*.2)},${+(a*.45).toFixed(2)})`)
      gr.addColorStop(0.65, `rgba(${Math.round(r*.6)},${Math.round(g*.25)},5,${+(a*.12).toFixed(2)})`)
      gr.addColorStop(1,    'rgba(0,0,0,0)')
      ctx.fillStyle = gr
      ctx.fillRect(0, 0, size, size)
      return new THREE.CanvasTexture(c)
    }

    const glowY = () => -H / 2 + 52

    const makeSprite = (tex: THREE.Texture, scale: number, yOffset: number) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }))
      s.scale.set(scale, scale, 1)
      s.position.set(0, glowY() + yOffset, -1)
      scene.add(s)
      return s
    }

    const t1 = makeGlowTex(256, 255, 195, 45,  0.95)
    const t2 = makeGlowTex(256, 255, 105, 12,  0.70)
    const t3 = makeGlowTex(256, 175,  50,  5,  0.42)
    const g1 = makeSprite(t1, 135,  10)
    const g2 = makeSprite(t2, 255,   0)
    const g3 = makeSprite(t3, 500, -15)

    // ── Fireflies ─────────────────────────────────────────────────────────
    const FF = isMobile ? 25 : 50
    const fPos  = new Float32Array(FF * 3)
    const fPh   = new Float32Array(FF)
    const fOX   = new Float32Array(FF)
    const fOY   = new Float32Array(FF)
    const fR    = new Float32Array(FF)
    const fSpd  = new Float32Array(FF)

    for (let i = 0; i < FF; i++) {
      fOX[i]  = (Math.random() - 0.5) * W * 0.8
      fOY[i]  = (Math.random() - 0.25) * H * 0.5
      fR[i]   = 12 + Math.random() * 52
      fSpd[i] = (0.004 + Math.random() * 0.009) * (Math.random() < 0.5 ? 1 : -1)
      fPh[i]  = Math.random() * Math.PI * 2
    }

    const ffGeo = new THREE.BufferGeometry()
    ffGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3))
    const ffMat = new THREE.PointsMaterial({
      size: 3.5, color: new THREE.Color(0.5, 1.0, 0.12),
      transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false,
    })
    scene.add(new THREE.Points(ffGeo, ffMat))

    // ── Static render (reduced motion) ────────────────────────────────────
    // Prime ember colors for static frame
    for (let i = 0; i < EMBERS; i++) {
      const l = eLife[i]
      eCol[i*3] = 1; eCol[i*3+1] = l * 0.5; eCol[i*3+2] = 0
    }
    emberGeo.attributes.color.needsUpdate = true
    for (let i = 0; i < FF; i++) {
      fPos[i*3] = fOX[i]; fPos[i*3+1] = fOY[i]; fPos[i*3+2] = 0
    }
    ffGeo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)

    if (prefersReducedMotion) return

    // ── Animation loop ────────────────────────────────────────────────────
    let raf = 0
    let t = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      t += 0.016

      // Star twinkle (per-vertex)
      for (let i = 0; i < STARS; i++) {
        sPhase[i] += sSpeed[i]
        const b = 0.50 + 0.50 * ((Math.sin(sPhase[i]) + 1) / 2)
        sCol[i*3]   = sBase[i*3]   * b
        sCol[i*3+1] = sBase[i*3+1] * b
        sCol[i*3+2] = sBase[i*3+2] * b
      }
      starGeo.attributes.color.needsUpdate = true

      // Ember lifecycle
      for (let i = 0; i < EMBERS; i++) {
        eLife[i] += 0.0045 + Math.random() * 0.003
        if (eLife[i] >= 1) { spawnEmber(i); continue }
        const l = eLife[i]

        ePos[i*3]   += eVX[i] + Math.sin(t * 2.1 + i * 0.7) * 0.13
        ePos[i*3+1] += eVY[i]
        eVY[i] *= 0.9988
        eVX[i] *= 0.9982

        // deep orange → yellow-orange → pale yellow → fade
        let r = 1, g = 0, b = 0
        if      (l < 0.22) { g = (l / 0.22) * 0.55 }
        else if (l < 0.52) { const p = (l - 0.22) / 0.30; g = 0.55 + p * 0.45; b = p * 0.40 }
        else               { const p = (l - 0.52) / 0.48; g = 1; b = 0.40 + p * 0.45; r = 1 - p * 0.12 }

        const fade = l < 0.10 ? l / 0.10 : l > 0.72 ? (1 - l) / 0.28 : 1
        eCol[i*3]   = r * fade
        eCol[i*3+1] = g * fade
        eCol[i*3+2] = b * fade
      }
      emberGeo.attributes.position.needsUpdate = true
      emberGeo.attributes.color.needsUpdate    = true

      // Glow flicker
      const flk = 1 + Math.sin(t * 4.3) * 0.065 + Math.sin(t * 11.7) * 0.028 + Math.sin(t * 2.9) * 0.04
      g1.scale.setScalar(135 * flk)
      g2.scale.setScalar(255 * flk * 0.96)
      ;(g1.material as THREE.SpriteMaterial).opacity = flk * 0.92
      ;(g2.material as THREE.SpriteMaterial).opacity = flk * 0.68

      // Firefly orbits
      for (let i = 0; i < FF; i++) {
        fPh[i] += fSpd[i]
        fPos[i*3]   = fOX[i] + Math.cos(fPh[i]) * fR[i]
        fPos[i*3+1] = fOY[i] + Math.sin(fPh[i] * 1.37) * fR[i] * 0.58
      }
      ffGeo.attributes.position.needsUpdate = true
      ffMat.opacity = 0.42 + 0.32 * Math.sin(t * 1.4) + 0.12 * Math.sin(t * 4.3)

      renderer.render(scene, camera)
    }
    tick()

    // ── Resize ────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      renderer.setSize(W, H, false)
      camera.left = -W/2; camera.right  =  W/2
      camera.top  =  H/2; camera.bottom = -H/2
      camera.updateProjectionMatrix()
      const gy = glowY()
      g1.position.y = gy + 10
      g2.position.y = gy
      g3.position.y = gy - 15
    })
    ro.observe(canvas)

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.dispose()
      starGeo.dispose();  starMat.dispose()
      emberGeo.dispose(); emberMat.dispose()
      ffGeo.dispose();    ffMat.dispose()
      t1.dispose(); t2.dispose(); t3.dispose()
      ;[g1, g2, g3].forEach(s => (s.material as THREE.SpriteMaterial).dispose())
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
