"use client"

import { useEffect } from "react"
import { getOrCreateVisitorId, pingVisitor } from "@/lib/visitor-id"

/** Assigns a stable visitor_uid and upserts it into Samushao `visitors`. */
export function VisitorBootstrap() {
  useEffect(() => {
    const id = getOrCreateVisitorId()
    void pingVisitor(id)

    // Tear down any previously registered PWA service worker
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister()
      })
    }
  }, [])

  return null
}
