const MEMORY_WALL_VERSION = "memory-wall.20260903-v8";
console.info(`[site] ${MEMORY_WALL_VERSION}`);

(function initMemoryWall() {
  const IMAGE_COUNT = 88;
  const IMAGE_BASE = "media/memory";

  const REPEL_RADIUS = 360;
  const REPEL_STRENGTH = 220;
  const SELECT_SCALE = 3;
  const SELECT_SCALE_MOBILE = 2.2;
  const LERP = 0.22;
  const GAP = 6;

  const wall = document.querySelector("#memoryWall");
  if (!wall) return;

  const aspectCache = new Array(IMAGE_COUNT).fill(1);
  const tiles = [];
  let cols = 0;
  let colW = 56;
  let gap = GAP;
  let selected = null;
  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let rafId = 0;
  let buildToken = 0;

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
    gap = mobile ? 5 : GAP;
    // Mobile: fewer, larger tiles so photos remain visible on small screens.
    const targetCol = mobile
      ? Math.max(96, Math.min(132, width / 3.15))
      : width < 1100
        ? 48
        : width < 1500
          ? 56
          : 62;
    const minCols = mobile ? 3 : 8;
    cols = Math.max(minCols, Math.floor((width + gap) / (targetCol + gap)));
    if (mobile) cols = Math.min(cols, 4);
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

    tiles.forEach((tile) => {
      const inside =
        x >= tile.baseX &&
        x <= tile.baseX + tile.w &&
        y >= tile.baseY &&
        y <= tile.baseY + tile.h;

      if (inside) {
        const cx = tile.baseX + tile.w / 2;
        const cy = tile.baseY + tile.h / 2;
        const dist = Math.hypot(cx - x, cy - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = tile;
        }
      }
    });

    return best;
  }

  function buildMasonry() {
    const token = ++buildToken;
    const { width, height } = measureColumns();
    if (width < 40 || height < 40) return;

    wall.querySelectorAll(".memory-tile").forEach((node) => node.remove());
    tiles.length = 0;
    selected = null;

    const colHeights = Array.from({ length: cols }, () => 0);
    const takeImage = nextImageStream();
    const maxItems = cols * (isMobileWidth(width) ? 36 : 60);
    let placed = 0;

    while (placed < maxItems) {
      const shortest = colHeights.indexOf(Math.min(...colHeights));
      if (colHeights[shortest] >= height) break;

      const imageIndex = takeImage();
      const aspect = aspectCache[imageIndex] || 1;
      const tileH = Math.max(isMobileWidth(width) ? 72 : 28, colW * aspect);

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
      img.loading = "eager";
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
      };

      wall.appendChild(button);
      tiles.push(tile);
      button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;

      colHeights[shortest] += tileH + gap;
      placed += 1;
    }

    if (token !== buildToken) return;
  }

  function selectScale() {
    return isMobileWidth() ? SELECT_SCALE_MOBILE : SELECT_SCALE;
  }

  function updateTargets() {
    const repelRadius = isMobileWidth() ? REPEL_RADIUS * 0.72 : REPEL_RADIUS;
    const repelStrength = isMobileWidth() ? REPEL_STRENGTH * 0.85 : REPEL_STRENGTH;

    tiles.forEach((tile) => {
      const centerX = tile.baseX + tile.w / 2;
      const centerY = tile.baseY + tile.h / 2;
      let offsetX = 0;
      let offsetY = 0;
      const isSelected = hasPointer && selected === tile;

      if (hasPointer && selected) {
        const originX = selected.baseX + selected.w / 2;
        const originY = selected.baseY + selected.h / 2;
        const dx = centerX - originX;
        const dy = centerY - originY;
        const dist = Math.hypot(dx, dy) || 0.0001;

        if (isSelected) {
          offsetX = 0;
          offsetY = 0;
        } else if (dist < repelRadius) {
          const t = 1 - dist / repelRadius;
          const ease = t * t * (3 - 2 * t);
          const force = ease * repelStrength;
          offsetX = (dx / dist) * force;
          offsetY = (dy / dist) * force;
        }
      }

      tile.targetX = tile.baseX + offsetX;
      tile.targetY = tile.baseY + offsetY;
      tile.targetScale = isSelected ? selectScale() : 1;
      tile.el.classList.toggle("is-active", isSelected);
    });
  }

  function tick() {
    updateTargets();
    let moving = false;

    tiles.forEach((tile) => {
      tile.x += (tile.targetX - tile.x) * LERP;
      tile.y += (tile.targetY - tile.y) * LERP;
      tile.scale += (tile.targetScale - tile.scale) * LERP;

      if (
        Math.abs(tile.targetX - tile.x) > 0.08 ||
        Math.abs(tile.targetY - tile.y) > 0.08 ||
        Math.abs(tile.targetScale - tile.scale) > 0.002
      ) {
        moving = true;
      }

      tile.el.style.zIndex = selected === tile && hasPointer ? "12" : "1";
      tile.el.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0) scale(${tile.scale})`;
    });

    if (moving || hasPointer) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }

  function ensureTick() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function syncPointer(event) {
    const rect = wall.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    hasPointer = true;
    selected = tileAtPointer(pointerX, pointerY);
    ensureTick();
  }

  function onPointerLeave() {
    hasPointer = false;
    selected = null;
    ensureTick();
  }

  let resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      buildMasonry();
      ensureTick();
    }, 140);
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
    // Second pass after layout settles (iOS address bar / late width).
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        buildMasonry();
        ensureTick();
      }, 80);
    });
  }

  loadAspects().then(start);
})();
