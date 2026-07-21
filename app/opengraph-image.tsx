import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt = "საქართველოში არსებული ყველა ვაკანსია Recruiter.ge-ზე"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

async function loadGoogleSans(subset: "georgian" | "latin", weight: 400 | 700) {
  const file = join(
    process.cwd(),
    "node_modules/@fontsource/google-sans/files",
    `google-sans-${subset}-${weight}-normal.woff`
  )
  return readFile(file)
}

export default async function OpengraphImage() {
  const [georgian400, georgian700, latin400, latin700] = await Promise.all([
    loadGoogleSans("georgian", 400),
    loadGoogleSans("georgian", 700),
    loadGoogleSans("latin", 400),
    loadGoogleSans("latin", 700),
  ])

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
          fontFamily: "Google Sans",
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
          <div style={{ fontSize: 40, fontWeight: 700, color: "#111318" }}>
            Recruiter.ge
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 1040,
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              color: "#111318",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            საქართველოში არსებული ყველა ვაკანსია Recruiter.ge-ზე
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "#8a8f9c",
            fontWeight: 400,
          }}
        >
          <div>jobs.ge · hr.ge · samushao.ge · და სხვა</div>
          <div style={{ fontWeight: 700, color: "#111318" }}>recruiter.ge</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Google Sans", data: georgian400, style: "normal", weight: 400 },
        { name: "Google Sans", data: georgian700, style: "normal", weight: 700 },
        { name: "Google Sans", data: latin400, style: "normal", weight: 400 },
        { name: "Google Sans", data: latin700, style: "normal", weight: 700 },
      ],
    }
  )
}
