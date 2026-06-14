const NETWORK_SCRIPT_VERSION = "network.20260614-v20";
console.info(`[site] ${NETWORK_SCRIPT_VERSION}`);

const canvas = document.querySelector("#networkCanvas");
const statusLabel = document.querySelector("#networkStatus");
const profilePanel = document.querySelector("#profilePanel");
const profileTitle = document.querySelector("#profilePanelTitle");
const profileSummary = document.querySelector("#profilePanelSummary");
const profileMedia = document.querySelector(".profile-media-wall span");
const profileCloseButtons = document.querySelectorAll("[data-profile-close]");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const names = [
    "Darren Lau",
    "Annie Liu",
    "Jiwon Kang",
    "Xiangyu Xu",
    "Rishab Sharma",
    "Yunhao Lei",
    "Li Chengyu",
    "Yingping Zhu",
    "Angela (Amra) Anderson",
    "Palasa Bomble",
    "Lakshmi Vidyasagar",
    "Yanchen Zheng",
    "Changyang Fu",
    "Zishan Ding",
    "Xiaoyao Ma",
    "Chendi Wu",
    "Jiayu (Gia) Liu",
    "Suying Li",
    "Maryam Khadem Azghadi",
    "Roman Kissling",
    "Yuqin (Shaw) Xiao",
    "Bingqing Ye",
    "Xinyang Pan",
    "Marta Ilacqua",
    "Akwetey Orraca-Tetteh",
    "Yu Sang",
    "Ran Yi",
    "Yixuan Sun",
    "Qiyu Shang",
    "Siran Liu",
    "Qifu Xu",
    "Yukai Liu",
    "Huilan Ma",
    "Ran Ji",
    "Wensheng Qi",
    "Fangdi (Andy) Liu",
    "Chuyi Lin",
    "Jacob (Deyu) Zeng",
    "Min Chi Chiu",
    "Zijun Su",
    "Shi Chen",
    "Jiaye (Yolanda) Li",
    "Raghav Kapoor",
    "Zimu Zhang",
    "Jingyu Luo",
    "Chen Chao",
    "Peirong Fan",
    "Julia Halasy",
    "Yalin Sheng",
    "Jiayu Shi",
    "Wing See Wincy Cheng",
    "Yuancheng Lin",
    "Hang Lan",
    "Chuhao Chen",
    "Yongqi Ai",
    "Jiayun Long",
    "Emma Rose Harvey",
    "Jianing Sheng",
    "Niu Yang",
    "Yingxin Liang",
    "Jiayi Yang",
    "Hongyang Lu",
    "Beinan Zhang",
    "Kairan Xu",
    "Yilin Chen",
    "Xinling Shi",
    "Baotakuzi Wulaer",
    "Gyuri Kim",
    "Yuxiao Zhou",
    "Ana Vigil Escalera Carriles",
    "Ke Ma",
    "Jiaxuan Li"
  ];

  const purple = {
    node: "rgba(168, 38, 255, 1)",
    line: "rgba(176, 38, 255,",
    text: "rgba(221, 190, 255, 1)",
    glow: "rgba(176, 38, 255, 0.92)"
  };

  const pointer = { x: -9999, y: -9999, active: false };
  const drag = {
    node: null,
    active: false,
    startPointerX: 0,
    startPointerY: 0,
    startNodeX: 0,
    startNodeY: 0,
    x: 0,
    y: 0
  };
  let nodes = [];
  let activeNode = null;
  let previousActiveNode = null;
  let activeStartedAt = 0;
  let currentMorphAmount = 0;
  let dpr = 1;

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function next() {
      value += 0x6d2b79f5;
      let result = Math.imul(value ^ (value >>> 15), 1 | value);
      result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function slugifyName(name) {
    return name
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function easeInOut(value) {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function isPhoneLayout(canvasWidth = window.innerWidth) {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || canvasWidth;
    const screenShortestSide = Math.min(
      window.screen?.width || viewportWidth,
      window.screen?.height || viewportWidth
    );
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || false;
    const touchPoints = navigator.maxTouchPoints || 0;
    const mobileUA = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(navigator.userAgent || "");

    return (
      viewportWidth <= 760 ||
      (canvasWidth <= 760 && (coarsePointer || touchPoints > 0)) ||
      (screenShortestSide <= 760 && (coarsePointer || touchPoints > 0)) ||
      mobileUA
    );
  }

  function getMorphAmount(time) {
    const phase = time % 23000;
    if (phase < 7600) return 0;
    if (phase < 12000) return easeInOut((phase - 7600) / 4400);
    if (phase < 18600) return 1;
    return 1 - easeInOut((phase - 18600) / 4400);
  }

  function placeOnSegment(segment, t, metrics) {
    const { left, top, width, height } = metrics;
    const isPhone = metrics.isPhone;
    const bottom = top + height;
    const centerY = top + height / 2;
    const outerShoulder = isPhone ? 0.64 : 0.58;
    const outerRadiusX = isPhone ? 0.46 : 0.42;
    const innerX = isPhone ? 0.46 : 0.42;
    const innerRadiusX = isPhone ? 0.2 : 0.25;
    const innerRadiusY = isPhone ? 0.2 : 0.23;

    if (segment === "outer-left") {
      return { x: left, y: top + t * height, side: "left" };
    }

    if (segment === "outer-top") {
      return { x: left + t * width * outerShoulder, y: top, side: "top" };
    }

    if (segment === "outer-arc") {
      const angle = -Math.PI / 2 + t * Math.PI;
      return {
        x: left + width * outerShoulder + Math.cos(angle) * width * outerRadiusX,
        y: centerY + Math.sin(angle) * height * 0.5,
        side: "right"
      };
    }

    if (segment === "outer-bottom") {
      return { x: left + width * outerShoulder - t * width * outerShoulder, y: bottom, side: "bottom" };
    }

    if (segment === "inner-left") {
      return {
        x: left + width * innerX,
        y: top + height * 0.29 + t * height * 0.42,
        side: "inner"
      };
    }

    const angle = -Math.PI / 2 + t * Math.PI;
    return {
      x: left + width * innerX + Math.cos(angle) * width * innerRadiusX,
      y: centerY + Math.sin(angle) * height * innerRadiusY,
      side: "inner"
    };
  }

  function getDDTarget(index, total, width, height, name) {
    const half = Math.ceil(total / 2);
    const letterIndex = index < half ? 0 : 1;
    const localIndex = letterIndex === 0 ? index : index - half;
    const localCount = letterIndex === 0 ? half : total - half;
    const random = seededRandom(hashString(`${name}-dd-target`));
    const isPhone = isPhoneLayout(width);
    const headerSafeTop = isPhone ? 76 : 78;
    const bottomSafe = isPhone ? 86 : 30;
    const letterGap = Math.min(width * (isPhone ? 0.08 : 0.07), isPhone ? 34 : 118);
    const targetRatio = isPhone ? 1.28 : 1.42;
    let letterWidth;
    let letterHeight;
    let leftEdge;
    let top;

    if (isPhone) {
      const availableHeight = Math.max(360, height - headerSafeTop - bottomSafe);
      letterWidth = Math.min(width * 0.62, 230);
      letterHeight = Math.min(letterWidth * targetRatio, (availableHeight - letterGap) / 2, 286);
      letterWidth = Math.min(letterWidth, letterHeight / targetRatio);
      leftEdge = width / 2 - letterWidth / 2;
      top = headerSafeTop + Math.max(18, (availableHeight - (letterHeight * 2 + letterGap)) / 2) + letterIndex * (letterHeight + letterGap);
    } else {
      const maxTotalWidth = width * 0.65;
      letterWidth = Math.min((maxTotalWidth - letterGap) / 2, 440);
      letterHeight = Math.min(letterWidth * targetRatio, height * 0.7, 610);
      const totalWidth = letterWidth * 2 + letterGap;
      leftEdge = width / 2 - totalWidth / 2 + letterIndex * (letterWidth + letterGap);
      top = Math.max(headerSafeTop + 22, height / 2 - letterHeight / 2 + 12);
    }
    const segments = [
      { name: "outer-left", weight: 0.28 },
      { name: "outer-top", weight: 0.1 },
      { name: "outer-arc", weight: 0.27 },
      { name: "outer-bottom", weight: 0.1 },
      { name: "inner-left", weight: 0.15 },
      { name: "inner-arc", weight: 0.1 }
    ];
    let cursor = 0;
    let segment = segments[segments.length - 1];
    let segmentStart = 0;
    let segmentEnd = 1;
    const ratio = localCount <= 1 ? 0 : localIndex / (localCount - 1);

    for (let i = 0; i < segments.length; i += 1) {
      const nextCursor = cursor + segments[i].weight;
      if (ratio <= nextCursor || i === segments.length - 1) {
        segment = segments[i];
        segmentStart = cursor;
        segmentEnd = nextCursor;
        break;
      }
      cursor = nextCursor;
    }

    const segmentT = (ratio - segmentStart) / Math.max(0.001, segmentEnd - segmentStart);
    const point = placeOnSegment(segment.name, Math.min(1, Math.max(0, segmentT)), {
      left: leftEdge,
      top,
      width: letterWidth,
      height: letterHeight,
      isPhone
    });

    return {
      x: point.x + (random() - 0.5) * 12,
      y: point.y + (random() - 0.5) * 12,
      order: localIndex,
      side: point.side
    };
  }

  function openProfilePanel(node) {
    if (!profilePanel) return;

    profileTitle.textContent = node.name;
    profileSummary.textContent = "A homepage-expanded space for related works, credits, films, images, and notes.";
    profileMedia.textContent = node.slug;
    profilePanel.hidden = false;
    requestAnimationFrame(() => {
      profilePanel.classList.add("is-open");
      document.body.classList.add("profile-open");
    });
  }

  function closeProfilePanel() {
    if (!profilePanel) return;

    profilePanel.classList.remove("is-open");
    document.body.classList.remove("profile-open");
    window.setTimeout(() => {
      if (!profilePanel.classList.contains("is-open")) {
        profilePanel.hidden = true;
      }
    }, 260);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createNodes(rect.width, rect.height);
  }

  function createNodes(width, height) {
    const isMobile = isPhoneLayout(width);
    const isCompact = window.innerWidth <= 480;
    const padX = Math.max(isCompact ? 24 : isMobile ? 36 : 52, width * (isCompact ? 0.06 : 0.045));
    const headerSafeTop = isMobile ? 72 : 78;
    const padTop = headerSafeTop;
    const padBottom = isMobile ? 88 : 30;
    const minDistance = isCompact ? 38 : width < 760 ? 50 : 84;

    nodes = names.map((name, index) => {
      const random = seededRandom(hashString(name));
      const x = padX + random() * Math.max(20, width - padX * 2);
      const y = padTop + random() * Math.max(20, height - padTop - padBottom);

      return {
        name,
        slug: slugifyName(name),
        x,
        y,
        baseX: x,
        baseY: y,
        scatterX: x,
        scatterY: y,
        ddX: x,
        ddY: y,
        ddLetterIndex: 0,
        ddOrder: 0,
        ddLabelSide: "auto",
        phase: random() * Math.PI * 2,
        radius: 1.8 + random() * 1.15,
        driftX: 5 + random() * 9,
        driftY: 4 + random() * 8,
        labelX: x + 10,
        labelWidth: 0,
        labelPriority: index,
        labelVisible: false,
        labelHoldUntil: 0
      };
    });

    for (let pass = 0; pass < 44; pass += 1) {
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.baseX - a.baseX;
          const dy = b.baseY - a.baseY;
          const distance = Math.max(0.1, Math.hypot(dx, dy));
          if (distance < minDistance) {
            const push = (minDistance - distance) * 0.18;
            const nx = dx / distance;
            const ny = dy / distance;
            a.baseX -= nx * push;
            a.baseY -= ny * push;
            b.baseX += nx * push;
            b.baseY += ny * push;
          }
        }
      }

      nodes.forEach((node) => {
        node.baseX = Math.min(width - padX, Math.max(padX, node.baseX));
        node.baseY = Math.min(height - padBottom, Math.max(padTop, node.baseY));
        node.scatterX = node.baseX;
        node.scatterY = node.baseY;
      });
    }

    nodes.forEach((node, index) => {
      const target = getDDTarget(index, nodes.length, width, height, node.name);
      node.ddX = target.x;
      node.ddY = target.y;
      node.ddLetterIndex = index < Math.ceil(nodes.length / 2) ? 0 : 1;
      node.ddOrder = target.order;
      node.ddLabelSide = target.side;
    });
  }

  function drawLine(a, b, alpha, isActive = false) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = isActive ? `${purple.line} ${alpha})` : `rgba(231, 240, 255, ${alpha})`;
    ctx.lineWidth = isActive ? 1.2 : 1.12;
    ctx.stroke();
  }

  function drawActiveGroupLines(active, time) {
    const maxDimension = Math.max(canvas.clientWidth, canvas.clientHeight);
    const elapsed = Math.max(0, time - activeStartedAt);
    const waveRadius = Math.min(maxDimension * 1.08, 64 + elapsed * 0.24);
    const edgeWidth = 190;
    const visibleNodes = nodes.filter((node) => {
      if (node === active) return false;
      return Math.hypot(node.x - active.x, node.y - active.y) < waveRadius;
    });

    ctx.save();
    visibleNodes.forEach((node) => {
      const distance = Math.hypot(node.x - active.x, node.y - active.y);
      const edgeFade = Math.min(1, Math.max(0, (waveRadius - distance) / edgeWidth));
      const distanceFade = Math.max(0.24, 1 - distance / maxDimension);
      const alpha = (0.035 + distanceFade * 0.12) * edgeFade;

      ctx.beginPath();
      ctx.moveTo(active.x, active.y);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = `rgba(176, 38, 255, ${alpha})`;
      ctx.lineWidth = 0.72;
      ctx.stroke();
    });

    for (let i = 0; i < visibleNodes.length; i += 1) {
      for (let j = i + 1; j < visibleNodes.length; j += 1) {
        const a = visibleNodes[i];
        const b = visibleNodes[j];
        const pairDistance = Math.hypot(a.x - b.x, a.y - b.y);
        const activeDistance = Math.max(
          Math.hypot(a.x - active.x, a.y - active.y),
          Math.hypot(b.x - active.x, b.y - active.y)
        );
        const pairThreshold = Math.min(canvas.clientWidth, 1280) * 0.16;

        if (pairDistance < pairThreshold && activeDistance < waveRadius) {
          const edgeFade = Math.min(1, Math.max(0, (waveRadius - activeDistance) / edgeWidth));
          const alpha = 0.045 * (1 - pairDistance / pairThreshold) * edgeFade;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(177, 161, 196, ${alpha})`;
          ctx.lineWidth = 0.58;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawActiveNodeGlow(node) {
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 44);
    gradient.addColorStop(0, "rgba(190, 74, 255, 0.52)");
    gradient.addColorStop(0.28, "rgba(168, 38, 255, 0.2)");
    gradient.addColorStop(1, "rgba(168, 38, 255, 0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(221, 190, 255, 0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDDInternalLines(morphAmount) {
    if (morphAmount < 0.22) return;

    const alphaScale = Math.min(1, (morphAmount - 0.22) / 0.58);
    const groups = [
      nodes.filter((node) => node.ddLetterIndex === 0),
      nodes.filter((node) => node.ddLetterIndex === 1)
    ];

    ctx.save();
    ctx.lineWidth = 0.68;
    groups.forEach((group, groupIndex) => {
      const ordered = [...group].sort((a, b) => a.ddOrder - b.ddOrder);

      for (let i = 0; i < ordered.length; i += 1) {
        const a = ordered[i];
        const b = ordered[(i + 1) % ordered.length];
        const c = ordered[(i + 2) % ordered.length];

        [b, c].forEach((target, targetIndex) => {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(232, 240, 255, ${(0.2 - targetIndex * 0.055) * alphaScale})`;
          ctx.lineWidth = targetIndex === 0 ? 1.28 : 0.9;
          ctx.stroke();
        });
      }

      ctx.lineWidth = 0.58;
      group.forEach((node, index) => {
        const seed = hashString(`${node.name}-internal-lines-${groupIndex}`);
        const offsets = [
          2 + (seed % 5),
          3 + (seed % 7),
          6 + ((seed >>> 2) % 8),
          9 + ((seed >>> 3) % 11),
          16 + ((seed >>> 7) % 13),
          23 + ((seed >>> 11) % 9),
          Math.floor(group.length * 0.42) + ((seed >>> 15) % 5),
          Math.floor(group.length * 0.68) + ((seed >>> 19) % 5)
        ];

        offsets.forEach((offset, offsetIndex) => {
          const target = group[(index + offset) % group.length];
          if (target === node) return;

          const distance = Math.hypot(node.x - target.x, node.y - target.y);
          const distanceFade = Math.max(0.22, 1 - distance / Math.max(canvas.clientWidth * 0.42, 280));
          const alpha = (0.04 + offsetIndex * 0.004 + distanceFade * 0.105) * alphaScale;

          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(231, 240, 255, ${alpha})`;
          ctx.stroke();
        });
      });
    });
    ctx.restore();
  }

  function getLabelSize(isActive, morphAmount = 0) {
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 420) return isActive ? 14.2 : Math.max(10.8, 11.8 - morphAmount * 0.35);
    if (viewportWidth <= 680) return isActive ? 15 : Math.max(11.2, 12.4 - morphAmount * 0.45);
    return isActive ? 13 : 10.8 - morphAmount * 0.55;
  }

  function labelsOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function getLabelRect(node, labelSize) {
    return {
      left: node.labelX - 3,
      right: node.labelX + node.labelWidth + 5,
      top: node.labelY - labelSize - 3,
      bottom: node.labelY + 5
    };
  }

  function placeReadableMobileLabel(node, occupiedRects, width, height, labelSize, isActive, time) {
    if (!isPhoneLayout(width)) return true;

    const originalX = node.labelX;
    const originalY = node.labelY;
    const offsets = isActive ? [0, -18, 18, -34, 34, -50, 50] : [0, -16, 16, -32, 32];

    for (let i = 0; i < offsets.length; i += 1) {
      node.labelX = Math.min(width - node.labelWidth - 8, Math.max(8, originalX));
      node.labelY = Math.min(height - 12, Math.max(86, originalY + offsets[i]));
      const rect = getLabelRect(node, labelSize);
      const overlaps = occupiedRects.some((occupied) => labelsOverlap(rect, occupied));

      if (!overlaps || isActive) {
        occupiedRects.push(rect);
        node.labelVisible = true;
        node.labelHoldUntil = time + 1200;
        return true;
      }

      if (node.labelVisible && time < node.labelHoldUntil) {
        occupiedRects.push(rect);
        return true;
      }
    }

    node.labelX = originalX;
    node.labelY = originalY;
    node.labelVisible = false;
    return false;
  }

  function updateLabelMetrics(node, width, isActive, morphAmount = 0) {
    const headerSafeTop = isPhoneLayout(width) ? 72 : 78;
    const labelSize = getLabelSize(isActive, morphAmount);
    ctx.font = `${labelSize}px Inter, system-ui, sans-serif`;
    node.labelWidth = ctx.measureText(node.name).width;

    if (morphAmount > 0.72 && !isActive) {
      if (node.ddLabelSide === "left") {
        node.labelX = Math.max(8, node.x - node.labelWidth - 16);
        node.labelY = Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4));
        return;
      }

      if (node.ddLabelSide === "right") {
        node.labelX = Math.min(width - node.labelWidth - 8, node.x + 16);
        node.labelY = Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4));
        return;
      }

      if (node.ddLabelSide === "top") {
        node.labelX = Math.min(width - node.labelWidth - 8, Math.max(8, node.x - node.labelWidth / 2));
        node.labelY = Math.max(headerSafeTop + 8, node.y - 14);
        return;
      }

      if (node.ddLabelSide === "bottom") {
        node.labelX = Math.min(width - node.labelWidth - 8, Math.max(8, node.x - node.labelWidth / 2));
        node.labelY = Math.min(window.innerHeight - 14, node.y + 22);
        return;
      }

      if (node.ddLabelSide === "inner") {
        node.labelX = Math.min(width - node.labelWidth - 8, node.x + 14);
        node.labelY = Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4));
        return;
      }
    }

    node.labelX = node.x + node.labelWidth + 16 > width ? node.x - node.labelWidth - 10 : node.x + 10;
    node.labelY = Math.max(headerSafeTop + 8, node.y + 4);
  }

  function nodeIsHit(node) {
    const nodeHit = Math.hypot(node.x - pointer.x, node.y - pointer.y) < 34;
    const labelHit =
      pointer.x >= node.labelX - 4 &&
      pointer.x <= node.labelX + node.labelWidth + 8 &&
      pointer.y >= node.labelY - 18 &&
      pointer.y <= node.labelY + 10;

    return nodeHit || labelHit;
  }

  function findActiveNode() {
    if (!pointer.active) return null;

    const directHit = nodes.find((node) => nodeIsHit(node));
    if (directHit) return directHit;

    let closest = null;
    let closestDistance = Infinity;
    nodes.forEach((node) => {
      const distance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = node;
      }
    });

    return closestDistance < 72 ? closest : null;
  }

  function draw(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const morphAmount = getMorphAmount(time);
    currentMorphAmount = morphAmount;
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((node) => {
      const targetX = node.scatterX + (node.ddX - node.scatterX) * morphAmount;
      const targetY = node.scatterY + (node.ddY - node.scatterY) * morphAmount;
      const driftScale = isPhoneLayout(width) ? 1 - morphAmount * 0.94 : 1 - morphAmount * 0.68;
      node.x = targetX + Math.sin(time * 0.00042 + node.phase) * node.driftX * driftScale;
      node.y = targetY + Math.cos(time * 0.00036 + node.phase) * node.driftY * driftScale;
      if (morphAmount < 0.18) {
        const headerSafeTop = isPhoneLayout(width) ? 72 : 78;
        node.y = Math.max(headerSafeTop, node.y);
      }
      if (drag.node === node && drag.active) {
        node.x = drag.x;
        node.y = drag.y;
      }
      updateLabelMetrics(node, width, activeNode === node, morphAmount);
    });

    activeNode = findActiveNode();
    if (activeNode !== previousActiveNode) {
      previousActiveNode = activeNode;
      activeStartedAt = time;
    }
    canvas.style.cursor = drag.active ? "grabbing" : activeNode ? "grab" : "default";

    drawDDInternalLines(morphAmount);

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const threshold = Math.min(width, 1280) * 0.13;
        if (distance < threshold) {
          drawLine(a, b, 0.22 * (1 - distance / threshold));
        }
      }
    }

    if (activeNode) {
      drawActiveGroupLines(activeNode, time);
      statusLabel.textContent = `Open: ${activeNode.name}`;
    } else if (statusLabel) {
      statusLabel.textContent = "Hover a name";
    }

    nodes.forEach((node) => {
      const isActive = activeNode === node;
      updateLabelMetrics(node, width, isActive, morphAmount);

      if (isActive) {
        drawActiveNodeGlow(node);
      }

      ctx.beginPath();
      const nodeRadius = isActive ? node.radius + 3.8 : node.radius + morphAmount * 0.85;
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? purple.node : `rgba(244,248,255,${0.92 + morphAmount * 0.08})`;
      ctx.shadowColor = isActive ? "rgba(190, 74, 255, 0.72)" : "rgba(231,240,255,0.82)";
      ctx.shadowBlur = isActive ? 15 : 8 + morphAmount * 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    const occupiedLabelRects = [];
    const labelNodes = [...nodes].sort((a, b) => {
      if (a === activeNode) return -1;
      if (b === activeNode) return 1;
      return a.labelPriority - b.labelPriority;
    });

    labelNodes.forEach((node) => {
      const isActive = activeNode === node;
      const labelSize = getLabelSize(isActive, morphAmount);
      updateLabelMetrics(node, width, isActive, morphAmount);

      if (!placeReadableMobileLabel(node, occupiedLabelRects, width, height, labelSize, isActive, time)) return;

      ctx.font = `${labelSize}px Inter, system-ui, sans-serif`;
      ctx.lineWidth = isPhoneLayout(width) ? 3.8 : 0;
      ctx.strokeStyle = "rgba(0,0,0,0.82)";
      if (isPhoneLayout(width)) ctx.strokeText(node.name, node.labelX, node.labelY);
      ctx.fillStyle = isActive ? purple.text : `rgba(246,244,237,${0.88 + morphAmount * 0.1})`;
      ctx.fillText(node.name, node.labelX, node.labelY);
    });

    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;

    if (drag.node) {
      const dx = pointer.x - drag.startPointerX;
      const dy = pointer.y - drag.startPointerY;
      if (!drag.active && Math.hypot(dx, dy) > 5) {
        drag.active = true;
      }

      if (drag.active) {
        if (
          event.pointerType === "touch" &&
          Math.abs(dx) > Math.abs(dy) * 1.2 &&
          event.cancelable
        ) {
          event.preventDefault();
        }
        drag.x = drag.startNodeX + dx;
        drag.y = drag.startNodeY + dy;
      }
    }
  });

  canvas.addEventListener("pointerleave", () => {
    if (!drag.node) {
      pointer.active = false;
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
    activeNode = findActiveNode();

    if (!activeNode) return;
    if (event.pointerType !== "touch") event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drag.node = activeNode;
    drag.active = false;
    drag.startPointerX = pointer.x;
    drag.startPointerY = pointer.y;
    drag.startNodeX = activeNode.x;
    drag.startNodeY = activeNode.y;
    drag.x = activeNode.x;
    drag.y = activeNode.y;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!drag.node) return;

    if (drag.active) {
      if (currentMorphAmount > 0.58) {
        drag.node.ddX = drag.x;
        drag.node.ddY = drag.y;
      } else if (currentMorphAmount < 0.42) {
        drag.node.baseX = drag.x;
        drag.node.baseY = drag.y;
        drag.node.scatterX = drag.x;
        drag.node.scatterY = drag.y;
      } else {
        drag.node.baseX = drag.x;
        drag.node.baseY = drag.y;
        drag.node.scatterX = drag.x;
        drag.node.scatterY = drag.y;
        drag.node.ddX = drag.x;
        drag.node.ddY = drag.y;
      }
    } else {
      openProfilePanel(drag.node);
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drag.node = null;
    drag.active = false;
  });

  canvas.addEventListener("pointercancel", () => {
    drag.node = null;
    drag.active = false;
  });

  profileCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProfilePanel);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfilePanel();
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}
