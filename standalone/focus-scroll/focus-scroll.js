/**
 * FocusScroll — vertical snap carousel with scroll-linked scale/opacity.
 * Framework-agnostic. No dependencies.
 *
 * HTML structure:
 *
 *   <div class="focus-scroll" data-focus-scroll>
 *     <div class="focus-scroll__item">
 *       <div class="focus-scroll__content">...</div>
 *     </div>
 *   </div>
 *
 * Usage:
 *
 *   import { FocusScroll } from './focus-scroll.js'
 *   const carousel = new FocusScroll({ container: document.querySelector('[data-focus-scroll]') })
 *   carousel.destroy() // on teardown
 */

const DEFAULTS = {
  itemSelector: ".focus-scroll__item",
  contentSelector: ".focus-scroll__content",
  rangeRatio: 0.45,
  inactive: { scale: 0.9, opacity: 1, saturate: 0.85 },
  active: { scale: 1, opacity: 1, saturate: 1 },
  activeClass: "is-active",
  onActiveChange: null,
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function lerpStyle(t, inactive, active) {
  return {
    scale: lerp(inactive.scale, active.scale, t),
    opacity: lerp(inactive.opacity, active.opacity, t),
    saturate: lerp(inactive.saturate, active.saturate, t),
  }
}

function applyStyle(el, style) {
  el.style.transform = `scale(${style.scale})`
  el.style.opacity = String(style.opacity)
  el.style.filter = `saturate(${style.saturate})`
}

export class FocusScroll {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Scrollable root element
   * @param {string} [options.itemSelector]
   * @param {string} [options.contentSelector] - Element inside each item that receives scale/opacity
   * @param {number} [options.rangeRatio] - How far from center (as fraction of viewport height) focus fades to 0
   * @param {{ scale: number, opacity: number, saturate: number }} [options.inactive]
   * @param {{ scale: number, opacity: number, saturate: number }} [options.active]
   * @param {string} [options.activeClass] - Class toggled on the focused item
   * @param {(index: number, item: HTMLElement) => void} [options.onActiveChange]
   */
  constructor(options) {
    if (!options?.container) {
      throw new Error("FocusScroll: `container` is required")
    }

    this.container = options.container
    this.options = { ...DEFAULTS, ...options }
    this.activeIndex = -1
    this.raf = 0
    this.items = []
    this.contents = []

    this._onScroll = this._onScroll.bind(this)
    this._update = this._update.bind(this)

    this.refresh()
    this.container.addEventListener("scroll", this._onScroll, { passive: true })

    this._resizeObserver = new ResizeObserver(this._update)
    this._resizeObserver.observe(this.container)

    this._update()
  }

  /** Re-query items after DOM changes. */
  refresh() {
    const { itemSelector, contentSelector } = this.options
    this.items = [...this.container.querySelectorAll(itemSelector)]
    this.contents = this.items.map(
      (item) => item.querySelector(contentSelector) ?? item,
    )
  }

  /** Scroll to item by index. */
  scrollTo(index, behavior = "smooth") {
    const item = this.items[index]
    if (!item) return
    item.scrollIntoView({ behavior, block: "center" })
  }

  /** Reset scroll position. */
  scrollToStart(behavior = "auto") {
    this.container.scrollTo({ top: 0, behavior })
    requestAnimationFrame(this._update)
  }

  /** Current focused index. */
  getActiveIndex() {
    return this.activeIndex
  }

  /** Manually recalculate styles (e.g. after layout shift). */
  update() {
    this._update()
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.container.removeEventListener("scroll", this._onScroll)
    this._resizeObserver?.disconnect()

    for (const content of this.contents) {
      content.style.transform = ""
      content.style.opacity = ""
      content.style.filter = ""
    }

    for (const item of this.items) {
      item.classList.remove(this.options.activeClass)
      item.removeAttribute("data-focus-active")
    }
  }

  _onScroll() {
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this._update)
  }

  _update() {
    const { inactive, active, rangeRatio, activeClass, onActiveChange } = this.options

    if (this.items.length === 0) return

    const viewportCenter = this.container.scrollTop + this.container.clientHeight / 2
    const range = this.container.clientHeight * rangeRatio

    let bestIndex = 0
    let bestFocus = 0

    this.items.forEach((item, i) => {
      const content = this.contents[i]
      if (!content) return

      const itemCenter = item.offsetTop + item.offsetHeight / 2
      const focus = Math.max(0, 1 - Math.abs(viewportCenter - itemCenter) / range)
      const style = lerpStyle(focus, inactive, active)

      applyStyle(content, style)

      if (focus > bestFocus) {
        bestFocus = focus
        bestIndex = i
      }
    })

    if (bestIndex !== this.activeIndex) {
      const prev = this.items[this.activeIndex]
      if (prev) {
        prev.classList.remove(activeClass)
        prev.removeAttribute("data-focus-active")
      }

      this.activeIndex = bestIndex

      const current = this.items[bestIndex]
      if (current) {
        current.classList.add(activeClass)
        current.setAttribute("data-focus-active", "true")
      }

      onActiveChange?.(bestIndex, current ?? null)
    }
  }
}

/** Auto-init all `[data-focus-scroll]` elements on the page. */
export function initFocusScroll(root = document) {
  const instances = []
  for (const container of root.querySelectorAll("[data-focus-scroll]")) {
    instances.push(new FocusScroll({ container }))
  }
  return instances
}

export default FocusScroll
