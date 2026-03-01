import fs from "fs"
import path from "path"

let cachedBuildId: string | null = null

/**
 * Returns the Next.js BUILD_ID. Read once, cached for the process lifetime.
 * Safe to call at module scope or in server components.
 */
export function getBuildId(): string {
  if (cachedBuildId) return cachedBuildId
  try {
    cachedBuildId = fs.readFileSync(
      path.join(process.cwd(), ".next", "BUILD_ID"),
      "utf-8"
    ).trim()
  } catch {
    cachedBuildId = "dev"
  }
  return cachedBuildId
}
