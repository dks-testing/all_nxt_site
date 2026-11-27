"use client";

import { useEffect } from "react";

/**
 * Raise a Hood registers its complete initializer as a DOMContentLoaded
 * listener. Next.js can hydrate a streamed route after that browser event has
 * already fired, so capture that initializer while loading the script and run
 * it once explicitly.
 */
export function RaiseAHoodWidgetScript({ src }: { src: string }) {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-raiseahood-widget-loader]");
    if (existing) return;

    let cancelled = false;
    let restore = () => {};
    void (async () => {
      const response = await fetch(src, { credentials: "omit" });
      if (!response.ok) throw new Error(`Raise a Hood loader returned ${response.status}`);
      const source = await response.text();
      if (cancelled) return;

      const originalAddEventListener = document.addEventListener;
      const initializers: EventListenerOrEventListenerObject[] = [];
      const interceptedAddEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === "DOMContentLoaded") {
          initializers.push(listener);
          return;
        }
        Reflect.apply(originalAddEventListener, document, [type, listener, options]);
      }) as typeof document.addEventListener;
      restore = () => {
        if (document.addEventListener === interceptedAddEventListener) document.addEventListener = originalAddEventListener;
      };

      document.addEventListener = interceptedAddEventListener;
      const script = document.createElement("script");
      script.dataset.raiseahoodWidgetLoader = "true";
      script.textContent = `${source}\n//# sourceURL=${src}`;
      document.body.appendChild(script);
      restore();

      const event = new Event("DOMContentLoaded");
      for (const initializer of initializers) {
        if (typeof initializer === "function") initializer.call(document, event);
        else initializer.handleEvent(event);
      }
      document.querySelectorAll<HTMLElement>("[data-widget-button-base]").forEach((button) => {
        button.dataset.widgetLoaderBound = "true";
      });
    })().catch((error) => console.error("Unable to initialize the Raise a Hood widget", error));

    return () => {
      cancelled = true;
      restore();
    };
  }, [src]);

  return null;
}
