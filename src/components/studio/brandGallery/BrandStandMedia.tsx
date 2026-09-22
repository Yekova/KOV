"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { trackGallery } from "@/lib/studio/galleryAnalytics";

const PANEL = { width: 2.05, height: 1.2 } as const;
/** The mark is set to a height and given whatever width its own
 *  proportions ask for, up to the panel's. A fixed box would squash a
 *  wordmark and balloon a monogram — and a distorted mark is the one
 *  thing a brand will notice before anything else in the room. */
const LOGO_HEIGHT = 0.2;
const LOGO_MAX_WIDTH = 1.7;

// What a stand actually shows on its panel.
//
// Nothing here loads until the visitor is near it. A gallery of a dozen
// stands that each fetched a cover and a film on arrival would spend the
// whole page budget on media nobody has walked up to yet — so the cover
// is fetched at "lit" (eight metres), and the film only at "legible"
// (five), and the film pauses itself the moment they leave.
export function BrandStandMedia({
  brand,
  lit,
  legible,
}: {
  brand: Brand;
  lit: boolean;
  legible: boolean;
}) {
  const [coverTexture, setCoverTexture] = useState<THREE.Texture | null>(null);
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);
  const [logoAspect, setLogoAspect] = useState(3);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  // Cover and logo, from "lit" onward.
  useEffect(() => {
    if (!lit) return;
    const loader = new THREE.TextureLoader();
    let cancelled = false;
    const made: THREE.Texture[] = [];

    const load = (url: string | null, set: (t: THREE.Texture) => void) => {
      if (!url) return;
      loader.load(url, (texture) => {
        if (cancelled) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        made.push(texture);
        set(texture);
      });
    };

    load(brand.coverUrl, setCoverTexture);
    load(brand.logoUrl, (texture) => {
      const source = texture.image as { width?: number; height?: number } | null;
      if (source?.width && source?.height) setLogoAspect(source.width / source.height);
      setLogoTexture(texture);
    });

    return () => {
      cancelled = true;
      made.forEach((texture) => texture.dispose());
      setCoverTexture(null);
      setLogoTexture(null);
    };
  }, [lit, brand.coverUrl, brand.logoUrl]);

  // The film, from "legible" onward, and only then.
  useEffect(() => {
    if (!legible || !brand.videoUrl) return;

    const element = document.createElement("video");
    element.src = brand.videoUrl;
    element.crossOrigin = "anonymous";
    element.loop = true;
    element.muted = true; // a room that starts talking is a room people leave
    element.playsInline = true;
    element.preload = "metadata";
    videoRef.current = element;

    const texture = new THREE.VideoTexture(element);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Published once there is a frame to show. A VideoTexture bound
    // before the first decode is a black plane over the cover that was
    // already there, which looks like a loading bug rather than a film.
    const onReady = () => setVideoTexture(texture);
    element.addEventListener("loadeddata", onReady, { once: true });

    void element
      .play()
      .then(() => trackGallery("brand_video_play", { room_id: "p04", slot_id: brand.slotId, brand_id: brand.id, tier: brand.tier }))
      .catch(() => {
        // Autoplay refused even muted, on some configurations. The cover
        // underneath is still there, which is the right fallback.
      });

    return () => {
      element.removeEventListener("loadeddata", onReady);
      element.pause();
      element.removeAttribute("src");
      element.load();
      texture.dispose();
      videoRef.current = null;
      setVideoTexture(null);
    };
  }, [legible, brand.videoUrl, brand.id, brand.slotId, brand.tier]);

  // The film wins over the cover where both exist and the visitor is close
  // enough to have triggered it.
  const panelMap = videoTexture ?? coverTexture;

  const logoWidth = Math.min(LOGO_MAX_WIDTH, LOGO_HEIGHT * logoAspect);
  const logoHeight = logoWidth / logoAspect;

  const panelMaterial = useMemo(() => {
    if (panelMap) {
      return <meshBasicMaterial map={panelMap} toneMapped={false} />;
    }
    // No asset: a dark plate rather than a white rectangle or a broken
    // image. An unlet position should read as unlet, not as an error.
    return <meshStandardMaterial color="#141417" roughness={0.95} metalness={0.05} />;
  }, [panelMap]);

  return (
    <group>
      <mesh position={[0, 1.95, -0.35]}>
        <planeGeometry args={[PANEL.width, PANEL.height]} />
        {panelMaterial}
      </mesh>

      {/* The mark, under the panel, lit from the plinth. Only once the
          visitor is close enough for it to be worth reading. */}
      {logoTexture && lit && (
        <mesh position={[0, 1.04, -0.34]}>
          <planeGeometry args={[logoWidth, logoHeight]} />
          <meshBasicMaterial map={logoTexture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
