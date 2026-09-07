const MEMORY_WALL_VERSION = "memory-wall.20260906-v3";
console.info(`[site] ${MEMORY_WALL_VERSION}`);

(function initMemoryWall() {
  const IMAGE_COUNT = 88;
  const IMAGE_BASE = "media/memory";

  const REPEL_RADIUS = 360;
  const REPEL_STRENGTH = 220;
  // Enlarge selected tile via width/height (not CSS scale) so JPEG re-samples sharp.
  // Other tiles stay transform-only for repel motion / FPS.
  const SELECT_SCALE = 2.6;
  const SELECT_SCALE_MOBILE = 1.85;
  const LERP = 0.28;
  const GAP = 6;
  const MOVE_EPS = 0.12;
  const SCALE_EPS = 0.003;

  const wall = document.querySelector("#memoryWall");
  if (!wall) return;

  const aspectCache = new Array(IMAGE_COUNT).fill(1);
  const tiles = [];
  let cols = 0;
  let colW = 56;
  let gap = GAP;
  let selected = null;
  let prevSelected = null;
  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let rafId = 0;
  let buildToken = 0;
  let wallRect = null;
  let fpsFrames = 0;
  let fpsLast = performance.now();
  let lastFps = 0;

  function isMobileWidth(width = window.innerWidth) {
    return width < 680;
  }

  function imageSrc(index) {
    return `${IMAGE_BASE}/m-${String((index % IMAGE_COUNT) + 1).padStart(3, "0")}.jpg`;
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function loadAspects() {
    const jobs = Array.from({ length: IMAGE_COUNT }, (_, index) => new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        aspectCache[index] = img.naturalWidth > 0
          ? img.naturalHeight / img.naturalWidth
          : 1;
        resolve();
      };
      img.onerror = () => {
        aspectCache[index] = 1;
        resolve();
      };
      img.src = imageSrc(index);
    }));
    return Promise.all(jobs);
  }

  function viewportSize() {
    const section = wall.parentElement;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 54;
    const vv = window.visualViewport;
    const viewH = Math.round(vv?.height || window.innerHeight);
    const viewW = Math.round(vv?.width || window.innerWidth);

    const width = Math.max(
      280,
      wall.clientWidth || section?.clientWidth || viewW
    );
    const height = Math.max(
      320,
      section?.clientHeight || 0,
      wall.clientHeight || 0,
      viewH - header
    );

    return { width, height };
  }

  function measureColumns() {
    const { width, height } = viewportSize();
    const mobile = isMobileWidth(width);
    gap = mobile ? 4 : GAP;
    const targetCol = mobile
      ? Math.max(58, Math.min(78, width / 5.1))
      : width < 1100
        ? 48
        : width < 1500
          ? 56
          : 62;
    const minCols = mobile ? 5 : 8;
    cols = Math.max(minCols, Math.floor((width + gap) / (targetCol + gap)));
    if (mobile) cols = Math.min(Math.max(cols, 5), 6);
    colW = (width - gap * (cols - 1)) / cols;
    wall.style.width = "100%";
    wall.style.height = `${height}px`;
    return { width, height };
  }

  function nextImageStream() {
    let pool = shuffle(Array.from({ length: IMAGE_COUNT }, (_, index) => index));
    let cursor = 0;
    return () => {
      if (cursor >= pool.length) {
        pool = shuffle(Array.from({ length: IMAGE_COUNT }, (_, index) => index));
        cursor = 0;
      }
      const value = pool[cursor];
      cursor += 1;
      return value;
    };
  }

  function tileAtPointer(x, y) {
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < tiles.length; i += 1) {
      const tile = tiles[i];
      if (
        x < tile.baseX ||
        x > tile.baseX + tile.w ||
        y < tile.baseY ||
        y > tile.baseY + tile.h
      ) {
        continue;
      }
      const cx = tile.baseX + tile.w * 0.5;
      const cy = tile.baseY + tile.h * 0.5;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = tile;
      }
    }

    return best;
  }

  function buildMasonry() {
    const token = ++buildToken;
    const { width, height } = measureColumns();
    if (width < 40 || height < 40) return;

    wall.querySelectorAll(".memory-tile").forEach((node) => node.remove());
    tiles.length = 0;
    selected = null;
    prevSelected = null;

    const colHeights = Array.from({ length: cols }, () => 0);
    const takeImage = nextImageStream();
    // Cap DOM nodes — previous mobile fill (~200+) was a major FPS killer.
    const maxItems = cols * (isMobileWidth(width) ? 22 : 40);
    let placed = 0;

    while (placed < maxItems) {
      const shortest = colHeights.indexOf(Math.min(...colHeights));
      if (colHeights[shortest] >= height) break;

      const imageIndex = takeImage();
      const aspect = aspectCache[imageIndex] || 1;
      const tileH = Math.max(isMobileWidth(width) ? 48 : 28, colW * aspect);

      if (colHeights[shortest] > 0 && colHeights[shortest] + tileH > height + tileH * 0.35) {
        colHeights[shortest] = height;
        if (colHeights.every((value) => value >= height)) break;
        continue;
      }

      const x = shortest * (colW + gap);
      const y = colHeights[shortest];

      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-tile";
      button.tabIndex = -1;
      button.style.width = `${colW}px`;
      button.style.height = `${tileH}px`;
      button.setAttribute("aria-label", `Memory photo ${placed + 1}`);

      const img = document.createElement("img");
      img.src = imageSrc(imageIndex);
      img.alt = "";
      img.loading = placed < 24 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;
      button.appendChild(img);

      const tile = {
        el: button,
        img,
        col: shortest,
        w: colW,
        h: tileH,
        baseX: x,
        baseY: y,
        x,
        y,
        scale: 1,
        targetX: x,
        targetY: y,
        targetScale: 1,
        lastX: x,
        lastY: y,
        lastScale: 1,
        lastLaidOutScale: 1,
        active: false,
      };

      wall.appendChild(button);
      tiles.push(tile);
      button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;

      colHeights[shortest] += tileH + gap;
      placed += 1;
    }

    wallRect = wall.getBoundingClientRect();
    if (token !== buildToken) return;
  }

  function selectScale() {
    return isMobileWidth() ? SELECT_SCALE_MOBILE : SELECT_SCALE;
  }

  function updateTargets() {
    const mobile = isMobileWidth();
    const repelRadius = mobile ? REPEL_RADIUS * 0.5 : REPEL_RADIUS;
    const repelStrength = mobile ? REPEL_STRENGTH * 0.65 : REPEL_STRENGTH;
    const hasSelection = hasPointer && selected;
    const originX = hasSelection ? selected.baseX + selected.w * 0.5 : 0;
    const originY = hasSelection ? selected.baseY + selected.h * 0.5 : 0;
    const scale = selectScale();

    for (let i = 0; i < tiles.length; i += 1) {
      const tile = tiles[i];
      const isSelected = hasSelection && selected === tile;
      let offsetX = 0;
      let offsetY = 0;

      if (hasSelection && !isSelected) {
        const centerX = tile.baseX + tile.w * 0.5;
        const centerY = tile.baseY + tile.h * 0.5;
        const dx = centerX - originX;
        const dy = centerY - originY;
        const dist = Math.hypot(dx, dy) || 0.0001;
        if (dist < repelRadius) {
          const t = 1 - dist / repelRadius;
          const ease = t * t * (3 - 2 * t);
          const force = ease * repelStrength;
          offsetX = (dx / dist) * force;
          offsetY = (dy / dist) * force;
        }
      }

      tile.targetX = tile.baseX + offsetX;
      tile.targetY = tile.baseY + offsetY;
      tile.targetScale = isSelected ? scale : 1;

      if (tile.active !== isSelected) {
        tile.active = isSelected;
        tile.el.classList.toggle("is-active", isSelected);
      }
    }
  }

  function tick(now) {
    updateTargets();
    let moving = false;

    for (let i = 0; i < tiles.length; i += 1) {
      const tile = tiles[i];
      tile.x += (tile.targetX - tile.x) * LERP;
      tile.y += (tile.targetY - tile.y) * LERP;
      tile.scale += (tile.targetScale - tile.scale) * LERP;

      const dx = tile.targetX - tile.x;
      const dy = tile.targetY - tile.y;
      const ds = tile.targetScale - tile.scale;
      if (Math.abs(dx) > MOVE_EPS || Math.abs(dy) > MOVE_EPS || Math.abs(ds) > SCALE_EPS) {
        moving = true;
      }

      // Skip style writes when visually unchanged (big win on mobile).
      if (
        Math.abs(tile.x - tile.lastX) < 0.05 &&
        Math.abs(tile.y - tile.lastY) < 0.05 &&
        Math.abs(tile.scale - tile.lastScale) < 0.001 &&
        selected === prevSelected
      ) {
        continue;
      }

      tile.lastX = tile.x;
      tile.lastY = tile.y;
      tile.lastScale = tile.scale;
      tile.el.style.zIndex = tile.active ? "12" : "";

      // Selected (or still shrinking): grow the layout box so the img re-decodes sharp.
      // Idle tiles: keep base size + translate only (no CSS scale blur).
      const s = tile.scale;
      if (s > 1.002) {
        const dw = tile.w * s;
        const dh = tile.h * s;
        const cx = tile.x + tile.w * 0.5;
        const cy = tile.y + tile.h * 0.5;
        tile.el.style.width = `${dw.toFixed(2)}px`;
        tile.el.style.height = `${dh.toFixed(2)}px`;
        tile.el.style.transform =
          `translate3d(${(cx - dw * 0.5).toFixed(2)}px, ${(cy - dh * 0.5).toFixed(2)}px, 0)`;
        tile.lastLaidOutScale = s;
      } else {
        if (tile.lastLaidOutScale !== 1) {
          tile.el.style.width = `${tile.w}px`;
          tile.el.style.height = `${tile.h}px`;
          tile.lastLaidOutScale = 1;
        }
        tile.el.style.transform =
          `translate3d(${tile.x.toFixed(2)}px, ${tile.y.toFixed(2)}px, 0)`;
      }
    }

    prevSelected = selected;

    fpsFrames += 1;
    if (now - fpsLast >= 1000) {
      lastFps = fpsFrames;
      fpsFrames = 0;
      fpsLast = now;
      wall.dataset.fps = String(lastFps);
    }

    if (moving || hasPointer) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
      wall.dataset.fps = String(lastFps || 60);
    }
  }

  function ensureTick() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  let pointerMoveQueued = false;
  let pendingPointerEvent = null;

  function flushPointer() {
    pointerMoveQueued = false;
    const event = pendingPointerEvent;
    pendingPointerEvent = null;
    if (!event) return;
    if (!wallRect) wallRect = wall.getBoundingClientRect();
    pointerX = event.clientX - wallRect.left;
    pointerY = event.clientY - wallRect.top;
    hasPointer = true;
    selected = tileAtPointer(pointerX, pointerY);
    ensureTick();
  }

  function syncPointer(event) {
    pendingPointerEvent = event;
    if (event.type === "pointerdown") {
      wallRect = wall.getBoundingClientRect();
      flushPointer();
      return;
    }
    if (!pointerMoveQueued) {
      pointerMoveQueued = true;
      requestAnimationFrame(flushPointer);
    }
  }

  function onPointerLeave() {
    hasPointer = false;
    selected = null;
    pendingPointerEvent = null;
    ensureTick();
  }

  let resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      wallRect = null;
      buildMasonry();
      ensureTick();
    }, 160);
  }

  wall.addEventListener("pointerdown", syncPointer, { passive: true });
  wall.addEventListener("pointermove", syncPointer, { passive: true });
  wall.addEventListener("pointerleave", onPointerLeave);
  wall.addEventListener("pointercancel", onPointerLeave);
  window.addEventListener("resize", onResize);
  window.visualViewport?.addEventListener("resize", onResize);

  function start() {
    buildMasonry();
    ensureTick();
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        buildMasonry();
        ensureTick();
      }, 80);
    });
  }

  loadAspects().then(start);

  // Expose for quick console checks: document.querySelector('#memoryWall').dataset.fps
  Object.defineProperty(window, "traceWallFps", {
    get() {
      return lastFps;
    },
    configurable: true,
  });
})();
