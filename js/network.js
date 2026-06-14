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

  const pointer = { x: -9999, y: -9999, active: false };
  let nodes = [];
  let dpr = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createNodes(rect.width, rect.height);
  }

  function createNodes(width, height) {
    const columns = Math.ceil(Math.sqrt(names.length) * 1.12);
    const rows = Math.ceil(names.length / columns);
    const padX = Math.max(56, width * 0.06);
    const padY = 20;

    nodes = names.map((name, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const xStep = (width - padX * 2) / Math.max(1, columns - 1);
      const yStep = (height - padY * 2) / Math.max(1, rows - 1);
      const jitterX = Math.sin(index * 3.8) * xStep * 0.24;
      const jitterY = Math.cos(index * 2.3) * yStep * 0.16;
      const x = padX + col * xStep + jitterX;
      const y = Math.min(height - 28, Math.max(22, padY + row * yStep + jitterY));

      return {
        name,
        x,
        y,
        baseX: x,
        baseY: y,
        phase: index * 0.64,
        radius: 1.8 + (index % 4) * 0.28
      };
    });
  }

  function drawLine(a, b, alpha) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(231, 240, 255, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function draw(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((node) => {
      node.x = node.baseX + Math.sin(time * 0.00045 + node.phase) * 8;
      node.y = node.baseY + Math.cos(time * 0.00038 + node.phase) * 7;
    });

    let closest = null;
    let closestDistance = Infinity;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        const threshold = Math.min(width, 1280) * 0.135;
        if (distance < threshold) {
          drawLine(a, b, 0.14 * (1 - distance / threshold));
        }
      }

      const node = nodes[i];
      const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (pointerDistance < closestDistance) {
        closestDistance = pointerDistance;
        closest = node;
      }
    }

    if (pointer.active && closest && closestDistance < 180) {
      nodes.forEach((node) => {
        const distance = Math.hypot(node.x - closest.x, node.y - closest.y);
        if (distance < 260 && node !== closest) {
          drawLine(closest, node, 0.3 * (1 - distance / 260));
        }
      });
      statusLabel.textContent = `Active node: ${closest.name}`;
    } else if (statusLabel) {
      statusLabel.textContent = "Hover the field";
    }

    nodes.forEach((node) => {
      const isActive = pointer.active && Math.hypot(node.x - pointer.x, node.y - pointer.y) < 180;
      ctx.beginPath();
      ctx.arc(node.x, node.y, isActive ? node.radius + 2.8 : node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "rgba(246,244,237,0.98)" : "rgba(231,240,255,0.92)";
      ctx.shadowColor = "rgba(231,240,255,0.8)";
      ctx.shadowBlur = isActive ? 22 : 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (width > 700 || isActive) {
        ctx.font = `${isActive ? 12 : 10.5}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = isActive ? "rgba(246,244,237,1)" : "rgba(246,244,237,0.82)";
        const labelWidth = ctx.measureText(node.name).width;
        const labelX = node.x + labelWidth + 16 > width ? node.x - labelWidth - 10 : node.x + 10;
        ctx.fillText(node.name, labelX, node.y + 4);
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
    if (statusLabel) statusLabel.textContent = "Node selected";
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}
