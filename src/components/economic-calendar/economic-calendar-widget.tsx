"use client";

import { useEffect, useRef, memo } from "react";

type Props = {
  /** Modo: "1" = dia, "2" = semana */
  mode?: "1" | "2";
  /** Tema: "light" ou "dark" */
  theme?: "light" | "dark";
};

function EconomicCalendarWidget({ mode = "2", theme = "dark" }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    const existing = el.querySelector('script[data-type="calendar-widget"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src = "https://www.tradays.com/c/js/widgets/calendar/widget.js?v=15";
    script.type = "text/javascript";
    script.async = true;
    script.dataset.type = "calendar-widget";
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "700px",
      mode,
      fw: "react",
      theme: theme === "dark" ? "dark" : "light",
    });

    el.appendChild(script);

    return () => {
      const widget = document.getElementById("economicCalendarWidget");
      if (widget) widget.innerHTML = "";
    };
  }, [mode, theme]);

  return (
    <div
      ref={container}
      className="economic-calendar-widget-wrapper flex w-full flex-col rounded-xl border border-border bg-card overflow-hidden"
    >
      <div
        id="economicCalendarWidget"
        className="h-[700px] w-full shrink-0"
        style={{ minHeight: 700 }}
      />
    </div>
  );
}

export default memo(EconomicCalendarWidget);
