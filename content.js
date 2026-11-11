(() => {
  "use strict";
  if (window.__chatGPTSmoothScrollLoaded) return;
  window.__chatGPTSmoothScrollLoaded = true;

  let activeScroller = null;
  let holdScrollInterval = null;
  let clickTimeout = null;
  let isHolding = false;
  let scrollThrottleTimeout = null;

  function isScrollable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const style = getComputedStyle(el);
    return (style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay") && el.scrollHeight > el.clientHeight + 10;
  }

  function findScroller() {
    const modernThread = document.querySelector(".thread-scroll-container");
    if (modernThread && isScrollable(modernThread)) return modernThread;

    const mainView = document.querySelector("main div.overflow-y-auto");
    if (mainView && isScrollable(mainView)) return mainView;

    const candidates = [...document.querySelectorAll("main div, section div")].filter(isScrollable);
    return candidates[0] || document.documentElement;
  }

  // Safe wrapper that manages event listeners cleanly without leaks
  function getScroller() {
    const current = findScroller();
    if (activeScroller !== current) {
      if (activeScroller) {
        activeScroller.removeEventListener("scroll", handleScrollThrottled);
      }
      activeScroller = current;
      if (activeScroller && activeScroller !== document.documentElement) {
        activeScroller.addEventListener("scroll", handleScrollThrottled, { passive: true });
      }
    }
    return activeScroller;
  }

  function updateButtonVisibility() {
    const scroller = getScroller();
    if (!scroller) return;

    const btnTop = document.getElementById("cgpt-top");
    const btnBottom = document.getElementById("cgpt-bottom");
    if (!btnTop || !btnBottom) return;

    const currentScroll = scroller.scrollTop;
    const maxScroll = scroller.scrollHeight - scroller.clientHeight;

    if (currentScroll <= 40) {
      btnTop.classList.add("disabled");
      btnTop.style.pointerEvents = "none";
    } else {
      btnTop.classList.remove("disabled");
      btnTop.style.pointerEvents = "auto";
    }

    if (currentScroll >= maxScroll - 40) {
      btnBottom.classList.add("disabled");
      btnBottom.style.pointerEvents = "none";
    } else {
      btnBottom.classList.remove("disabled");
      btnBottom.style.pointerEvents = "auto";
    }
  }

  function handleScrollThrottled() {
    if (!scrollThrottleTimeout) {
      scrollThrottleTimeout = setTimeout(() => {
        updateButtonVisibility();
        scrollThrottleTimeout = null;
      }, 150); // Increased slightly for optimal UI performance
    }
  }

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

  function simulateDragScroll(targetPosition) {
    const scroller = getScroller();
    if (!scroller) return;

    const originalAnchor = scroller.style.overflowAnchor;
    scroller.style.overflowAnchor = "none";

    let currentTick = 0;
    const totalTicks = 8;
    const startTop = scroller.scrollTop;
    const distance = targetPosition - startTop;

    const dragInterval = setInterval(() => {
      currentTick++;
      const progress = currentTick / totalTicks;
      scroller.scrollTop = startTop + distance * (1 - Math.pow(1 - progress, 3));

      if (currentTick >= totalTicks) {
        clearInterval(dragInterval);
        scroller.scrollTop = targetPosition;
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
        startContinuousScroll(14 * directionMultiplier);
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
    if (document.getElementById("cgpt-smooth-scroll")) {
      updateButtonVisibility();
      return;
    }
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
    getScroller();
    updateButtonVisibility();
  }

  // Run initial build cleanly
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }

  // Performance-focused low impact observer
  let mutationTimeout = null;
  const observer = new MutationObserver(() => {
    if (mutationTimeout) return;
    mutationTimeout = setTimeout(() => {
      createUI();
      mutationTimeout = null;
    }, 500); // Only process changes at most once every half second
  });
  observer.observe(document.body, { childList: true, subtree: false });

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
