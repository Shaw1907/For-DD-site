(() => {
  const RESPONSIVE_CONTROLLER_VERSION = "responsive-controller.20260614-v1";
  const root = document.documentElement;
  const breakpointMap = [
    { name: "mobile", max: 680 },
    { name: "tablet", max: 1024 },
    { name: "desktop", max: 1440 },
    { name: "wide", max: Infinity }
  ];

  function getViewportWidth() {
    return window.innerWidth || root.clientWidth || 0;
  }

  function getBreakpoint(width) {
    return breakpointMap.find((breakpoint) => width <= breakpoint.max)?.name || "wide";
  }

  function getInputMode() {
    const hasCoarse = window.matchMedia?.("(pointer: coarse)")?.matches || false;
    const hasFine = window.matchMedia?.("(pointer: fine)")?.matches || false;
    const canHover = window.matchMedia?.("(hover: hover)")?.matches || false;

    if (hasCoarse && hasFine) return "hybrid";
    if (hasCoarse) return "touch";
    if (hasFine && canHover) return "mouse";
    return "unknown";
  }

  function getOrientation() {
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  function syncResponsiveState() {
    const width = getViewportWidth();
    const breakpoint = getBreakpoint(width);
    const input = getInputMode();
    const orientation = getOrientation();

    root.dataset.breakpoint = breakpoint;
    root.dataset.input = input;
    root.dataset.orientation = orientation;
    root.style.setProperty("--viewport-height", `${window.innerHeight}px`);

    document.body?.classList.toggle("is-touch-device", input === "touch" || input === "hybrid");
    document.body?.classList.toggle("is-mouse-device", input === "mouse");

    window.dispatchEvent(new CustomEvent("dd:responsive-change", {
      detail: {
        version: RESPONSIVE_CONTROLLER_VERSION,
        breakpoint,
        input,
        orientation,
        width,
        height: window.innerHeight
      }
    }));
  }

  console.info(`[site] ${RESPONSIVE_CONTROLLER_VERSION}`);
  syncResponsiveState();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncResponsiveState, { once: true });
  }

  window.addEventListener("resize", syncResponsiveState, { passive: true });
  window.addEventListener("orientationchange", syncResponsiveState, { passive: true });

  window.DDResponsive = {
    version: RESPONSIVE_CONTROLLER_VERSION,
    sync: syncResponsiveState,
    get breakpoint() {
      return root.dataset.breakpoint;
    },
    get input() {
      return root.dataset.input;
    },
    get orientation() {
      return root.dataset.orientation;
    }
  };
})();
