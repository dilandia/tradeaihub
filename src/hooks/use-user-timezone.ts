"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/app/actions/profile";

/**
 * Hook client-side para obter o timezone preferido do usuário.
 * Retorna "server" (padrão) = sem conversão, ou o timezone selecionado.
 * Seguro contra 502 — fetch é client-side com fallback.
 */
export function useUserTimezone(): string {
  const [timezone, setTimezone] = useState("server");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (!cancelled && profile?.timezone) {
          setTimezone(profile.timezone);
        }
      })
      .catch(() => {
        // Fallback silencioso — mantém "server"
      });
    return () => { cancelled = true; };
  }, []);

  return timezone;
}
