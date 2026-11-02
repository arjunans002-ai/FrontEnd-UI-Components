/**
 * @fileoverview Main Page Orchestrator for CHIP-QUEST '84 Arcade Tab System.
 * Coordinates tab initialization, Web Audio API sound synthesis, dynamic XP progress tracking,
 * intersection-based achievement notifications, the Konami Code easter egg, and high-score tallying.
 * @author CHIP-QUEST '84 Engineering
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  try {
    /* =========================================================================
       1. MOTION PREFERENCE & BROWSER DETECTION
       ========================================================================= */
    /**
     * User's operating system reduced-motion preference.
     * @type {boolean}
     */
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =========================================================================
       2. RETRO 8-BIT SOUND SYNTHESIS ENGINE (Web Audio API)
       ========================================================================= */
    /**
     * Sound Engine encapsulated module.
     * Generates pure square-wave and noise retro arcade sound effects without audio files.
     */
    const RetroAudio = (() => {
      /** @type {AudioContext|null} */
      let audioCtx = null;
      let isMuted = true;

      /**
       * Safely initializes or resumes the Web Audio AudioContext.
       * Requires user interaction per modern browser autoplay policies.
       * @returns {AudioContext|null} The initialized audio context, or null if unsupported.
       */
      function getAudioContext() {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(err => {
            console.warn('[RetroAudio] Context resume prevented:', err);
          });
        }
        return audioCtx;
      }

      /**
       * Sets mute state and toggles UI indicator.
       * @param {boolean} muted - Whether audio should be muted.
       */
      function setMuted(muted) {
        isMuted = muted;
        const soundBtn = document.getElementById('sound-toggle');
        if (!soundBtn) return;

        soundBtn.setAttribute('aria-pressed', String(!isMuted));
        soundBtn.setAttribute(
          'aria-label',
          isMuted ? 'Toggle 8-bit sound effects: currently muted' : 'Toggle 8-bit sound effects: currently active'
        );

        const iconEl = soundBtn.querySelector('.sound-icon');
        const labelEl = soundBtn.querySelector('.sound-label');

        if (isMuted) {
          soundBtn.classList.remove('is-active');
          if (iconEl) iconEl.textContent = '🔇';
          if (labelEl) labelEl.textContent = 'SFX: OFF';
        } else {
          soundBtn.classList.add('is-active');
          if (iconEl) iconEl.textContent = '🔊';
          if (labelEl) labelEl.textContent = 'SFX: ON';
          // Play confirmation chime
          playBlip(660, 0.08);
        }
      }

      /**
       * Toggles audio mute state.
       * @returns {boolean} The new mute state.
       */
      function toggleMute() {
        getAudioContext();
        setMuted(!isMuted);
        return isMuted;
      }

      /**
       * Plays a basic synthesized chip tone.
       * @param {number} frequency - Tone frequency in Hz.
       * @param {number} duration - Duration in seconds.
       * @param {OscillatorType} [type='square'] - Waveform type.
       * @param {number} [volume=0.15] - Master gain level.
       */
      function playTone(frequency, duration, type = 'square', volume = 0.15) {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = type;
          osc.frequency.setValueAtTime(frequency, ctx.currentTime);

          gain.gain.setValueAtTime(volume, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + duration);
        } catch (e) {
          console.warn('[RetroAudio] Play tone failed:', e);
        }
      }

      /**
       * Plays a quick 8-bit blip sound for UI interactions.
       * @param {number} [freq=520] - Frequency in Hz.
       * @param {number} [duration=0.06] - Duration in seconds.
       */
      function playBlip(freq = 520, duration = 0.06) {
        playTone(freq, duration, 'square', 0.12);
      }

      /**
       * Plays classic 2-tone arcade coin pickup arpeggio (B5 -> E6).
       */
      function playCoin() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now);          // B5
          osc.frequency.setValueAtTime(1318.51, now + 0.08);   // E6

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.setValueAtTime(0.2, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(now + 0.35);
        } catch (e) {
          console.warn('[RetroAudio] Coin sound failed:', e);
        }
      }

      /**
       * Plays tab switch sound (quick frequency sweep).
       */
      function playTabSwitch() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(880, now + 0.09);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(now + 0.1);
        } catch (e) {
          console.warn('[RetroAudio] Tab switch sound failed:', e);
        }
      }

      /**
       * Plays start power-up sound sweep.
       */
      function playStartSound() {
        if (isMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(now + 0.3);
        } catch (e) {
          console.warn('[RetroAudio] Start sound failed:', e);
        }
      }

      /**
       * Plays victory fanfare arpeggio (C5 -> E5 -> G5 -> C6).
       */
      function playFanfare() {
        if (isMuted) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            playTone(freq, 0.12, 'square', 0.2);
          }, idx * 90);
        });
      }

      return {
        toggleMute,
        playBlip,
        playCoin,
        playTabSwitch,
        playStartSound,
        playFanfare,
        isMuted: () => isMuted
      };
    })();

    // Wire up sound toggle button
    const soundToggleBtn = document.getElementById('sound-toggle');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        RetroAudio.toggleMute();
      });
    }

    /* =========================================================================
       3. COMPONENT AUTO-INITIALIZATION & EVENT SUBSCRIPTION
       ========================================================================= */
    /**
     * Initialize all ArcadeTabs instances matching data-component="tabs".
     */
    const tabInstances = ArcadeTabs.create('[data-component="tabs"]');

    // Track tab switch statistics and rewards
    let visitedTabs = new Set([0]);

    // Listen to custom lifecycle events dispatched by ArcadeTabs
    const tabsRoot = document.querySelector('[data-component="tabs"]');
    if (tabsRoot) {
      tabsRoot.addEventListener('tabs:open', (event) => {
        const customEvt = /** @type {CustomEvent} */ (event);
        const { index, tab } = customEvt.detail;

        // Play tactile retro sound
        RetroAudio.playTabSwitch();

        // Increment score for exploration
        addScore(500);

        // Award achievement on exploring multiple tabs
        if (!visitedTabs.has(index)) {
          visitedTabs.add(index);
          if (visitedTabs.size === 4) {
            ToastManager.show(
              'CARTRIDGE MASTER',
              'Explored all 4 arcade modules: Quests, Items, Skills & Bestiary!'
            );
          }
        }
      });
    }

    /* =========================================================================
       4. ACHIEVEMENT TOAST NOTIFICATION SYSTEM
       ========================================================================= */
    const ToastManager = (() => {
      const toastEl = document.getElementById('achievement-toast');
      const titleEl = document.getElementById('toast-title');
      const descEl = document.getElementById('toast-desc');
      let dismissTimer = null;

      /**
       * Displays an 8-bit achievement notification toast and automatically dismisses after 3s.
       * @param {string} title - Title text of the achievement.
       * @param {string} description - Explanatory achievement description.
       */
      function show(title, description) {
        if (!toastEl || !titleEl || !descEl) return;

        // Clear existing dismiss timer
        if (dismissTimer) {
          clearTimeout(dismissTimer);
          dismissTimer = null;
        }

        // Update text contents
        titleEl.textContent = title;
        descEl.textContent = description;

        // Reveal toast
        toastEl.hidden = false;
        // Trigger layout reflow for animation
        void toastEl.offsetWidth;
        toastEl.classList.add('is-visible');

        // Play achievement sound fanfare
        RetroAudio.playFanfare();

        // Auto-dismiss after 3000ms
        dismissTimer = setTimeout(() => {
          toastEl.classList.remove('is-visible');
          setTimeout(() => {
            toastEl.hidden = true;
          }, 350);
        }, 3000);
      }

      return { show };
    })();

    /* =========================================================================
       5. HIGH SCORE & RUN TALLY SYSTEM
       ========================================================================= */
    let currentScore = 12500;
    const currentScoreEl = document.getElementById('current-score-val');
    const highScoreEl = document.getElementById('high-score-val');

    /**
     * Formats integer score into 6-digit 8-bit display string.
     * @param {number} num - Raw score value.
     * @returns {string} Formatted string with trailing " PTS".
     */
    function formatScore(num) {
      return String(Math.floor(num)).padStart(6, '0') + ' PTS';
    }

    /**
     * Adds points to current score and updates DOM display.
     * @param {number} points - Number of points to add.
     */
    function addScore(points) {
      currentScore += points;
      if (currentScoreEl) {
        currentScoreEl.textContent = formatScore(currentScore);
      }

      // Check for High Score Beaten
      if (currentScore > 98400 && highScoreEl) {
        highScoreEl.textContent = formatScore(currentScore);
      }
    }

    /* =========================================================================
       6. DYNAMIC XP PROGRESS BAR & LEVEL STATUS CALCULATOR
       ========================================================================= */
    const xpFillEl = document.getElementById('xp-bar-fill');
    const xpTextEl = document.getElementById('xp-text');
    const xpProgressBar = document.getElementById('xp-progressbar');
    const lvlDisplayEl = document.getElementById('lvl-display');

    let currentLvl = 1;
    let ticking = false;

    /**
     * Updates XP progress bar, text counter, and calculates player level based on scroll depth.
     */
    function updateXpProgress() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = docHeight - winHeight;

      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      const percentage = progress * 100;
      const xpPoints = Math.round(progress * 1000);

      // Update XP Bar width and ARIA value
      if (xpFillEl) {
        xpFillEl.style.width = `${percentage.toFixed(1)}%`;
      }
      if (xpTextEl) {
        xpTextEl.textContent = `${xpPoints} / 1000 XP`;
      }
      if (xpProgressBar) {
        xpProgressBar.setAttribute('aria-valuenow', String(xpPoints));
      }

      // Calculate Player Level (Levels 01 to 04 based on 4 sections)
      let newLvl = 1;
      if (percentage >= 75) {
        newLvl = 4;
      } else if (percentage >= 50) {
        newLvl = 3;
      } else if (percentage >= 25) {
        newLvl = 2;
      }

      if (newLvl !== currentLvl) {
        currentLvl = newLvl;
        if (lvlDisplayEl) {
          lvlDisplayEl.textContent = String(currentLvl).padStart(2, '0');
        }
        RetroAudio.playCoin();
        addScore(1000);
      }

      ticking = false;
    }

    // Attach throttled scroll listener for HUD updates
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame ? window.requestAnimationFrame(updateXpProgress) : updateXpProgress();
        ticking = true;
      }
    }, { passive: true });

    // Initial update on page load
    updateXpProgress();

    /* =========================================================================
       7. INTERSECTION OBSERVER FOR SECTION ACHIEVEMENTS
       ========================================================================= */
    const unlockedAchievements = new Set();

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;

            if (sectionId === 'tab-system-section' && !unlockedAchievements.has('tabs')) {
              unlockedAchievements.add('tabs');
              ToastManager.show(
                'SYSTEM BOOT SUCCESS',
                'Tab cartridge loaded. Use Arrow keys to navigate modules!'
              );
            } else if (sectionId === 'game-over-screen' && !unlockedAchievements.has('gameover')) {
              unlockedAchievements.add('gameover');
              ToastManager.show(
                'HIGH SCORE RUNNER',
                'Reached the final arcade cabinet sector! Continue?'
              );
            }
          }
        });
      }, { threshold: 0.3 });

      const tabSection = document.getElementById('tab-system-section');
      const footerSection = document.getElementById('game-over-screen');

      if (tabSection) observer.observe(tabSection);
      if (footerSection) observer.observe(footerSection);
    }

    /* =========================================================================
       8. "PRESS START" SMOOTH NAVIGATION CTA
       ========================================================================= */
    const startBtn = document.getElementById('btn-press-start');
    if (startBtn) {
      startBtn.addEventListener('click', (event) => {
        event.preventDefault();
        RetroAudio.playStartSound();

        const targetSection = document.getElementById('tab-system-section');
        if (targetSection) {
          const headerOffset = 64;
          const targetY = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: targetY,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });

          // Focus first tab after navigation
          setTimeout(() => {
            const firstTab = targetSection.querySelector('[role="tab"]');
            if (firstTab instanceof HTMLElement) {
              firstTab.focus();
            }
          }, prefersReducedMotion ? 50 : 400);
        }
      });
    }

    /* =========================================================================
       9. KONAMI CODE SECRET EASTER EGG (↑ ↑ ↓ ↓ ← → ← → B A)
       ========================================================================= */
    /**
     * Canonical 10-key Konami sequence.
     * @type {string[]}
     */
    const konamiSequence = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];

    let konamiPointer = 0;

    /**
     * Triggers retro coin shower effect with animated DOM elements.
     */
    function triggerCoinShower() {
      const container = document.getElementById('coin-shower-container');
      if (!container || prefersReducedMotion) return;

      container.innerHTML = '';
      const coinCount = 32;

      for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement('div');
        coin.className = 'falling-coin';
        coin.textContent = '🪙';
        coin.style.left = `${Math.random() * 96}%`;
        coin.style.animationDelay = `${(Math.random() * 1.5).toFixed(2)}s`;
        coin.style.animationDuration = `${(1.8 + Math.random() * 1.2).toFixed(2)}s`;
        container.appendChild(coin);
      }

      // Cleanup coins after animation
      setTimeout(() => {
        container.innerHTML = '';
      }, 4000);
    }

    // Global Keydown listener for Konami Code sequence
    window.addEventListener('keydown', (event) => {
      // Ignore if user is currently inside an input/textarea
      const tag = (event.target && event.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) {
        return;
      }

      // Compare case-insensitively: 'ArrowUp' must match 'ArrowUp', 'B' must match 'b'.
      const expectedKey = konamiSequence[konamiPointer].toLowerCase();
      const pressedKey = String(event.key).toLowerCase();

      if (pressedKey === expectedKey) {
        konamiPointer++;
        RetroAudio.playBlip(700 + konamiPointer * 50, 0.04);

        if (konamiPointer === konamiSequence.length) {
          // Success! Easter egg unlocked
          konamiPointer = 0;
          addScore(50000);
          RetroAudio.playFanfare();
          triggerCoinShower();
          ToastManager.show(
            '★ SECRET KONAMI CODE ★',
            '30 LIVES GRANTED! +50,000 BONUS PTS ADDED TO RUN!'
          );
        }
      } else {
        // Reset pointer on mismatched key
        konamiPointer = (pressedKey === konamiSequence[0].toLowerCase()) ? 1 : 0;
      }
    });

    /* =========================================================================
       10. REPLAY / INSERT COIN BUTTON HANDLER
       ========================================================================= */
    const insertCoinBtn = document.getElementById('btn-insert-coin');
    if (insertCoinBtn) {
      insertCoinBtn.addEventListener('click', () => {
        RetroAudio.playCoin();
        addScore(1000);

        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        ToastManager.show(
          'CREDIT INSERTED',
          'Run restarted! High score preserved.'
        );
      });
    }

    /* =========================================================================
       11. "CONTINUE?" COUNTDOWN (footer)
       Counts 9 → 0 in choppy one-second steps, then loops. Skipped when the
       user prefers reduced motion so the number stays still.
       ========================================================================= */
    const countdownEl = document.getElementById('countdown-timer');
    if (countdownEl && !prefersReducedMotion) {
      let count = 9;
      setInterval(() => {
        count = count <= 0 ? 9 : count - 1;
        countdownEl.textContent = String(count);
      }, 1000);
    }

    console.log('[CHIP-QUEST \'84] Arcade system ready. Input sequence active.');

  } catch (globalErr) {
    console.error('[CHIP-QUEST \'84] Unexpected initialization error:', globalErr);
  }
});
