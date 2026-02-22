import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const runtime = "nodejs"
export const alt = "Trade AI Hub — AI-Powered Trading Journal"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public", "icon-glyph-512x512.png")
  )
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #0f0a2e 40%, #1a0a3e 70%, #0a0a1a 100%)",
          position: "relative",
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #8b5cf6, #3b82f6, #8b5cf6)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 48,
          }}
        >
          {/* Logo */}
          <img
            src={logoBase64}
            width={200}
            height={200}
            style={{ borderRadius: 24 }}
          />

          {/* Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.1,
              }}
            >
              Trade AI Hub
            </div>
            <div
              style={{
                width: 280,
                height: 3,
                background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 24,
                color: "#94a3b8",
                marginTop: 8,
              }}
            >
              AI-Powered Trading Journal
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#64748b",
          }}
        >
          tradeaihub.com
        </div>
      </div>
    ),
    { ...size }
  )
}
