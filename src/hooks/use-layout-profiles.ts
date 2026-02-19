"use client";

import { useState, useCallback, useEffect } from "react";
import type { WidgetPreferences } from "./use-widget-preferences";

const STORAGE_KEY = "takez-layout-profiles";

export type LayoutProfile = {
  name: string;
  order: string[];
  hidden: string[];
};

type StoredProfiles = {
  profile1: LayoutProfile | null;
  profile2: LayoutProfile | null;
};

const DEFAULT_STORED: StoredProfiles = {
  profile1: null,
  profile2: null,
};

function loadProfiles(): StoredProfiles {
  if (typeof window === "undefined") return DEFAULT_STORED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORED;
    const parsed = JSON.parse(raw) as StoredProfiles;
    return {
      profile1: parsed.profile1 ?? null,
      profile2: parsed.profile2 ?? null,
    };
  } catch {
    return DEFAULT_STORED;
  }
}

function saveProfiles(profiles: StoredProfiles) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // quota exceeded
  }
}

export function useLayoutProfiles() {
  const [profiles, setProfiles] = useState<StoredProfiles>(DEFAULT_STORED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfiles(loadProfiles());
    setLoaded(true);
  }, []);

  const saveToProfile = useCallback(
    (index: 1 | 2, name: string, prefs: WidgetPreferences) => {
      const key = index === 1 ? "profile1" : "profile2";
      const next: StoredProfiles = {
        ...profiles,
        [key]: { name: name.trim() || `Perfil ${index}`, order: prefs.order, hidden: prefs.hidden },
      };
      setProfiles(next);
      saveProfiles(next);
    },
    [profiles]
  );

  const loadProfile = useCallback(
    (index: 1 | 2): WidgetPreferences | null => {
      const p = index === 1 ? profiles.profile1 : profiles.profile2;
      if (!p) return null;
      return { order: p.order, hidden: p.hidden };
    },
    [profiles]
  );

  const getProfileName = useCallback(
    (index: 1 | 2): string => {
      const p = index === 1 ? profiles.profile1 : profiles.profile2;
      return p?.name ?? "";
    },
    [profiles]
  );

  const hasProfile = useCallback(
    (index: 1 | 2): boolean => {
      return index === 1 ? profiles.profile1 != null : profiles.profile2 != null;
    },
    [profiles]
  );

  const deleteProfile = useCallback(
    (index: 1 | 2) => {
      const key = index === 1 ? "profile1" : "profile2";
      const next = { ...profiles, [key]: null };
      setProfiles(next);
      saveProfiles(next);
    },
    [profiles]
  );

  return {
    profiles,
    loaded,
    saveToProfile,
    loadProfile,
    getProfileName,
    hasProfile,
    deleteProfile,
  };
}
