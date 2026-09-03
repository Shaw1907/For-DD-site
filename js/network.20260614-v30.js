const NETWORK_SCRIPT_VERSION = "network.20260614-v30";
console.info(`[site] ${NETWORK_SCRIPT_VERSION}`);

const canvas = document.querySelector("#networkCanvas");
const profilePanel = document.querySelector("#profilePanel");
const profileTitle = document.querySelector("#profilePanelTitle");
const profileSummary = document.querySelector("#profilePanelSummary");
const profileContact = document.querySelector("#profileContact");
const profilePortraitWrap = document.querySelector("#profilePortraitWrap");
const profilePortrait = document.querySelector("#profilePortrait");
const profileWorkOffset = document.querySelector("#profileWorkOffset");
const profileWorkKicker = document.querySelector("#profileWorkKicker");
const profileFeaturedWrap = document.querySelector("#profileFeaturedWrap");
const profileFeatured = document.querySelector("#profileFeatured");
const profileProjectTitle = document.querySelector("#profileProjectTitle");
const profileProjectVideoWrap = document.querySelector("#profileProjectVideoWrap");
const profileProjectDescription = document.querySelector("#profileProjectDescription");
const profileWorkGallery = document.querySelector("#profileWorkGallery");
const profileMobileName = document.querySelector("#profileMobileName");
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
    "Jianing Shen",
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

  function profileUrl(node, channel = "") {
    const suffix = channel ? `#${channel}` : "";
    return `person.html?name=${encodeURIComponent(node.name)}${suffix}`;
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

  function getScrollMorphAmount() {
    const hero = canvas.closest(".hero");
    if (!hero) return 0;
    const scrollable = Math.max(1, hero.offsetHeight - window.innerHeight);
    const scrolled = Math.min(scrollable, Math.max(0, -hero.getBoundingClientRect().top));
    return easeInOut(scrolled / scrollable);
  }

  function getMorphAmount(time) {
    // Phone: morph follows a two-screen scroll so DD has room to read.
    if (isPhoneLayout()) {
      return getScrollMorphAmount();
    }

    const HOLD_SCATTER = 4500;
    const CONVERGE = 4400;
    const HOLD_DD = 9800;
    const SCATTER = 3000;
    const CYCLE = HOLD_SCATTER + CONVERGE + HOLD_DD + SCATTER;
    const phase = time % CYCLE;

    if (phase < HOLD_SCATTER) return 0;
    if (phase < HOLD_SCATTER + CONVERGE) return easeInOut((phase - HOLD_SCATTER) / CONVERGE);
    if (phase < HOLD_SCATTER + CONVERGE + HOLD_DD) return 1;
    return 1 - easeInOut((phase - HOLD_SCATTER - CONVERGE - HOLD_DD) / SCATTER);
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
    const ddCenterGapExtra = isPhone ? 0 : 45;
    const letterGap =
      Math.min(width * (isPhone ? 0.08 : 0.08), isPhone ? 34 : 118) + ddCenterGapExtra;
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
      const maxTotalWidth = width * 0.72;
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

  function extractYouTubeId(url) {
    const text = String(url || "").trim();
    if (!text) return "";

    const match = text.match(
      /(?:youtube\.com\/(?:watch\?(?:[^&\s]+&)*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : "";
  }

  function extractVimeoId(url) {
    const text = String(url || "").trim();
    if (!text) return "";

    const match = text.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : "";
  }

  function parseProjectVideoUrls(source) {
    const text = String(source || "");
    const urls = text.match(/https?:\/\/[^\s<>"']+/g) || [];
    return [...new Set(urls.map((url) => url.replace(/[,.;]+$/, "")))];
  }

  function parseProjectMediaItems(project) {
    const items = [];
    if (project && Array.isArray(project.videos)) {
      project.videos.forEach((entry) => {
        const url = String(entry?.url || "").trim();
        const title = String(entry?.title || "").trim();
        if (url) items.push({ title, url });
      });
    }
    if (!items.length) {
      parseProjectVideoUrls(project?.youtube || "").forEach((url) => {
        items.push({ title: "", url });
      });
    }
    return items;
  }

  function hasEmbeddableProjectVideo(source) {
    if (source && typeof source === "object") {
      return parseProjectMediaItems(source).some(
        (item) => extractYouTubeId(item.url) || extractVimeoId(item.url)
      );
    }
    return parseProjectVideoUrls(source).some((url) => extractYouTubeId(url) || extractVimeoId(url));
  }

  function renderProjectVideos(wrap, project) {
    if (!wrap) return false;

    wrap.innerHTML = "";
    const items = parseProjectMediaItems(typeof project === "object" ? project : { youtube: project });
    let rendered = 0;
    let hasEmbed = false;

    items.forEach((item, index) => {
      const youtubeId = extractYouTubeId(item.url);
      const vimeoId = extractVimeoId(item.url);
      const block = document.createElement("div");
      block.className = "profile-video-block";

      if (item.title) {
        const heading = document.createElement("p");
        heading.className = "profile-video-title";
        heading.textContent = item.title;
        block.appendChild(heading);
      }

      if (youtubeId || vimeoId) {
        hasEmbed = true;
        const embed = document.createElement("div");
        embed.className = "profile-video-embed";
        const iframe = document.createElement("iframe");
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.title = item.title || `Project video ${index + 1}`;
        iframe.src = youtubeId
          ? `https://www.youtube.com/embed/${youtubeId}`
          : `https://player.vimeo.com/video/${vimeoId}`;
        embed.appendChild(iframe);
        block.appendChild(embed);
        rendered += 1;
      } else if (/^https?:\/\//i.test(item.url)) {
        const linkWrap = document.createElement("p");
        linkWrap.className = "profile-video-link";
        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = item.url.replace(/^https?:\/\//, "");
        linkWrap.appendChild(link);
        block.appendChild(linkWrap);
        rendered += 1;
      }

      if (block.childNodes.length) wrap.appendChild(block);
    });

    wrap.hidden = rendered === 0;
    return hasEmbed;
  }

  function collectProjectImages(images = {}) {
    const featured = images.featured || "";
    const gallery = Array.isArray(images.gallery) ? images.gallery.filter(Boolean) : [];
    if (!featured) return gallery;
    return gallery[0] === featured ? gallery : [featured, ...gallery];
  }

  function setProfileImage(wrap, image, src, alt, options = {}) {
    if (!wrap || !image) return;
    const keepPlaceholder = Boolean(options.keepPlaceholder);
    if (!src) {
      if (keepPlaceholder) {
        wrap.hidden = false;
        wrap.classList.add("profile-figure-placeholder");
        image.removeAttribute("src");
        image.alt = "";
        return;
      }
      wrap.hidden = true;
      wrap.classList.remove("profile-figure-placeholder");
      image.removeAttribute("src");
      image.alt = "";
      return;
    }
    wrap.hidden = false;
    wrap.classList.remove("profile-figure-placeholder");
    image.src = src;
    image.alt = alt;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function splitIntoSentences(text) {
    // Protect single-letter abbreviations like "b.1980" so they are not treated as sentence ends.
    const protectedText = String(text || "").replace(/\b([A-Za-z])\.(?=\d)/g, "$1\u0000.");
    return (protectedText.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [protectedText])
      .map((part) => part.replace(/\u0000/g, ""));
  }

  function chunkParagraph(text, maxChars = 320) {
    const trimmed = text.trim();
    if (trimmed.length <= maxChars) return [trimmed];

    const sentences = splitIntoSentences(trimmed);
    const chunks = [];
    let current = "";

    sentences.forEach((sentence) => {
      const part = sentence.trim();
      if (!part) return;
      const next = current ? `${current} ${part}` : part;
      if (next.length > maxChars && current) {
        chunks.push(current.trim());
        current = part;
      } else {
        current = next;
      }
    });

    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [trimmed];
  }

  function formatBioHtml(bio) {
    const text = (bio || "").trim();
    if (!text) return "";

    // Prefer author-defined paragraph breaks. Only chunk a single long block.
    const rawParagraphs = text.split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
    const paragraphs = rawParagraphs.length >= 2
      ? rawParagraphs
      : rawParagraphs.flatMap((part) => chunkParagraph(part, 420));

    return paragraphs.map((part) => `<p>${escapeHtml(part)}</p>`).join("");
  }

  function appendContactRow(label, value, href = "") {
    if (!profileContact || !value) return;
    const row = document.createElement("div");
    row.className = "profile-contact-row";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = value;
      if (!href.startsWith("mailto:")) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      dd.appendChild(link);
    } else {
      dd.textContent = value;
    }
    row.append(dt, dd);
    profileContact.appendChild(row);
  }

  function renderProfileGallery(images, alt) {
    if (!profileWorkGallery) return;
    profileWorkGallery.innerHTML = "";
    (images || []).forEach((src) => {
      const figure = document.createElement("figure");
      figure.className = "profile-figure profile-figure-gallery";
      const image = document.createElement("img");
      image.className = "profile-media";
      image.src = src;
      image.alt = alt;
      image.loading = "lazy";
      figure.appendChild(image);
      profileWorkGallery.appendChild(figure);
    });
  }

  function openProfilePanel(node) {
    if (!profilePanel) return;

    const profile = typeof getProfileByName === "function" ? getProfileByName(node.name) : null;
    const project = profile?.project;
    const images = project?.images || {};

    profileTitle.textContent = node.name;
    if (profileMobileName) profileMobileName.textContent = node.name;
    const defaultBio = "Profile details for this person will appear here once their biography, project notes, and contact links are added.";
    profileSummary.innerHTML = formatBioHtml(profile?.bio) || `<p>${escapeHtml(defaultBio)}</p>`;

    if (profileContact) profileContact.innerHTML = "";

    if (profile) {
      appendContactRow("Email", profile.email, profile.email ? `mailto:${profile.email}` : "");
      appendContactRow(
        "Instagram",
        profile.instagram ? `@${profile.instagram.replace(/^@/, "")}` : "",
        profile.instagram ? instagramUrl(profile.instagram) : ""
      );
      if (profile.website) {
        appendContactRow("Personal Website", profile.website.replace(/^https?:\/\//, ""), profile.website);
      }
      if (profile.linkedin) {
        appendContactRow(
          "LinkedIn",
          profile.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ""),
          profile.linkedin
        );
      }
      if (profile.vimeo) {
        appendContactRow("Vimeo", profile.vimeo.replace(/^https?:\/\//, ""), profile.vimeo);
      }
      const projectYoutube = project?.youtube || "";
      const hasEmbeddedVideo = hasEmbeddableProjectVideo(project || projectYoutube);
      const contactYoutube = profile.youtube || (!hasEmbeddedVideo ? projectYoutube : "");
      if (contactYoutube) {
        const firstYoutubeUrl = parseProjectVideoUrls(contactYoutube)[0] || contactYoutube.split(/\s+/)[0];
        appendContactRow("YouTube", firstYoutubeUrl.replace(/^https?:\/\//, ""), firstYoutubeUrl);
      }
      if (profile.rednote) {
        const rednoteHref = typeof rednoteUrl === "function"
          ? rednoteUrl(profile.rednote, profile.rednoteUrl)
          : profile.rednoteUrl;
        appendContactRow("Rednote", profile.rednote, rednoteHref);
      }
    }

    if (profileWorkKicker) {
      const year = project?.year || "";
      const yearMarkup = year ? escapeHtml(year) : "";
      profileWorkKicker.innerHTML = year
        ? `<span class="profile-kicker-label-desktop">CREATIVE WORK: ${yearMarkup}</span><span class="profile-kicker-label-mobile">SELECTED WORK | ${yearMarkup}</span>`
        : `<span class="profile-kicker-label-desktop">CREATIVE WORK</span><span class="profile-kicker-label-mobile">SELECTED WORK</span>`;
    }
    if (profileProjectTitle) {
      profileProjectTitle.textContent = project?.title || "Project coming soon";
    }

    const defaultDescription = "Selected works, process notes, and media for this person will be published here.";
    const projectYoutube = project?.youtube || "";
    const hasEmbeddedVideo = renderProjectVideos(profileProjectVideoWrap, project);

    if (profileProjectDescription) {
      const description = project?.description || defaultDescription;
      profileProjectDescription.innerHTML = formatBioHtml(description) || `<p>${escapeHtml(defaultDescription)}</p>`;
    }

    const imageAlt = project?.title ? `${node.name} — ${project.title}` : node.name;
    if (profileWorkOffset) {
      profileWorkOffset.hidden = false;
    }
    setProfileImage(profilePortraitWrap, profilePortrait, images.portrait || "", imageAlt, { keepPlaceholder: true });

    if (hasEmbeddedVideo) {
      setProfileImage(profileFeaturedWrap, profileFeatured, "", imageAlt);
      renderProfileGallery(collectProjectImages(images), imageAlt);
    } else {
      setProfileImage(profileFeaturedWrap, profileFeatured, images.featured || "", imageAlt);
      renderProfileGallery(images.gallery || [], imageAlt);
    }

    profilePanel.hidden = false;
    profilePanel.querySelector(".profile-sheet")?.scrollTo(0, 0);
    requestAnimationFrame(() => {
      profilePanel.classList.add("is-open");
      document.body.classList.add("profile-open");
    });
  }

  function closeProfilePanel() {
    if (!profilePanel) return;

    profilePanel.classList.remove("is-open");
    document.body.classList.remove("profile-open");
    if (profileProjectVideoWrap) {
      profileProjectVideoWrap.innerHTML = "";
      profileProjectVideoWrap.hidden = true;
    }
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
    ctx.lineWidth = isActive ? 1.24 : 1.18;
    ctx.stroke();
  }

  function drawNeighborConnectionField(width, height, morphAmount) {
    const isPhone = isPhoneLayout(width);
    const minLinks = isPhone ? 10 : 12;
    const maxLinks = isPhone ? 12 : 14;
    const maxFadeDistance = Math.max(Math.min(width, height) * (isPhone ? 0.78 : 0.48), 260);
    const baseAlpha = isPhone ? 0.18 : 0.24;
    const scatterFade = 1 - morphAmount * 0.82;
    const drawn = new Set();
    const linkCounts = new Array(nodes.length).fill(0);
    const edges = [];

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      const nearest = nodes
        .map((node, index) => ({
          node,
          index,
          distance: index === i ? Infinity : Math.hypot(a.x - node.x, a.y - node.y)
        }))
        .sort((left, right) => left.distance - right.distance);

      for (let n = 0; n < nearest.length && linkCounts[i] < minLinks; n += 1) {
        const { node: b, index: j, distance } = nearest[n];
        const key = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (drawn.has(key) || linkCounts[j] >= maxLinks) continue;
        drawn.add(key);
        linkCounts[i] += 1;
        linkCounts[j] += 1;
        edges.push({ a, b, distance });
      }
    }

    ctx.save();
    ctx.lineWidth = isPhone ? 0.92 : 1.12;
    edges.forEach(({ a, b, distance }) => {
      const distanceFade = Math.max(0.48, 1 - distance / maxFadeDistance);
      const alpha = baseAlpha * scatterFade * distanceFade;
      if (alpha < 0.015) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(231, 240, 255, ${alpha})`;
      ctx.stroke();
    });
    ctx.restore();
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
    if (morphAmount < 0.12) return;

    const alphaScale = Math.min(1, (morphAmount - 0.12) / 0.5);
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

  const LABEL_SIZE_SCALE = 1.5;

  function getLabelSize(isActive, morphAmount = 0) {
    const viewportWidth = window.innerWidth;
    let size;
    if (viewportWidth <= 420) size = isActive ? 14.2 : 11.8;
    else if (viewportWidth <= 680) size = isActive ? 15 : 12.4;
    else size = isActive ? 13 : 10.8;

    if (!isActive && morphAmount > 0.92) {
      size -= (morphAmount - 0.92) / 0.08 * 0.55;
    }

    return size * LABEL_SIZE_SCALE;
  }

  function getDDLabelPosition(node, width, labelSize) {
    const headerSafeTop = isPhoneLayout(width) ? 72 : 78;

    if (node.ddLabelSide === "left") {
      return {
        labelX: Math.max(8, node.x - node.labelWidth - 16),
        labelY: Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4)),
      };
    }

    if (node.ddLabelSide === "right") {
      return {
        labelX: Math.min(width - node.labelWidth - 8, node.x + 16),
        labelY: Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4)),
      };
    }

    if (node.ddLabelSide === "top") {
      return {
        labelX: Math.min(width - node.labelWidth - 8, Math.max(8, node.x - node.labelWidth / 2)),
        labelY: Math.max(headerSafeTop + 8, node.y - labelSize - 6),
      };
    }

    if (node.ddLabelSide === "bottom") {
      return {
        labelX: Math.min(width - node.labelWidth - 8, Math.max(8, node.x - node.labelWidth / 2)),
        labelY: Math.min(window.innerHeight - 14, node.y + 22),
      };
    }

    if (node.ddLabelSide === "inner") {
      return {
        labelX: Math.min(width - node.labelWidth - 8, node.x + 14),
        labelY: Math.min(window.innerHeight - 14, Math.max(headerSafeTop + 8, node.y + 4)),
      };
    }

    return null;
  }

  function getScatterLabelPosition(node, width) {
    const headerSafeTop = isPhoneLayout(width) ? 72 : 78;
    return {
      labelX: node.x + node.labelWidth + 16 > width ? node.x - node.labelWidth - 10 : node.x + 10,
      labelY: Math.max(headerSafeTop + 8, node.y + 4),
    };
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
    occupiedRects.push(getLabelRect(node, labelSize));
    node.labelVisible = true;
    node.labelHoldUntil = time + 1200;
    return true;
  }

  function updateLabelMetrics(node, width, isActive, morphAmount = 0) {
    const labelSize = getLabelSize(isActive, morphAmount);
    ctx.font = `${labelSize}px Inter, system-ui, sans-serif`;
    node.labelWidth = ctx.measureText(node.name).width;

    const scatter = getScatterLabelPosition(node, width);
    const dd = getDDLabelPosition(node, width, labelSize);

    if (isActive || !dd) {
      node.labelX = scatter.labelX;
      node.labelY = scatter.labelY;
      return;
    }

    const labelMorph = easeInOut(Math.min(1, Math.max(0, (morphAmount - 0.18) / 0.62)));
    node.labelX = scatter.labelX + (dd.labelX - scatter.labelX) * labelMorph;
    node.labelY = scatter.labelY + (dd.labelY - scatter.labelY) * labelMorph;
  }

  function nodeIsHit(node) {
    const nodeHit = Math.hypot(node.x - pointer.x, node.y - pointer.y) < 34;
    const labelHit =
      pointer.x >= node.labelX - 6 &&
      pointer.x <= node.labelX + node.labelWidth + 12 &&
      pointer.y >= node.labelY - 27 &&
      pointer.y <= node.labelY + 15;

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
      const naturalX = targetX + Math.sin(time * 0.00042 + node.phase) * node.driftX * driftScale;
      const naturalY = targetY + Math.cos(time * 0.00036 + node.phase) * node.driftY * driftScale;
      const headerSafeTop = isPhoneLayout(width) ? 72 : 78;
      const clampMix = Math.max(0, 1 - morphAmount / 0.28);
      const clampedY = Math.max(headerSafeTop, naturalY);
      node.x = naturalX;
      node.y = naturalY * (1 - clampMix) + clampedY * clampMix;
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
    drawNeighborConnectionField(width, height, morphAmount);
    drawDDInternalLines(morphAmount);

    if (activeNode) {
      drawActiveGroupLines(activeNode, time);
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
      ctx.lineWidth = isPhoneLayout(width) ? 5.7 : 0;
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
      if (currentMorphAmount < 0.58) {
        drag.node.baseX = drag.x;
        drag.node.baseY = drag.y;
        drag.node.scatterX = drag.x;
        drag.node.scatterY = drag.y;
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

  window.openNetworkProfileByName = (name) => {
    const canonical = typeof getCanonicalProfileName === "function"
      ? getCanonicalProfileName(name)
      : name;
    const node = nodes.find((item) => item.name === canonical);
    if (!node) return false;
    openProfilePanel(node);
    return true;
  };

  const pendingProfile = new URLSearchParams(window.location.search).get("profile");
  if (pendingProfile) {
    window.openNetworkProfileByName(pendingProfile);
  }

  // On mobile the canvas is sticky; scroll events don't trigger rAF naturally,
  // so we ensure a redraw whenever the page scrolls (throttled to one frame).
  let scrollRafPending = false;
  window.addEventListener("scroll", () => {
    if (isPhoneLayout() && !scrollRafPending) {
      scrollRafPending = true;
      requestAnimationFrame(() => { scrollRafPending = false; });
    }
  }, { passive: true });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}
