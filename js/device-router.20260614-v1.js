(() => {
  const ROUTER_VERSION = "device-router.20260614-v1";
  const DESKTOP_PAGE = "index.html";
  const MOBILE_PAGE = "mobile.html";
  const AMBIGUOUS_BAND_MIN = 761;
  const AMBIGUOUS_BAND_MAX = 1023;

  function getCurrentPage() {
    const page = window.location.pathname.split("/").pop();
    return page || DESKTOP_PAGE;
  }

  function getQueryPreference() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    return view === "mobile" || view === "desktop" ? view : null;
  }

  function getDeviceProfile() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const screenWidth = window.screen?.width || viewportWidth;
    const shortestWidth = Math.min(viewportWidth, screenWidth || viewportWidth);
    const userAgent = navigator.userAgent || "";
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || false;
    const finePointer = window.matchMedia?.("(pointer: fine)")?.matches || false;
    const hover = window.matchMedia?.("(hover: hover)")?.matches || false;
    const mobileUA = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(userAgent);
    const tabletUA = /iPad|Tablet|Silk/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    return {
      viewportWidth,
      shortestWidth,
      coarsePointer,
      finePointer,
      hover,
      mobileUA,
      tabletUA,
      isClearlyMobile:
        (shortestWidth <= 700 && coarsePointer) ||
        (shortestWidth <= 760 && mobileUA) ||
        (shortestWidth <= 480),
      isClearlyDesktop:
        viewportWidth >= 1024 &&
        finePointer &&
        hover &&
        !mobileUA &&
        !tabletUA,
      isAmbiguous:
        viewportWidth >= AMBIGUOUS_BAND_MIN &&
        viewportWidth <= AMBIGUOUS_BAND_MAX
    };
  }

  function buildTargetUrl(targetPage) {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split("/");
    pathParts[pathParts.length - 1] = targetPage;
    url.pathname = pathParts.join("/");
    return url.toString();
  }

  function routeTo(targetPage) {
    if (getCurrentPage() === targetPage) return;
    window.location.replace(buildTargetUrl(targetPage));
  }

  const currentPage = getCurrentPage();
  const preference = getQueryPreference();
  const profile = getDeviceProfile();

  console.info(`[site] ${ROUTER_VERSION}`, {
    page: currentPage,
    preference,
    viewportWidth: profile.viewportWidth,
    shortestWidth: profile.shortestWidth,
    coarsePointer: profile.coarsePointer,
    finePointer: profile.finePointer,
    mobileUA: profile.mobileUA,
    tabletUA: profile.tabletUA
  });

  if (preference === "mobile") {
    routeTo(MOBILE_PAGE);
    return;
  }

  if (preference === "desktop") {
    routeTo(DESKTOP_PAGE);
    return;
  }

  if (currentPage === DESKTOP_PAGE && profile.isClearlyMobile) {
    routeTo(MOBILE_PAGE);
    return;
  }

  if (currentPage === MOBILE_PAGE && profile.isClearlyDesktop && !profile.isAmbiguous) {
    routeTo(DESKTOP_PAGE);
  }
})();
