/**
 * @fileoverview ArcadeTabs - A robust, accessible, retro 8-bit arcade themed tab system.
 * Implements the WAI-ARIA 1.2 Tabs design pattern with roving tabindex, full keyboard navigation,
 * custom lifecycle events, graceful degradation, and requestAnimationFrame animation support.
 * @author CHIP-QUEST '84 Engineering
 * @version 1.0.0
 */

/**
 * Configuration options for the ArcadeTabs component.
 * @typedef {Object} ArcadeTabsOptions
 * @property {number} [defaultTab=0] - Zero-based index of the initially selected tab.
 * @property {boolean} [animated=true] - Whether to apply retro cartridge swap animations.
 * @property {((data: { index: number, tab: HTMLElement, panel: HTMLElement }) => void)|null} [onOpen=null] - Lifecycle callback triggered when a tab is opened.
 * @property {((data: { index: number, tab: HTMLElement, panel: HTMLElement }) => void)|null} [onClose=null] - Lifecycle callback triggered when a tab is closed.
 */

/**
 * State container for the ArcadeTabs instance.
 * @typedef {Object} ArcadeTabsState
 * @property {number} activeIndex - Currently active tab index (-1 if none active).
 * @property {boolean} isAnimating - Whether an animation sequence is currently executing.
 * @property {boolean} isDestroyed - Flag indicating if this instance has been torn down.
 */

class ArcadeTabs {
  /**
   * Constructs a new ArcadeTabs instance.
   * @param {HTMLElement|string} rootElement - The DOM element or query selector for the tabs container.
   * @param {ArcadeTabsOptions} [options={}] - Custom configuration options.
   * @throws {TypeError} If rootElement cannot be resolved to a valid DOM element.
   */
  constructor(rootElement, options = {}) {
    // Resolve element from string selector if necessary
    const targetEl = typeof rootElement === 'string'
      ? document.querySelector(rootElement)
      : rootElement;

    if (!targetEl || !(targetEl instanceof HTMLElement)) {
      throw new TypeError(`[ArcadeTabs] Invalid rootElement provided: expected HTMLElement or valid selector, received ${rootElement}`);
    }

    /**
     * Root container element.
     * @type {HTMLElement}
     */
    this.rootElement = targetEl;

    /**
     * Merged configuration options.
     * @type {Required<ArcadeTabsOptions>}
     */
    this.options = {
      defaultTab: 0,
      animated: true,
      onOpen: null,
      onClose: null,
      ...options
    };

    /**
     * Internal state object.
     * @type {ArcadeTabsState}
     */
    this.state = {
      activeIndex: -1,
      isAnimating: false,
      isDestroyed: false
    };

    /**
     * Cached reference to tablist element.
     * @type {HTMLElement|null}
     */
    this.tabList = null;

    /**
     * Cached collection of tab button elements.
     * @type {HTMLElement[]}
     */
    this.tabs = [];

    /**
     * Cached collection of matching tabpanel elements.
     * @type {HTMLElement[]}
     */
    this.panels = [];

    // Bound event handlers for stable removal during destroy()
    this._handleClick = this._handleClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleAnimationEnd = this._handleAnimationEnd.bind(this);

    // Initialize component
    this.init();
  }

  /**
   * Initializes the tab system: validates markup, establishes ARIA relationships,
   * attaches event delegation listeners, and activates the initial tab.
   * Wrapped in try/catch to safeguard against unexpected DOM mutations.
   * @returns {this} The initialized ArcadeTabs instance.
   */
  init() {
    try {
      // Guard against duplicate initialization on the same DOM element
      if (this.rootElement.__arcadeTabsInstance) {
        console.warn('[ArcadeTabs] Component already initialized on this element. Returning existing instance.', this.rootElement);
        return this.rootElement.__arcadeTabsInstance;
      }

      // 1. Locate Tablist Container
      this.tabList = this.rootElement.querySelector('[role="tablist"]') ||
                     this.rootElement.querySelector('.arcade-tablist');

      if (!this.tabList) {
        console.warn('[ArcadeTabs] Invalid markup: Missing [role="tablist"] or .arcade-tablist within container. Initialization aborted.', this.rootElement);
        return this;
      }

      // Ensure proper role on tablist
      if (this.tabList.getAttribute('role') !== 'tablist') {
        this.tabList.setAttribute('role', 'tablist');
      }

      // 2. Locate Tab Elements
      const rawTabs = Array.from(this.tabList.querySelectorAll('[role="tab"], .arcade-tab'));
      if (rawTabs.length === 0) {
        console.warn('[ArcadeTabs] Invalid markup: No tabs found inside tablist. Initialization aborted.', this.tabList);
        return this;
      }
      this.tabs = rawTabs;

      // 3. Locate and Pair Matching Panels
      this.panels = [];
      const instanceId = Math.random().toString(36).substring(2, 8);

      this.tabs.forEach((tab, index) => {
        // Enforce role="tab"
        tab.setAttribute('role', 'tab');

        // Ensure tab has a unique ID
        if (!tab.id) {
          tab.id = `arcade-tab-${instanceId}-${index}`;
        }

        // Determine matching panel ID
        let panelId = tab.getAttribute('aria-controls');
        let panel = panelId ? document.getElementById(panelId) : null;

        // Fallback: match by index among panels within root container
        if (!panel) {
          const rootPanels = Array.from(this.rootElement.querySelectorAll('[role="tabpanel"], .arcade-tabpanel'));
          if (rootPanels[index]) {
            panel = rootPanels[index];
            if (!panel.id) {
              panel.id = `arcade-panel-${instanceId}-${index}`;
            }
            tab.setAttribute('aria-controls', panel.id);
          } else {
            console.warn(`[ArcadeTabs] Warning: Tab at index ${index} (#${tab.id}) has no associated tabpanel element.`);
          }
        }

        if (panel) {
          // Configure ARIA on panel
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('tabindex', '0');
          panel.setAttribute('aria-labelledby', tab.id);
          panel.hidden = true;
          panel.setAttribute('aria-hidden', 'true');
          this.panels.push(panel);
        }

        // Set default ARIA on tab (inactive initially)
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        tab.dataset.tabIndex = String(index);
      });

      // 4. Attach Event Delegation Listeners on Tablist
      this.tabList.addEventListener('click', this._handleClick);
      this.tabList.addEventListener('keydown', this._handleKeyDown);

      // Listen for animation completion on panels stage
      const panelsStage = this.rootElement.querySelector('.arcade-panels-stage') || this.rootElement;
      panelsStage.addEventListener('animationend', this._handleAnimationEnd);

      // 5. Store instance reference on DOM node to prevent duplicate initialization
      this.rootElement.__arcadeTabsInstance = this;

      // 6. Activate Initial Default Tab
      const initialTab = Math.max(0, Math.min(this.options.defaultTab, this.tabs.length - 1));
      this.selectTab(initialTab, false);

      return this;
    } catch (error) {
      console.error('[ArcadeTabs] Initialization error encountered:', error);
      return this;
    }
  }

  /**
   * Selects and activates the tab at the specified index.
   * Manages ARIA states, triggers custom events, and invokes configured callbacks.
   * @param {number} index - Zero-based index of the tab to activate.
   * @param {boolean} [shouldFocus=true] - Whether to set keyboard focus to the newly activated tab.
   * @returns {boolean} True if tab selection succeeded, false otherwise.
   */
  selectTab(index, shouldFocus = true) {
    if (this.state.isDestroyed) {
      console.warn('[ArcadeTabs] Cannot selectTab: instance has been destroyed.');
      return false;
    }

    if (index < 0 || index >= this.tabs.length) {
      console.warn(`[ArcadeTabs] Index ${index} out of bounds (0 - ${this.tabs.length - 1}).`);
      return false;
    }

    const nextTab = this.tabs[index];
    const nextPanel = this.panels[index];

    // Check if tab is disabled
    if (nextTab.getAttribute('aria-disabled') === 'true' || nextTab.hasAttribute('disabled')) {
      return false;
    }

    // If already active, do nothing
    if (this.state.activeIndex === index) {
      if (shouldFocus) {
        nextTab.focus();
      }
      return true;
    }

    const prevIndex = this.state.activeIndex;
    const prevTab = prevIndex >= 0 ? this.tabs[prevIndex] : null;
    const prevPanel = prevIndex >= 0 ? this.panels[prevIndex] : null;

    // 1. Close Previous Tab
    if (prevTab && prevPanel) {
      prevTab.setAttribute('aria-selected', 'false');
      prevTab.setAttribute('tabindex', '-1');
      prevPanel.hidden = true;
      prevPanel.setAttribute('aria-hidden', 'true');
      prevPanel.classList.remove('is-animating');

      // Dispatch 'tabs:close' Custom Event
      const closeEvent = new CustomEvent('tabs:close', {
        bubbles: true,
        cancelable: true,
        detail: {
          index: prevIndex,
          tab: prevTab,
          panel: prevPanel
        }
      });
      this.rootElement.dispatchEvent(closeEvent);

      if (typeof this.options.onClose === 'function') {
        try {
          this.options.onClose({ index: prevIndex, tab: prevTab, panel: prevPanel });
        } catch (cbErr) {
          console.error('[ArcadeTabs] Error in onClose callback:', cbErr);
        }
      }
    }

    // 2. Open New Tab
    this.state.activeIndex = index;
    nextTab.setAttribute('aria-selected', 'true');
    nextTab.setAttribute('tabindex', '0');

    if (nextPanel) {
      nextPanel.hidden = false;
      nextPanel.removeAttribute('aria-hidden');

      // 3. Animation with requestAnimationFrame feature detection
      const prefersReducedMotion = typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (this.options.animated && !prefersReducedMotion && typeof window.requestAnimationFrame === 'function') {
        this.state.isAnimating = true;
        nextPanel.classList.remove('is-animating');
        // Force reflow and schedule animation frame
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            nextPanel.classList.add('is-animating');
          });
        });
      }
    }

    // Focus if requested (e.g. on keyboard navigation or user click)
    if (shouldFocus) {
      nextTab.focus();
    }

    // 4. Dispatch 'tabs:open' Custom Event
    const openEvent = new CustomEvent('tabs:open', {
      bubbles: true,
      cancelable: true,
      detail: {
        index,
        tab: nextTab,
        panel: nextPanel
      }
    });
    this.rootElement.dispatchEvent(openEvent);

    if (typeof this.options.onOpen === 'function') {
      try {
        this.options.onOpen({ index, tab: nextTab, panel: nextPanel });
      } catch (cbErr) {
        console.error('[ArcadeTabs] Error in onOpen callback:', cbErr);
      }
    }

    return true;
  }

  /**
   * Retrieves information regarding the currently active tab and panel.
   * @returns {{ index: number, tab: HTMLElement|null, panel: HTMLElement|null }} Active state data.
   */
  getActiveTab() {
    const idx = this.state.activeIndex;
    return {
      index: idx,
      tab: idx >= 0 ? this.tabs[idx] : null,
      panel: idx >= 0 ? this.panels[idx] : null
    };
  }

  /**
   * Event delegation handler for click interactions on the tablist.
   * @private
   * @param {MouseEvent} event - Native click event.
   */
  _handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const tabBtn = target.closest('[role="tab"], .arcade-tab');
    if (!tabBtn || !this.tabs.includes(tabBtn)) return;

    const tabIdx = this.tabs.indexOf(tabBtn);
    if (tabIdx !== -1) {
      this.selectTab(tabIdx, true);
    }
  }

  /**
   * Event delegation handler for keyboard navigation adhering to WAI-ARIA authoring practices.
   * Supports: ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home, End, Enter, Space.
   * Allows normal Tab / Shift+Tab to enter and exit the tablist without trapping.
   * @private
   * @param {KeyboardEvent} event - Native keyboard event.
   */
  _handleKeyDown(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const currentTab = target.closest('[role="tab"], .arcade-tab');
    if (!currentTab || !this.tabs.includes(currentTab)) return;

    const currentIndex = this.tabs.indexOf(currentTab);
    const totalTabs = this.tabs.length;
    let targetIndex = -1;
    let prevent = false;

    switch (event.key) {
      // Move to Next Tab
      case 'ArrowRight':
      case 'ArrowDown':
        targetIndex = this._findNextEnabledTab(currentIndex, 1);
        prevent = true;
        break;

      // Move to Previous Tab
      case 'ArrowLeft':
      case 'ArrowUp':
        targetIndex = this._findNextEnabledTab(currentIndex, -1);
        prevent = true;
        break;

      // Move to First Tab
      case 'Home':
        targetIndex = this._findNextEnabledTab(-1, 1);
        prevent = true;
        break;

      // Move to Last Tab
      case 'End':
        targetIndex = this._findNextEnabledTab(totalTabs, -1);
        prevent = true;
        break;

      // Explicit Activation
      case 'Enter':
      case ' ':
        if (currentIndex !== this.state.activeIndex) {
          this.selectTab(currentIndex, true);
          prevent = true;
        }
        break;

      default:
        // Allow Tab, Shift+Tab, and other standard keys to flow naturally
        return;
    }

    if (prevent) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (targetIndex !== -1 && targetIndex !== currentIndex) {
      // In arcade UI, switching immediately upon arrow key navigation provides the most tactile feel
      this.selectTab(targetIndex, true);
    }
  }

  /**
   * Finds the next enabled tab index cycling in a specified direction.
   * @private
   * @param {number} startIndex - Starting index.
   * @param {number} direction - 1 for forward, -1 for backward.
   * @returns {number} The index of the next enabled tab, or -1 if none found.
   */
  _findNextEnabledTab(startIndex, direction) {
    const total = this.tabs.length;
    for (let i = 1; i <= total; i++) {
      const candidateIndex = (startIndex + (i * direction) + total * 10) % total;
      const candidateTab = this.tabs[candidateIndex];
      const isDisabled = candidateTab.getAttribute('aria-disabled') === 'true' ||
                         candidateTab.hasAttribute('disabled');
      if (!isDisabled) {
        return candidateIndex;
      }
    }
    return -1;
  }

  /**
   * Handles cleanup when panel swap animations conclude.
   * @private
   * @param {AnimationEvent} event - The animationend event.
   */
  _handleAnimationEnd(event) {
    if (event.target instanceof HTMLElement && event.target.classList.contains('is-animating')) {
      event.target.classList.remove('is-animating');
      this.state.isAnimating = false;
    }
  }

  /**
   * Destroys the ArcadeTabs instance, removing all event listeners, resetting ARIA states,
   * and clearing DOM references to prevent memory leaks.
   */
  destroy() {
    if (this.state.isDestroyed) {
      return;
    }

    // 1. Remove Event Listeners
    if (this.tabList) {
      this.tabList.removeEventListener('click', this._handleClick);
      this.tabList.removeEventListener('keydown', this._handleKeyDown);
    }

    const panelsStage = this.rootElement.querySelector('.arcade-panels-stage') || this.rootElement;
    if (panelsStage) {
      panelsStage.removeEventListener('animationend', this._handleAnimationEnd);
    }

    // 2. Reset Tabs & Panels ARIA
    this.tabs.forEach(tab => {
      tab.removeAttribute('tabindex');
      tab.removeAttribute('aria-selected');
    });

    this.panels.forEach(panel => {
      panel.hidden = false;
      panel.removeAttribute('aria-hidden');
      panel.classList.remove('is-animating');
    });

    // 3. Remove instance cache on DOM element
    delete this.rootElement.__arcadeTabsInstance;

    // 4. Update state flag
    this.state.isDestroyed = true;
    this.state.activeIndex = -1;
  }

  /**
   * Static factory method that queries DOM elements matching a selector and initializes
   * ArcadeTabs on each, reading HTML5 data-* attributes for component options.
   *
   * Supported data attributes:
   *  - data-default-tab: number (default: 0)
   *  - data-animated: boolean ("true" | "false", default: true)
   *
   * @param {string} [selector='[data-component="tabs"]'] - CSS selector for target tab containers.
   * @param {ArcadeTabsOptions} [options={}] - Override options applied to all discovered instances.
   * @returns {ArcadeTabs[]} Array of created ArcadeTabs instances.
   */
  static create(selector = '[data-component="tabs"]', options = {}) {
    const elements = Array.from(document.querySelectorAll(selector));
    const instances = [];

    elements.forEach(element => {
      // Skip if already instantiated
      if (element.__arcadeTabsInstance) {
        instances.push(element.__arcadeTabsInstance);
        return;
      }

      // Parse dataset attributes
      const dataset = element.dataset || {};
      const parsedOptions = { ...options };

      if (dataset.defaultTab !== undefined) {
        const parsedDefault = parseInt(dataset.defaultTab, 10);
        if (!isNaN(parsedDefault)) {
          parsedOptions.defaultTab = parsedDefault;
        }
      }

      if (dataset.animated !== undefined) {
        parsedOptions.animated = dataset.animated !== 'false';
      }

      try {
        const instance = new ArcadeTabs(element, parsedOptions);
        instances.push(instance);
      } catch (err) {
        console.error(`[ArcadeTabs.create] Failed to initialize instance on element:`, element, err);
      }
    });

    return instances;
  }
}

// Attach to window for global browser availability
if (typeof window !== 'undefined') {
  window.ArcadeTabs = ArcadeTabs;
}
