export const AUDIENCE_THEME_KEY = "audience-theme"

export type AudienceTheme = "light" | "dark"

/** Read stored theme. Default is light — never follow OS prefers-color-scheme. */
export function readAudienceTheme(): AudienceTheme {
  try {
    return window.localStorage.getItem(AUDIENCE_THEME_KEY) === "dark"
      ? "dark"
      : "light"
  } catch {
    return "light"
  }
}

export function writeAudienceTheme(theme: AudienceTheme) {
  try {
    window.localStorage.setItem(AUDIENCE_THEME_KEY, theme)
  } catch {
    // ignore quota / private mode
  }
}

/** Apply theme on <html> so CSS variables / color-scheme are not overridden by OS. */
export function applyAudienceThemeClass(dark: boolean) {
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.classList.toggle("light", !dark)
  root.style.colorScheme = dark ? "dark" : "light"
}
