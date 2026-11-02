# CHIP-QUEST '84 // Retro 8-Bit Arcade Tab System

> A fully accessible, progressive-enhancement-first, interactive tab component built with **pure HTML5, CSS3, and vanilla JavaScript (ES6+)**. Zero frameworks. Zero CDNs. Zero external fonts or images.

---

## Table of Contents

1. [What Is This Component?](#what-is-this-component)
2. [File Structure](#file-structure)
3. [How to Run](#how-to-run)
4. [Step-by-Step Testing Guide](#step-by-step-testing-guide)
5. [Keyboard Shortcut Table](#keyboard-shortcut-table)
6. [Configuration Options](#configuration-options)
7. [Custom Events](#custom-events)
8. [Reusing ArcadeTabs on Another Page](#reusing-arcadetabs-on-another-page)
9. [Browser Support and Fallbacks](#browser-support-and-fallbacks)
10. [Arcade Page Features](#arcade-page-features)

---

## What Is This Component?

`ArcadeTabs` is a **reusable, self-contained ES6 class** that implements the WAI-ARIA 1.2 Tabs design pattern inside a Retro 8-Bit Arcade aesthetic. It powers four content panels on the demo page:

| Tab | Content |
|-----|---------|
| **QUEST LOG** | Active missions, objectives, and story progression |
| **INVENTORY** | Equipment grid styled as pixel cartridge slots |
| **SKILLS** | Skill tree with XP cost indicators |
| **BESTIARY** | Enemy catalogue with pixel sprite cards |

The component is the **centrepiece** of the page — tab buttons are styled as chunky arcade game-menu options with pixel stepped clip-path borders, hard box-shadows, and a "press-down" hover/focus animation.

The surrounding page layers on:
- A **CRT scanline + vignette overlay** (fixed, `pointer-events: none`)
- An **XP progress bar** fixed at the top that fills as you scroll
- **Achievement toasts** triggered by `IntersectionObserver`
- A **walking pixel sprite** animated with `steps()` keyframes
- A **Konami-code easter egg** (↑ ↑ ↓ ↓ ← → ← → B A) triggering a coin-shower
- **Web Audio API** sound effects (muted by default)
- A **"PRESS START"** blinking CTA button
- A **"GAME OVER / CONTINUE?"** footer with high-score counter

---

## File Structure

```
/
├── index.html          ← Entry point; open this to run the project
├── css/
│   └── styles.css      ← All styles: arcade theme, component states, CRT, responsive
├── js/
│   ├── component.js    ← ArcadeTabs class (reusable, no page-specific code)
│   └── main.js         ← Page orchestrator: XP bar, toasts, Konami, sound, auto-init
└── README.md           ← This file
```

---

## How to Run

1. **Download / unzip** the project to any local folder.
2. **Open `index.html`** in any modern browser — no server required.
3. No build step, no `npm install`, no network connection needed.

> **Tip (Windows):** Right-click `index.html` → *Open with* → choose your browser.  
> **Tip (macOS/Linux):** `open index.html` or `xdg-open index.html` in the terminal.

---

## Step-by-Step Testing Guide

### 1 — Mouse / Touch
1. Open `index.html`.
2. Observe the **XP bar** at the top (starts at 0 %).
3. Click **PRESS START** — page scrolls smoothly to the tab section.
4. Click each of the four tab buttons: **QUEST LOG → INVENTORY → SKILLS → BESTIARY**.
   - Verify only the clicked panel is visible.
   - Verify the active tab turns yellow with dark text.
   - Verify the button "presses down" (shifts 3 px, shadow shrinks).
5. Scroll down slowly — watch the XP bar fill and the LVL counter increment.
6. Scroll into a new section — an **achievement toast** slides in from the right and auto-dismisses.
7. Click the **🔊 SFX** toggle in the HUD — re-click a tab to hear a blip sound.
8. Resize the browser to 375 px width — tabs should stack vertically; content remains readable.

### 2 — Keyboard Only (no mouse)
1. Press **Tab** repeatedly from the top of the page until one of the tab buttons is focused (visible yellow dashed outline).
2. Press **Arrow Right / Arrow Left** — focus moves between tab buttons; active panel switches.
3. Press **Home** — jumps to the first tab (QUEST LOG).
4. Press **End** — jumps to the last tab (BESTIARY).
5. Press **Enter** or **Space** on a focused tab — activates it.
6. Press **Tab** from an active tab button — focus moves into the panel content (tabindex="0").
7. Press **Shift+Tab** from inside the panel — focus returns to the active tab button.
8. Press **Tab** once more from the tab list — focus exits the tablist entirely.

### 3 — Screen Reader *(to be verified on real assistive technology)*
Expected behaviour with NVDA (Windows) or VoiceOver (macOS):
- On landing on the tablist, the SR should announce: *"Game Menu Navigation, tab list"*
- On each tab button: *"[Tab name], tab, 1 of 4, selected/not selected"*
- On activating a tab: SR should read the panel heading automatically (panel has `tabindex="0"`).
- Achievement toasts announce via `aria-live="polite"`.
- XP counter updates announce via `aria-live="polite"`.

> **Note:** Full screen-reader verification should be conducted with NVDA + Firefox and VoiceOver + Safari before production release.

### 4 — Reduced Motion
1. In OS settings, enable **Reduce Motion** (Windows: Settings → Ease of Access → Display → Show animations → Off).
2. Refresh `index.html`.
3. Verify: no sprite walking, no CRT flicker, no tab slide animation, no toast slide — content still switches correctly.
4. Alternatively, in Chrome DevTools → Rendering → check *"Emulate CSS media feature prefers-reduced-motion"* → *reduce*.

### 5 — JavaScript Disabled
1. In Chrome: DevTools → Settings → Preferences → Debugger → ✓ *Disable JavaScript*.
2. Refresh `index.html`.
3. Verify: `<html class="no-js">` stays; all four tab panels are visible as stacked blocks; tab buttons are hidden (content is not locked away); `<noscript>` banner is visible.

### 6 — Narrow Screens (320 px – 480 px)
1. In DevTools → Device Toolbar → set width to 320 px.
2. Verify: tab buttons stack vertically, fill full width, min-height ≥ 44 px.
3. Set width to 375 px (iPhone SE) — verify readability and no horizontal overflow.
4. Set width to 480 px — verify two-column grid cards appear in panels.

### 7 — Wide Screens (1024 px +)
1. Set browser to 1440 px — verify the grid card layout in panel content.
2. Verify the XP bar and HUD remain usable and centred.

### 8 — Konami Code Easter Egg
1. With keyboard focus anywhere on the page, type:  
   `↑ ↑ ↓ ↓ ← → ← → B A`  
   (Arrow keys + letter B + letter A)
2. A coin-shower animation plays; a bonus score appears; a chime sounds (if SFX are on).

---

## Keyboard Shortcut Table

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Anywhere | Move focus forward through the page |
| `Shift + Tab` | Anywhere | Move focus backward |
| `Arrow Right` | Inside tablist | Move focus to next tab (wraps to first) |
| `Arrow Left` | Inside tablist | Move focus to previous tab (wraps to last) |
| `Home` | Inside tablist | Focus and activate first tab |
| `End` | Inside tablist | Focus and activate last tab |
| `Enter` / `Space` | Focused tab button | Activate the focused tab |
| `Tab` | From active tab button | Move focus into the active panel |
| `Shift + Tab` | Inside panel | Move focus back to active tab button |
| `↑↑↓↓←→←→BA` | Anywhere (keyboard) | Konami code — triggers coin-shower easter egg |

---

## Configuration Options

Pass an options object as the second argument to `new ArcadeTabs(el, options)` or `ArcadeTabs.create(selector, options)`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultTab` | `number` | `0` | Zero-based index of the tab open on load |
| `animated` | `boolean` | `true` | Enable/disable panel transition animations |
| `onOpen` | `function\|null` | `null` | Callback: `fn(index, tabEl, panelEl)` — fires when a tab opens |
| `onClose` | `function\|null` | `null` | Callback: `fn(index, tabEl, panelEl)` — fires when a tab closes |

**Via data attributes** (no extra JS needed):

```html
<div data-component="tabs" data-default-tab="2" data-animated="false">
  ...
</div>
```

`data-default-tab` and `data-animated` override `globalOptions` for that specific element.

---

## Custom Events

Both events bubble and carry a `detail` payload. Listen on the root element or any ancestor.

| Event | Fired when | `detail` payload |
|-------|-----------|-----------------|
| `tabs:open` | A tab becomes active | `{ index: number, tab: HTMLElement, panel: HTMLElement }` |
| `tabs:close` | A tab becomes inactive | `{ index: number, tab: HTMLElement, panel: HTMLElement }` |

**Example listener:**

```javascript
document.querySelector('.arcade-tabs').addEventListener('tabs:open', (e) => {
  console.log('Tab opened:', e.detail.index, e.detail.tab.textContent);
});
```

---

## Reusing ArcadeTabs on Another Page

### Minimal HTML

```html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');</script>
  <link rel="stylesheet" href="css/styles.css">
  <title>My Tab Page</title>
</head>
<body>

  <div class="arcade-tabs" data-component="tabs" data-default-tab="1" data-animated="true">
    <div class="tabs__nav" role="tablist" aria-label="My Navigation">
      <button class="tab__btn" role="tab" id="tab-a" aria-controls="panel-a">TAB A</button>
      <button class="tab__btn" role="tab" id="tab-b" aria-controls="panel-b">TAB B</button>
    </div>
    <div class="tabs__content">
      <section class="tab__panel" role="tabpanel" id="panel-a" aria-labelledby="tab-a" tabindex="0">
        <p>Content for Tab A</p>
      </section>
      <section class="tab__panel" role="tabpanel" id="panel-b" aria-labelledby="tab-b" tabindex="0">
        <p>Content for Tab B</p>
      </section>
    </div>
  </div>

  <script src="js/component.js"></script>
  <script>
    // Auto-init via data attributes:
    ArcadeTabs.create('[data-component="tabs"]');

    // Or manual init with callbacks:
    const el = document.querySelector('.arcade-tabs');
    const tabs = new ArcadeTabs(el, {
      defaultTab: 0,
      animated: true,
      onOpen:  (i, tab) => console.log('Opened tab', i, tab.textContent),
      onClose: (i, tab) => console.log('Closed tab', i, tab.textContent),
    }).init();

    // Programmatically switch to tab index 1:
    tabs.goTo(1);

    // Teardown (e.g. in a SPA route change):
    tabs.destroy();
  </script>
</body>
</html>
```

> Only `js/component.js` (and optionally `css/styles.css`) need to be copied. `main.js` is page-specific and is **not** required for the component to function.

---

## Browser Support and Fallbacks

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 90+ | ✅ Full support | All features including Web Audio |
| Firefox | 88+ | ✅ Full support | All features |
| Edge (Chromium) | 90+ | ✅ Full support | All features |
| Safari | 14+ | ✅ Full support | Web Audio requires user gesture |
| Safari iOS | 14+ | ⚠️ To be verified | Touch targets ≥ 44 px; audio needs interaction |
| Samsung Internet | 14+ | ⚠️ To be verified | Core tab behaviour expected to work |
| IE 11 | — | ❌ Not supported | ES6 classes not polyfilled |

### Feature Fallbacks

| Feature | Detection | Fallback |
|---------|-----------|---------|
| JavaScript | `.no-js` / `.js` class on `<html>` | All panels stacked & visible; tabs hidden |
| CSS Grid | `@supports (display: grid)` | Flexbox column layout |
| `:focus-visible` | `@supports selector(:focus-visible)` | Plain `:focus` outline on all elements |
| `IntersectionObserver` | `typeof IntersectionObserver !== 'undefined'` | `scroll` event listener |
| `requestAnimationFrame` | `window.requestAnimationFrame` check | `setTimeout(cb, 16)` |
| Web Audio API | `window.AudioContext \|\| window.webkitAudioContext` | Sound toggle hidden; silent |
| `prefers-reduced-motion` | CSS `@media` + JS `matchMedia` | All animations disabled |

---

*CHIP-QUEST '84 • Built with ❤️ and pure HTML, CSS & ES6 • Zero External Dependencies*
