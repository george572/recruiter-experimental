import { ImageResponse } from "next/og"

export const alt = "Recruiter.ge — Jobs across Georgia"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #ffffff 0%, #f4f5f7 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: "#111318",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 40, fontWeight: 600, color: "#111318" }}>
            Recruiter.ge
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#111318",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Find your next role.
          </div>
          <div style={{ fontSize: 34, color: "#5b6070" }}>
            Jobs across Georgia — one focused place.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#8a8f9c",
          }}
        >
          <div>jobs.ge · hr.ge · samushao.ge · and more</div>
          <div style={{ fontWeight: 600, color: "#111318" }}>recruiter.ge</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
