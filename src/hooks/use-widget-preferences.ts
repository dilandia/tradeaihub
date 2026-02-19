"use client";

import { useState, useCallback, useEffect } from "react";
import { DEFAULT_WIDGET_ORDER, DEFAULT_HIDDEN, WIDGET_REGISTRY } from "@/lib/widget-registry";

const STORAGE_KEY = "takez-widget-prefs";

export type WidgetPreferences = {
  order: string[];
  hidden: string[];
};

function loadPrefs(): WidgetPreferences {
  if (typeof window === "undefined") return { order: DEFAULT_WIDGET_ORDER, hidden: DEFAULT_HIDDEN };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: DEFAULT_WIDGET_ORDER, hidden: DEFAULT_HIDDEN };
    const parsed = JSON.parse(raw) as WidgetPreferences;

    // Garantir que novos widgets são incluídos (caso adicionemos widgets futuros)
    const allIds = WIDGET_REGISTRY.map((w) => w.id);
    const knownOrder = parsed.order.filter((id) => allIds.includes(id));
    const missing = allIds.filter((id) => !knownOrder.includes(id));
    return {
      order: [...knownOrder, ...missing],
      hidden: parsed.hidden.filter((id) => allIds.includes(id)),
    };
  } catch {
    return { order: DEFAULT_WIDGET_ORDER, hidden: DEFAULT_HIDDEN };
  }
}

function savePrefs(prefs: WidgetPreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota exceeded or SSR
  }
}

export function useWidgetPreferences() {
  const [prefs, setPrefs] = useState<WidgetPreferences>({ order: DEFAULT_WIDGET_ORDER, hidden: DEFAULT_HIDDEN });
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    setPrefs(loadPrefs());
    setLoaded(true);
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setPrefs((prev) => {
      const hidden = prev.hidden.includes(id)
        ? prev.hidden.filter((h) => h !== id)
        : [...prev.hidden, id];
      const next = { ...prev, hidden };
      savePrefs(next);
      return next;
    });
  }, []);

  const reorder = useCallback((newOrder: string[]) => {
    setPrefs((prev) => {
      const next = { ...prev, order: newOrder };
      savePrefs(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = { order: DEFAULT_WIDGET_ORDER, hidden: DEFAULT_HIDDEN };
    setPrefs(defaults);
    savePrefs(defaults);
  }, []);

  const isVisible = useCallback(
    (id: string) => !prefs.hidden.includes(id),
    [prefs.hidden]
  );

  const applyPrefs = useCallback((newPrefs: WidgetPreferences) => {
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  }, []);

  return { prefs, loaded, toggleWidget, reorder, resetToDefaults, isVisible, savePrefs: applyPrefs };
}
