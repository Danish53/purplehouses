"use client";
import { useEffect, useRef } from "react";

export default function SlickSlider({
  children,
  settings = {},
  className = "",
}) {
  const sliderRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer;
    let attempts = 0;
    const MAX = 50;

    function tryInit() {
      attempts++;
      const $ = window.jQuery;
      if (!$ || !$.fn || !$.fn.slick) {
        if (attempts >= MAX) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      const $el = $(sliderRef.current);
      if ($el.hasClass("slick-initialized")) {
        $el.slick("unslick");
      }
      $el.slick(settings);
    }

    timer = setInterval(tryInit, 100);

    return () => {
      clearInterval(timer);
      const $ = window.jQuery;
      if ($ && $.fn && $.fn.slick && sliderRef.current) {
        const $el = $(sliderRef.current);
        if ($el.hasClass("slick-initialized")) {
          $el.slick("unslick");
        }
      }
    };
  }, [settings]);

  return (
    <div ref={sliderRef} className={className}>
      {children}
    </div>
  );
}
