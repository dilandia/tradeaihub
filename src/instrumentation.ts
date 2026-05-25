export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();

    // Global unhandledRejection handler: prevents unhandled async errors
    // (e.g. corrupted session cookies or auth library internals) from crashing the process.
    // Without this, PM2 restarts the process causing 502 during startup.
    process.on("unhandledRejection", (reason) => {
      console.error("[Global] Unhandled promise rejection (caught — process protected):", reason);
      // Log but DO NOT crash. The affected request may timeout, but the process stays alive.
      // Individual requests handle their own errors via middleware try/catch.
    });
  }
}
