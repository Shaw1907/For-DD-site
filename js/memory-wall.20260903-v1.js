const MEMORY_WALL_VERSION = "memory-wall.20260903-v7";
console.info(`[site] ${MEMORY_WALL_VERSION}`);

(function initMemoryWall() {
  const IMAGE_COUNT = 88;
  const IMAGE_BASE = "media/memory";

  const REPEL_RADIUS = 360;
  const REPEL_STRENGTH = 220;
  const SELECT_SCALE = 3;
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
    const width = wall.clientWidth || window.innerWidth;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 54;
    const height = Math.max(280, window.innerHeight - header);
    return { width, height };
  }

  function measureColumns() {
    const { width, height } = viewportSize();
    gap = width < 680 ? 4 : GAP;
    // About half the previous Pinterest card size.
    const targetCol = width < 680 ? 36 : width < 1100 ? 48 : width < 1500 ? 56 : 62;
    cols = Math.max(8, Math.floor((width + gap) / (targetCol + gap)));
    colW = (width - gap * (cols - 1)) / cols;
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
    const { height } = measureColumns();

    wall.querySelectorAll(".memory-tile").forEach((node) => node.remove());
    tiles.length = 0;
    selected = null;

    const colHeights = Array.from({ length: cols }, () => 0);
    const takeImage = nextImageStream();
    const maxItems = cols * 60;
    let placed = 0;

    while (placed < maxItems) {
      const shortest = colHeights.indexOf(Math.min(...colHeights));
      if (colHeights[shortest] >= height) break;

      const imageIndex = takeImage();
      const aspect = aspectCache[imageIndex] || 1;
      const tileH = Math.max(28, colW * aspect);

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
      img.loading = "lazy";
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

  function updateTargets() {
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
        } else if (dist < REPEL_RADIUS) {
          const t = 1 - dist / REPEL_RADIUS;
          const ease = t * t * (3 - 2 * t);
          const force = ease * REPEL_STRENGTH;
          offsetX = (dx / dist) * force;
          offsetY = (dy / dist) * force;
        }
      }

      tile.targetX = tile.baseX + offsetX;
      tile.targetY = tile.baseY + offsetY;
      tile.targetScale = isSelected ? SELECT_SCALE : 1;
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

  function onPointerMove(event) {
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

  wall.addEventListener("pointermove", onPointerMove, { passive: true });
  wall.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", onResize);

  loadAspects().then(() => {
    buildMasonry();
    ensureTick();
  });
})();
