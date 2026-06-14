const NETWORK_SCRIPT_VERSION = "network.20260608-v8";
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
    "Ke Ma"
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

  function getMorphAmount(time) {
    const phase = (time % 13000) / 13000;
    if (phase < 0.34) return 0;
    if (phase < 0.56) return easeInOut((phase - 0.34) / 0.22);
    if (phase < 0.72) return 1;
    return 1 - easeInOut((phase - 0.72) / 0.28);
  }

  function placeOnSegment(segment, t, metrics) {
    const { left, top, width, height } = metrics;
    const bottom = top + height;
    const centerY = top + height / 2;

    if (segment === "outer-left") {
      return { x: left, y: top + t * height, side: "left" };
    }

    if (segment === "outer-top") {
      return { x: left + t * width * 0.58, y: top, side: "top" };
    }

    if (segment === "outer-arc") {
      const angle = -Math.PI / 2 + t * Math.PI;
      return {
        x: left + width * 0.58 + Math.cos(angle) * width * 0.42,
        y: centerY + Math.sin(angle) * height * 0.5,
        side: "right"
      };
    }

    if (segment === "outer-bottom") {
      return { x: left + width * 0.58 - t * width * 0.58, y: bottom, side: "bottom" };
    }

    if (segment === "inner-left") {
      return {
        x: left + width * 0.42,
        y: top + height * 0.28 + t * height * 0.44,
        side: "inner"
      };
    }

    const angle = -Math.PI / 2 + t * Math.PI;
    return {
      x: left + width * 0.42 + Math.cos(angle) * width * 0.25,
      y: centerY + Math.sin(angle) * height * 0.23,
      side: "inner"
    };
  }

  function getDDTarget(index, total, width, height, name) {
    const half = Math.ceil(total / 2);
    const letterIndex = index < half ? 0 : 1;
    const localIndex = letterIndex === 0 ? index : index - half;
    const localCount = letterIndex === 0 ? half : total - half;
    const random = seededRandom(hashString(`${name}-dd-target`));
    const letterWidth = Math.min(width * 0.29, 440);
    const letterHeight = Math.min(height * 0.7, 610);
    const gap = Math.min(width * 0.07, 118);
    const totalWidth = letterWidth * 2 + gap;
    const leftEdge = width / 2 - totalWidth / 2 + letterIndex * (letterWidth + gap);
    const top = height / 2 - letterHeight / 2 + 12;
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
      height: letterHeight
    });

    return {
      x: point.x + (random() - 0.5) * 12,
      y: point.y + (random() - 0.5) * 12,
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
    const padX = Math.max(52, width * 0.045);
    const padTop = 10;
    const padBottom = 30;
    const minDistance = width < 760 ? 54 : 84;

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
        ddLabelSide: "auto",
        phase: random() * Math.PI * 2,
        radius: 1.8 + random() * 1.15,
        driftX: 5 + random() * 9,
        driftY: 4 + random() * 8,
        labelX: x + 10,
        labelWidth: 0
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
      node.ddLabelSide = target.side;
    });
  }

  function drawLine(a, b, alpha, isActive = false) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = isActive ? `${purple.line} ${alpha})` : `rgba(231, 240, 255, ${alpha})`;
    ctx.lineWidth = isActive ? 1.15 : 1;
    ctx.stroke();
  }

  function drawActiveGroupLines(active) {
    nodes.forEach((node) => {
      if (node === active) return;

      const distance = Math.hypot(node.x - active.x, node.y - active.y);
      const normalized = Math.min(distance / Math.max(canvas.clientWidth, canvas.clientHeight), 1);
      const alpha = 0.1 + (1 - normalized) * 0.28;
      const purpleWeight = Math.max(0.12, 1 - normalized * 1.25);
      ctx.beginPath();
      ctx.moveTo(active.x, active.y);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = purpleWeight > 0.42
        ? `rgba(176, 38, 255, ${alpha})`
        : `rgba(160, 150, 178, ${alpha * 0.82})`;
      ctx.lineWidth = 0.75 + purpleWeight * 0.55;
      ctx.stroke();
    });
  }

  function updateLabelMetrics(node, width, isActive, morphAmount = 0) {
    const labelSize = isActive ? 13 : 10.5 - morphAmount * 1.25;
    ctx.font = `${labelSize}px Inter, system-ui, sans-serif`;
    node.labelWidth = ctx.measureText(node.name).width;

    if (morphAmount > 0.72 && !isActive) {
      if (node.ddLabelSide === "left") {
        node.labelX = node.x - node.labelWidth - 14;
        node.labelY = node.y + 4;
        return;
      }

      if (node.ddLabelSide === "right") {
        node.labelX = node.x + 14;
        node.labelY = node.y + 4;
        return;
      }

      if (node.ddLabelSide === "top") {
        node.labelX = node.x - node.labelWidth / 2;
        node.labelY = node.y - 14;
        return;
      }

      if (node.ddLabelSide === "bottom") {
        node.labelX = node.x - node.labelWidth / 2;
        node.labelY = node.y + 22;
        return;
      }

      if (node.ddLabelSide === "inner") {
        node.labelX = node.x + 14;
        node.labelY = node.y + 4;
        return;
      }
    }

    node.labelX = node.x + node.labelWidth + 16 > width ? node.x - node.labelWidth - 10 : node.x + 10;
    node.labelY = node.y + 4;
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
      const driftScale = 1 - morphAmount * 0.68;
      node.x = targetX + Math.sin(time * 0.00042 + node.phase) * node.driftX * driftScale;
      node.y = targetY + Math.cos(time * 0.00036 + node.phase) * node.driftY * driftScale;
      if (drag.node === node && drag.active) {
        node.x = drag.x;
        node.y = drag.y;
      }
      updateLabelMetrics(node, width, activeNode === node, morphAmount);
    });

    activeNode = findActiveNode();
    canvas.style.cursor = drag.active ? "grabbing" : activeNode ? "grab" : "default";

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const threshold = Math.min(width, 1280) * 0.13;
        if (distance < threshold) {
          drawLine(a, b, 0.14 * (1 - distance / threshold));
        }
      }
    }

    if (activeNode) {
      drawActiveGroupLines(activeNode);
      statusLabel.textContent = `Open: ${activeNode.name}`;
    } else if (statusLabel) {
      statusLabel.textContent = "Hover a name";
    }

    nodes.forEach((node) => {
      const isActive = activeNode === node;
      updateLabelMetrics(node, width, isActive, morphAmount);

      ctx.beginPath();
      ctx.arc(node.x, node.y, isActive ? node.radius + 3.2 : node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? purple.node : "rgba(231,240,255,0.92)";
      ctx.shadowColor = isActive ? purple.glow : "rgba(231,240,255,0.8)";
      ctx.shadowBlur = isActive ? 28 : 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (width > 700 || isActive) {
        ctx.font = `${isActive ? 13 : 10.5 - morphAmount * 1.25}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = isActive ? purple.text : "rgba(246,244,237,0.82)";
        ctx.fillText(node.name, node.labelX, node.labelY);
      }
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
    if (!activeNode) return;
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
