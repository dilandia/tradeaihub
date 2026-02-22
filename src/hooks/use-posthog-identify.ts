"use client"

import { useEffect } from "react"
import { usePostHog } from "posthog-js/react"

export function usePostHogIdentify(user: { id: string; email?: string; plan?: string } | null) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog || !user) return

    posthog.identify(user.id, {
      email: user.email,
      plan: user.plan,
    })
  }, [posthog, user?.id, user?.email, user?.plan])
}
