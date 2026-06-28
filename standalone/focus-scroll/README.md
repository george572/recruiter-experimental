# FocusScroll

Standalone vertical carousel with scroll-linked scale, opacity, and saturation — extracted from the job cards carousel.

No dependencies. Works in any project (vanilla JS, React, Vue, etc.).

## Quick start

1. Copy `focus-scroll.js` and `focus-scroll.css` into your project.
2. Use this HTML structure:

```html
<div class="focus-scroll-wrap">
  <div class="focus-scroll no-scrollbar" data-focus-scroll>
    <div class="focus-scroll__item">
      <div class="focus-scroll__content">
        <!-- your card -->
      </div>
    </div>
    <!-- more items -->
  </div>
</div>
```

3. Initialize:

```html
<script type="module">
  import { FocusScroll } from './focus-scroll.js'

  const carousel = new FocusScroll({
    container: document.querySelector('[data-focus-scroll]'),
    onActiveChange(index, item) {
      console.log('Active:', index)
    },
  })
</script>
```

Or auto-init every `[data-focus-scroll]` element:

```js
import { initFocusScroll } from './focus-scroll.js'
const instances = initFocusScroll()
```

## Demo

Open `demo.html` in a browser (via a local server or directly).

```bash
npx serve .
# or: python3 -m http.server 8080
```

## API

### `new FocusScroll(options)`

| Option | Default | Description |
|--------|---------|-------------|
| `container` | — | **Required.** Scrollable root element |
| `itemSelector` | `.focus-scroll__item` | Slide wrapper elements |
| `contentSelector` | `.focus-scroll__content` | Element that receives transform/opacity |
| `rangeRatio` | `0.45` | Focus falloff distance (× viewport height) |
| `inactive` | `{ scale: 0.9, opacity: 1, saturate: 0.85 }` | Style at focus `0` |
| `active` | `{ scale: 1, opacity: 1, saturate: 1 }` | Style at focus `1` |
| `activeClass` | `is-active` | Class added to focused item |
| `onActiveChange` | `null` | `(index, item) => void` |

### Methods

- `refresh()` — re-query items after DOM changes
- `scrollTo(index, behavior?)` — scroll to item
- `scrollToStart(behavior?)` — scroll to top
- `getActiveIndex()` — current focused index
- `update()` — force recalculate styles
- `destroy()` — remove listeners and inline styles

## React example

```tsx
import { useEffect, useRef } from 'react'
import { FocusScroll } from './focus-scroll.js'
import './focus-scroll.css'

export function Carousel({ items }) {
  const containerRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    instanceRef.current = new FocusScroll({ container: containerRef.current })
    return () => instanceRef.current?.destroy()
  }, [])

  useEffect(() => {
    instanceRef.current?.refresh()
    instanceRef.current?.scrollToStart()
  }, [items])

  return (
    <div className="focus-scroll-wrap">
      <div ref={containerRef} className="focus-scroll no-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="focus-scroll__item">
            <div className="focus-scroll__content">
              {/* card */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## How it works

On scroll (via `requestAnimationFrame`):

1. Find viewport center: `scrollTop + clientHeight / 2`
2. For each item, compute distance from its center to viewport center
3. Map distance → `focus` (0–1) using `rangeRatio`
4. Interpolate scale, opacity, and saturation between inactive/active values
5. Apply styles directly to each `.focus-scroll__content` element

CSS handles snap scrolling (`scroll-snap-type: y mandatory`) and padding so cards pass through center with room to animate.
