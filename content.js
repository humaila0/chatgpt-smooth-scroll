(() => {
  "use strict";
  if (window.__chatGPTSmoothScrollLoaded) return;
  window.__chatGPTSmoothScrollLoaded = true;

  let activeScroller = null;
  let holdScrollInterval = null;
  let clickTimeout = null;
  let isHolding = false;
  let scrollThrottleTimeout = null;

  // 1. Efficient Scroll Element Caching Engine
  function isScrollable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const style = getComputedStyle(el);
    const canScroll = (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay");
    return canScroll && el.scrollHeight > el.clientHeight + 10;
  }

  function findScroller() {
    const modernThread = document.querySelector(".thread-scroll-container");
    if (modernThread && isScrollable(modernThread)) return modernThread;

    const mainView = document.querySelector("main div.overflow-y-auto");
    if (mainView && isScrollable(mainView)) return mainView;

    const candidates = [...document.querySelectorAll("div, main, section")].filter(isScrollable);
    candidates.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    return candidates[0] || document.documentElement;
  }

  function getScroller() {
    if (!activeScroller || !document.contains(activeScroller) || activeScroller === document.documentElement) {
      activeScroller = findScroller();
    }
    return activeScroller;
  }

  // 2. NEW FEATURE: Intelligent Smart Button Auto-Hide
  function updateButtonVisibility() {
    const scroller = getScroller();
    if (!scroller) return;

    const btnTop = document.getElementById("cgpt-top");
    const btnBottom = document.getElementById("cgpt-bottom");
    if (!btnTop || !btnBottom) return;

    const currentScroll = scroller.scrollTop;
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;

    // Fade top button away if already at top boundary
    if (currentScroll <= 40) {
      btnTop.style.opacity = "0.2";
      btnTop.style.pointerEvents = "none";
    } else {
      btnTop.style.opacity = "1";
      btnTop.style.pointerEvents = "auto";
    }

    // Fade bottom button away if already at bottom boundary
    if (currentScroll >= maxScroll - 40) {
      btnBottom.style.opacity = "0.2";
      btnBottom.style.pointerEvents = "none";
    } else {
      btnBottom.style.opacity = "1";
      btnBottom.style.pointerEvents = "auto";
    }
  }

  // Throttled scroll listener to keep updates high performance
  function handleScrollThrottled() {
    if (!scrollThrottleTimeout) {
      scrollThrottleTimeout = setTimeout(() => {
        updateButtonVisibility();
        scrollThrottleTimeout = null;
      }, 100);
    }
  }

  // 3. Navigation Controls
  function scrollByAmount(amount) {
    const scroller = getScroller();
    if (scroller) {
      scroller.scrollBy({ top: amount, behavior: "smooth" });
    }
  }

  function startContinuousScroll(speed) {
    stopContinuousScroll(); 
    const scroller = getScroller();
    if (!scroller) return;

    scroller.style.overflowAnchor = "none";

    holdScrollInterval = setInterval(() => {
      requestAnimationFrame(() => {
        scroller.scrollTop += speed;
      });
    }, 16); 
  }

  function stopContinuousScroll() {
    if (holdScrollInterval) {
      clearInterval(holdScrollInterval);
      holdScrollInterval = null;
    }
  }

  // Drag-simulation pathing to bypass active page lock mutations
  function simulateDragScroll(targetPosition) {
    const scroller = getScroller();
    if (!scroller) return;

    const originalAnchor = scroller.style.overflowAnchor;
    scroller.style.overflowAnchor = "none";
    scroller.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    let currentTick = 0;
    const totalTicks = 8;
    const startTop = scroller.scrollTop;
    const distance = targetPosition - startTop;

    const dragInterval = setInterval(() => {
      currentTick++;
      const progress = currentTick / totalTicks;
      scroller.scrollTop = startTop + distance * (1 - Math.pow(1 - progress, 3));
      scroller.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true }));

      if (currentTick >= totalTicks) {
        clearInterval(dragInterval);
        scroller.scrollTop = targetPosition;
        scroller.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
        setTimeout(() => { 
          scroller.style.overflowAnchor = originalAnchor;
          updateButtonVisibility();
        }, 50);
      }
    }, 15);
  }

  function scrollToTop() { simulateDragScroll(0); }
  function scrollToBottom() {
    const scroller = getScroller();
    if (scroller) simulateDragScroll(scroller.scrollHeight);
  }

  function attachDualScrollEvents(buttonId, directionMultiplier) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isHolding = false;

      clickTimeout = setTimeout(() => {
        isHolding = true;
        startContinuousScroll(14 * directionMultiplier); // Speed tuned cleanly to 14px per frame
      }, 220); 
    });

    btn.addEventListener("mouseup", () => {
      clearTimeout(clickTimeout);
      stopContinuousScroll();
      if (!isHolding) {
        const chunkAmount = Math.max(window.innerHeight * 0.75, 500) * directionMultiplier;
        scrollByAmount(chunkAmount);
      }
    });

    btn.addEventListener("mouseleave", () => {
      clearTimeout(clickTimeout);
      stopContinuousScroll();
    });
  }

  function createUI() {
    if (document.getElementById("cgpt-smooth-scroll")) return;
    const box = document.createElement("div");
    box.id = "cgpt-smooth-scroll";
    box.innerHTML = `
      <button id="cgpt-up" title="Click to Page Up / Hold to Scroll">↑</button>
      <button id="cgpt-down" title="Click to Page Down / Hold to Scroll">↓</button>
      <div class="cgpt-divider"></div>
      <button id="cgpt-top" title="Go to top">⇧</button>
      <button id="cgpt-bottom" title="Go to bottom">⇩</button>
    `;
    document.body.appendChild(box);

    attachDualScrollEvents("cgpt-up", -1);
    attachDualScrollEvents("cgpt-down", 1);

    document.getElementById("cgpt-top").addEventListener("click", scrollToTop);
    document.getElementById("cgpt-bottom").addEventListener("click", scrollToBottom);

    box.addEventListener("wheel", e => e.stopPropagation(), { passive: true });

    // Track scrolling changes on the active panel context
    const scroller = getScroller();
    if (scroller && scroller !== document.documentElement) {
      scroller.removeEventListener("scroll", handleScrollThrottled);
      scroller.addEventListener("scroll", handleScrollThrottled, { passive: true });
    }
    updateButtonVisibility();
  }

  createUI();

  const observer = new MutationObserver(() => {
    createUI();
    const scroller = getScroller();
    if (scroller && scroller !== document.documentElement) {
      scroller.removeEventListener("scroll", handleScrollThrottled);
      scroller.addEventListener("scroll", handleScrollThrottled, { passive: true });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("resize", () => { 
    activeScroller = null; 
    updateButtonVisibility();
  });

  document.addEventListener("keydown", e => {
    if (e.target.closest("textarea, input, [contenteditable='true']")) return;
    if (!e.altKey) return;
    if (e.key === "ArrowUp") { e.preventDefault(); scrollByAmount(-Math.max(window.innerHeight * 0.75, 500)); }
    if (e.key === "ArrowDown") { e.preventDefault(); scrollByAmount(Math.max(window.innerHeight * 0.75, 500)); }
    if (e.key === "Home") { e.preventDefault(); scrollToTop(); }
    if (e.key === "End") { e.preventDefault(); scrollToBottom(); }
  });
})();
