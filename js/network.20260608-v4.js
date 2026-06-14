const NETWORK_SCRIPT_VERSION = "network.20260608-v4";
console.info(`[site] ${NETWORK_SCRIPT_VERSION}`);

const canvas = document.querySelector("#networkCanvas");
const statusLabel = document.querySelector("#networkStatus");

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
  let nodes = [];
  let activeNode = null;
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
      });
    }
  }

  function drawLine(a, b, alpha, isActive = false) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = isActive ? `${purple.line} ${alpha})` : `rgba(231, 240, 255, ${alpha})`;
    ctx.lineWidth = isActive ? 1.15 : 1;
    ctx.stroke();
  }

  function updateLabelMetrics(node, width, isActive) {
    ctx.font = `${isActive ? 13 : 10.5}px Inter, system-ui, sans-serif`;
    node.labelWidth = ctx.measureText(node.name).width;
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
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((node) => {
      node.x = node.baseX + Math.sin(time * 0.00042 + node.phase) * node.driftX;
      node.y = node.baseY + Math.cos(time * 0.00036 + node.phase) * node.driftY;
      updateLabelMetrics(node, width, activeNode === node);
    });

    activeNode = findActiveNode();
    canvas.style.cursor = activeNode ? "pointer" : "default";

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
      nodes.forEach((node) => {
        const distance = Math.hypot(node.x - activeNode.x, node.y - activeNode.y);
        if (distance < 285 && node !== activeNode) {
          drawLine(activeNode, node, 0.44 * (1 - distance / 285), true);
        }
      });
      statusLabel.textContent = `Open: ${activeNode.name}`;
    } else if (statusLabel) {
      statusLabel.textContent = "Hover a name";
    }

    nodes.forEach((node) => {
      const isActive = activeNode === node;
      updateLabelMetrics(node, width, isActive);

      ctx.beginPath();
      ctx.arc(node.x, node.y, isActive ? node.radius + 3.2 : node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? purple.node : "rgba(231,240,255,0.92)";
      ctx.shadowColor = isActive ? purple.glow : "rgba(231,240,255,0.8)";
      ctx.shadowBlur = isActive ? 28 : 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (width > 700 || isActive) {
        ctx.font = `${isActive ? 13 : 10.5}px Inter, system-ui, sans-serif`;
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
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  canvas.addEventListener("pointerdown", () => {
    if (!activeNode) return;
    const url = `person.html?name=${encodeURIComponent(activeNode.name)}&person=${activeNode.slug}`;
    window.location.href = url;
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}
