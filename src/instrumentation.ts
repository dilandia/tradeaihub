export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();

    // Global unhandledRejection handler: prevents @supabase/ssr internal async errors
    // (e.g. _emitInitialSession crashing with corrupted cookies) from crashing the process.
    // Without this, PM2 restarts the process causing 502 during startup.
    process.on("unhandledRejection", (reason) => {
      console.error("[Global] Unhandled promise rejection (caught — process protected):", reason);
      // Log but DO NOT crash. The affected request may timeout, but the process stays alive.
      // Individual requests handle their own errors via middleware try/catch.
    });
  }
}
