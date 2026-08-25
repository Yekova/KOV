"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";

interface ParticleImageProps {
  src: string;
}

// Longer-axis particle count — density/perf balance. ~8-12k particles at
// this resolution is well within real-time CPU-position-update budget.
const GRID_MAX_DIM = 150;
const DISPERSE_CYCLE_SECONDS = 16;
const DISPERSE_DISTANCE_PX = 220;
const MOUSE_RADIUS_PX = 140;
const MOUSE_PUSH_PX = 90;

// An image dissolved into particles that swirl apart and reassemble —
// requires real per-pixel sampling + thousands of individually-animated
// points, genuinely complex enough to warrant three.js rather than a
// hand-rolled DOM/CSS approximation (same reasoning as LiquidEther's fluid
// sim: the underlying technique, not the visual polish, is what's hard).
// Positions are computed on the CPU each frame (a lerp + per-particle noise
// + cursor repulsion — straightforward enough to derive and verify by hand,
// unlike a GPU compute-shader simulation) and uploaded to a THREE.Points
// buffer for the actual GPU-accelerated draw call.
//
// An orthographic camera sized to the container's own pixel dimensions
// keeps every coordinate in this file in plain CSS pixels — no
// perspective/FOV trigonometry needed anywhere.
//
// Under prefers-reduced-motion, skips WebGL entirely and renders the plain
// source photo instead — simpler and more robust than spinning up a static
// single-frame WebGL context, and "the actual photo" is arguably more
// content than a frozen particle rendition of it.
export function ParticleImage({ src }: ParticleImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reducedMotion) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion || !inView) return;

    let disposed = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.PointsMaterial | null = null;
    let camera: THREE.OrthographicCamera | null = null;
    let scene: THREE.Scene | null = null;

    const mouse = { x: 999999, y: 999999 };
    function onPointerMove(event: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      mouse.x = event.clientX - rect.left - rect.width / 2;
      mouse.y = rect.height / 2 - (event.clientY - rect.top);
    }
    window.addEventListener("pointermove", onPointerMove);

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      if (disposed) return;

      const rect = container!.getBoundingClientRect();
      const cw = Math.max(rect.width, 1);
      const ch = Math.max(rect.height, 1);
      const containerAspect = cw / ch;
      const imgAspect = img.width / img.height;

      // Center-crop the source to the container's aspect ratio (same idea
      // as CSS object-fit: cover) before sampling, so the particle field
      // fills the frame instead of being letterboxed.
      let sx = 0;
      let sy = 0;
      let sw = img.width;
      let sh = img.height;
      if (imgAspect > containerAspect) {
        sw = img.height * containerAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / containerAspect;
        sy = (img.height - sh) / 2;
      }

      const gridW = containerAspect >= 1 ? GRID_MAX_DIM : Math.round(GRID_MAX_DIM * containerAspect);
      const gridH = containerAspect >= 1 ? Math.round(GRID_MAX_DIM / containerAspect) : GRID_MAX_DIM;

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = gridW;
      sampleCanvas.height = gridH;
      const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, gridW, gridH);
      const { data } = ctx.getImageData(0, 0, gridW, gridH);

      const count = gridW * gridH;
      const targetPositions = new Float32Array(count * 3);
      const scatterOffsets = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const phases = new Float32Array(count);
      const livePositions = new Float32Array(count * 3);

      let p = 0;
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const i = (y * gridW + x) * 4;
          colors[p * 3] = data[i] / 255;
          colors[p * 3 + 1] = data[i + 1] / 255;
          colors[p * 3 + 2] = data[i + 2] / 255;

          const px = (x / (gridW - 1) - 0.5) * cw;
          const py = (0.5 - y / (gridH - 1)) * ch;
          targetPositions[p * 3] = px;
          targetPositions[p * 3 + 1] = py;
          targetPositions[p * 3 + 2] = 0;

          const theta = Math.random() * Math.PI * 2;
          const dist = 0.4 + Math.random() * 0.6;
          scatterOffsets[p * 3] = Math.cos(theta) * dist * DISPERSE_DISTANCE_PX;
          scatterOffsets[p * 3 + 1] = Math.sin(theta) * dist * DISPERSE_DISTANCE_PX;
          scatterOffsets[p * 3 + 2] = (Math.random() - 0.5) * DISPERSE_DISTANCE_PX;

          phases[p] = Math.random() * Math.PI * 2;
          p++;
        }
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(livePositions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      material = new THREE.PointsMaterial({
        size: 2.4 * dpr,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        sizeAttenuation: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      scene = new THREE.Scene();
      scene.add(points);

      camera = new THREE.OrthographicCamera(-cw / 2, cw / 2, ch / 2, -ch / 2, 0.1, 1000);
      camera.position.z = 100;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(cw, ch);
      container!.appendChild(renderer.domElement);

      resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const r = container.getBoundingClientRect();
        renderer.setSize(r.width, r.height);
        camera.left = -r.width / 2;
        camera.right = r.width / 2;
        camera.top = r.height / 2;
        camera.bottom = -r.height / 2;
        camera.updateProjectionMatrix();
      });
      resizeObserver.observe(container!);

      let start: number | null = null;
      function animate(now: number) {
        if (start === null) start = now;
        const t = (now - start) / 1000;

        // 0 = fully reassembled, 1 = fully scattered, breathing between the two.
        const disperse = (Math.sin((t / DISPERSE_CYCLE_SECONDS) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

        for (let idx = 0; idx < count; idx++) {
          const swirl = phases[idx];
          const baseX = targetPositions[idx * 3] + scatterOffsets[idx * 3] * disperse + Math.sin(t * 0.5 + swirl) * 4;
          const baseY =
            targetPositions[idx * 3 + 1] + scatterOffsets[idx * 3 + 1] * disperse + Math.cos(t * 0.45 + swirl) * 4;
          const baseZ = targetPositions[idx * 3 + 2] + scatterOffsets[idx * 3 + 2] * disperse;

          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const d = Math.hypot(dx, dy);
          const push = d < MOUSE_RADIUS_PX ? ((MOUSE_RADIUS_PX - d) / MOUSE_RADIUS_PX) * MOUSE_PUSH_PX : 0;
          const nx = d > 0.001 ? dx / d : 0;
          const ny = d > 0.001 ? dy / d : 0;

          livePositions[idx * 3] = baseX + nx * push;
          livePositions[idx * 3 + 1] = baseY + ny * push;
          livePositions[idx * 3 + 2] = baseZ;
        }
        geometry!.attributes.position.needsUpdate = true;

        renderer!.render(scene!, camera!);
        raf = requestAnimationFrame(animate);
      }
      raf = requestAnimationFrame(animate);
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver?.disconnect();
      geometry?.dispose();
      material?.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      }
    };
  }, [src, inView, reducedMotion]);

  if (reducedMotion) {
    return (
      <div aria-hidden="true" className="absolute inset-0">
        <Image src={src} alt="" fill sizes="100vw" className="object-cover" priority />
      </div>
    );
  }

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />;
}
