"use client";

import { useEffect, useRef } from "react";

export function MicksMissionCar({ src, animate = true }: { src: string; animate?: boolean }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!animate) return;

    const image = imageRef.current;
    const section = image?.closest("section");
    if (!image || !section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;

    const update = () => {
      frame = null;
      if (reducedMotion.matches) {
        image.style.removeProperty("translate");
        return;
      }

      const travel = Math.min(232.2, window.innerWidth * 0.216);
      const progress = Math.max(0, Math.min(1, section.getBoundingClientRect().top / window.innerHeight));
      image.style.translate = `${progress * travel}px`;
    };

    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
      image.style.removeProperty("translate");
    };
  }, [animate]);

  return <img ref={imageRef} src={src} alt="Vehicle" />;
}
