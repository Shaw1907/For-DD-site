const WATERFALL_WALL_VERSION = "waterfall-wall.20260903-v1";
console.info(`[site] ${WATERFALL_WALL_VERSION}`);

(function initWaterfallWall() {
  const PLACEHOLDER_SNIPPET = "will be published here";

  const TECH_TAG_RULES = [
    { tag: "Game", patterns: [/\bgame\b/i, /gameplay/i, /game design/i, /playable/i, /first-person narrative game/i] },
    { tag: "VR", patterns: [/\bvr\b/i, /virtual reality/i, /virtual environment/i] },
    { tag: "XR / AR", patterns: [/\bxr\b/i, /\bar\b/i, /augmented/i, /mixed reality/i] },
    { tag: "Animation", patterns: [/animat/i, /animated/i, /motion graphics/i, /character anim/i] },
    { tag: "Mocap", patterns: [/mocap/i, /motion capture/i] },
    { tag: "Unreal Engine", patterns: [/unreal engine/i, /\bue5\b/i] },
    { tag: "Unity", patterns: [/\bunity\b/i] },
    { tag: "TouchDesigner", patterns: [/touchdesigner/i] },
    { tag: "3D / CGI", patterns: [/\b3d\b/i, /cgi/i, /render/i, /blender/i, /c4d/i, /\bmax\b/i, /houdini/i] },
    { tag: "Projection Mapping", patterns: [/projection mapping/i, /projection-mapped/i] },
    { tag: "Physical Computing", patterns: [/physical computing/i, /arduino/i, /sensor/i, /microcontroller/i] },
    { tag: "Real-time", patterns: [/real-time/i, /realtime/i, /live generative/i] },
    { tag: "WebGL", patterns: [/webgl/i, /three\.js/i, /p5\.js/i] },
    { tag: "Generative", patterns: [/generative/i, /procedural/i, /algorithmic/i] },
    { tag: "Film / Video", patterns: [/\bfilm\b/i, /video/i, /moving image/i, /documentary/i, /short film/i, /audiovisual/i] },
    { tag: "Installation", patterns: [/install/i, /immersive/i, /multi-screen/i, /spatial/i, /exhibition/i] },
    { tag: "Interactive", patterns: [/interactiv/i, /responsive system/i, /exploration game/i] },
    { tag: "AI / Data", patterns: [/\bai\b/i, /artificial intelligence/i, /machine learning/i, /data visual/i, /dataset/i, /synthetic intelligence/i, /prompt/i, /computational/i] },
    { tag: "Sound", patterns: [/sound/i, /audio/i, /music/i, /sonic/i, /voice/i] },
    { tag: "Photography", patterns: [/photograph/i, /photo/i] },
  ];

  const TOPIC_TAG_RULES = [
    { tag: "Memory", patterns: [/memory/i, /memorial/i, /remember/i, /archive/i, /cultural memory/i] },
    { tag: "Identity", patterns: [/identity/i, /self/i, /gender/i, /body politics/i, /portrait/i] },
    { tag: "Perception", patterns: [/perception/i, /seeing/i, /visual credibility/i, /understanding of reality/i] },
    { tag: "Cultural Heritage", patterns: [/cultural/i, /heritage/i, /tradition/i, /ritual/i, /ethnic/i, /ancestral/i] },
    { tag: "War & History", patterns: [/war/i, /history/i, /ruins/i, /conflict/i, /post-war/i] },
    { tag: "Ecology", patterns: [/ecolog/i, /nature/i, /garden/i, /organic/i, /landscape/i, /environment/i] },
    { tag: "Surveillance", patterns: [/surveillance/i, /observation/i, /monitor/i, /data ownership/i, /digital capitalism/i] },
    { tag: "Language", patterns: [/language/i, /poetic narration/i, /literary/i, /words/i, /narrative fiction/i] },
    { tag: "Dream & Surrealism", patterns: [/dream/i, /surreal/i, /subconscious/i, /psychological/i] },
    { tag: "Body & Movement", patterns: [/body/i, /movement/i, /dance/i, /choreograph/i, /labour/i, /migrant/i] },
    { tag: "Posthuman", patterns: [/posthuman/i, /machine perception/i, /non-human/i, /anthropocentric/i] },
    { tag: "Social Systems", patterns: [/social/i, /institution/i, /community/i, /collective/i, /norms/i] },
    { tag: "Storytelling", patterns: [/storytelling/i, /narrative/i, /story/i, /environmental storytelling/i] },
    { tag: "Migration", patterns: [/migration/i, /displacement/i, /migrant/i, /urban labour/i] },
    { tag: "Grief & Loss", patterns: [/grief/i, /loss/i, /mourning/i, /disappearance/i] },
    { tag: "Fashion & Appearance", patterns: [/fashion/i, /wearable/i, /hair/i, /appearance/i, /bodyware/i] },
    { tag: "Speculative Futures", patterns: [/speculative/i, /future/i, /utopia/i, /dystopia/i, /science fiction/i] },
  ];

  let allItems = [];
  let filteredItems = [];
  let visibleCount = 0;
  let activeTag = "All";
  let scrollCardObserver = null;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function extractYouTubeId(url) {
    const match = String(url || "").match(
      /(?:youtube\.com\/(?:watch\?(?:[^&\s]+&)*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : "";
  }

  function parseVideoUrls(source) {
    return String(source || "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item));
  }

  function isPlaceholderProject(project) {
    if (!project) return true;
    const description = String(project.description || "");
    const title = String(project.title || "");
    return description.includes(PLACEHOLDER_SNIPPET) || title === "Project coming soon";
  }

  function profileHasWallContent(name, profile) {
    const project = profile?.project || {};
    const images = project.images || {};
    const hasImages = Boolean(images.featured || images.portrait || (images.gallery || []).length);
    const hasVideo = Boolean(
      parseVideoUrls(project.youtube).length ||
      parseVideoUrls(profile.youtube).length ||
      (project.videos || []).length
    );
    const hasBio = String(profile.bio || "").trim().length > 80;
    const hasDescription = String(project.description || "").trim().length > 80 && !isPlaceholderProject(project);
    return hasImages || hasVideo || hasBio || hasDescription;
  }

  function extractWallTags(profile) {
    const project = profile.project || {};
    const text = [profile.bio, project.description, project.title].filter(Boolean).join(" ");
    const tags = [];

    TECH_TAG_RULES.forEach(({ tag, patterns }) => {
      if (patterns.some((pattern) => pattern.test(text))) {
        tags.push(tag);
      }
    });

    TOPIC_TAG_RULES.forEach(({ tag, patterns }) => {
      if (patterns.some((pattern) => pattern.test(text))) {
        tags.push(tag);
      }
    });

    const hasVideo = Boolean(
      parseVideoUrls(project.youtube).length ||
      parseVideoUrls(profile.youtube).length ||
      (project.videos || []).length
    );
    const images = project.images || {};
    const hasImages = Boolean(images.featured || images.portrait || (images.gallery || []).length);

    if (hasVideo && !tags.includes("Film / Video")) {
      tags.unshift("Film / Video");
    }
    if (hasImages && !tags.includes("Photography")) {
      tags.push("Photography");
    }

    return [...new Set(tags)];
  }

  function getMaxColumns() {
    const grid = document.querySelector("#videoGrid");
    // Use the wall's real content width so gutters don't under-count columns.
    const width = grid?.clientWidth || window.innerWidth;
    if (width < 420) return 1;
    if (width < 720) return 2;
    if (width < 980) return 3;
    if (width < 1180) return 4;
    return 5;
  }

  function updateGridColumns() {
    const grid = document.querySelector("#videoGrid");
    if (!grid) return;

    const maxColumns = getMaxColumns();

    // Always use a fixed grid so filtered results keep the full column count
    // (e.g. 5 on desktop) instead of CSS multi-column packing to the left.
    grid.style.columnCount = "auto";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${maxColumns}, minmax(0, 1fr))`;
    grid.style.gap = "clamp(16px, 2vw, 24px)";
    grid.querySelectorAll(".video-card").forEach((card) => {
      card.style.display = "block";
      card.style.width = "auto";
      card.style.marginBottom = "0";
    });
  }

  function getPageSize() {
    const width = window.innerWidth;
    if (width >= 1600) return 15;
    if (width >= 1200) return 12;
    if (width >= 900) return 9;
    if (width >= 680) return 6;
    return 4;
  }

  function collectYouTubeThumbMedia(profile) {
    const project = profile.project || {};
    const media = [];
    const seen = new Set();

    const sources = [
      project.youtube,
      profile.youtube,
      ...((project.videos || []).map((entry) => entry?.url || "")),
    ];

    sources.forEach((source) => {
      parseVideoUrls(source).forEach((url) => {
        const id = extractYouTubeId(url);
        if (!id || seen.has(id)) return;
        seen.add(id);
        media.push({
          type: "image",
          src: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          fallbackSrc: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          youtubeId: id,
        });
      });
    });

    return media;
  }

  function collectProfileMedia(profile) {
    const project = profile.project || {};
    const images = project.images || {};
    const media = [];

    [images.featured, images.portrait, ...(images.gallery || [])]
      .filter(Boolean)
      .forEach((src) => media.push({ type: "image", src }));

    // No uploaded photos: fall back to YouTube default cover frames.
    if (!media.length) {
      return collectYouTubeThumbMedia(profile);
    }

    return media;
  }

  function pickRandomItem(items) {
    if (!items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function buildWallItems() {
    if (typeof PROFILE_DATA !== "object") return [];

    const items = Object.entries(PROFILE_DATA)
      .filter(([name, profile]) => profileHasWallContent(name, profile))
      .map(([name, profile]) => {
        const project = profile.project || {};
        const mediaOptions = collectProfileMedia(profile);
        const picked = pickRandomItem(mediaOptions);
        const tags = extractWallTags(profile);
        const paletteSeed = hashString(name);

        return {
          id: name,
          name,
          title: project.title || name,
          year: project.year || "2026",
          tags,
          media: picked,
          colors: [
            `hsl(${(paletteSeed % 360)} 58% 58%)`,
            `hsl(${((paletteSeed * 7) % 360)} 52% 42%)`,
          ],
        };
      });

    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }

    return items;
  }

  function createVideoCard(item) {
    const [colorA, colorB] = item.colors;
    const hasImage = item.media?.type === "image" && item.media?.src;
    const thumbClass = hasImage ? "video-thumb has-image" : "video-thumb";
    let thumbContent = "";

    if (hasImage) {
      const alt = escapeHtml(`${item.title} — ${item.name}`);
      const src = escapeHtml(item.media.src);
      const fallback = item.media.fallbackSrc
        ? ` onerror="this.onerror=null;this.src='${escapeHtml(item.media.fallbackSrc)}'"`
        : "";
      thumbContent = `<img src="${src}" alt="${alt}" loading="lazy"${fallback}>`;
    }

    return `
      <article class="video-card scroll-card" data-name="${escapeHtml(item.name)}" data-tags="${escapeHtml(item.tags.join("|"))}" style="--tile-a: ${colorA}; --tile-b: ${colorB}">
        <a class="${thumbClass}" href="index.html?profile=${encodeURIComponent(item.name)}#network" aria-label="Open ${escapeHtml(item.name)}">
          ${thumbContent}
          <div class="video-info">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.name)} · ${escapeHtml(item.year)}</p>
          </div>
        </a>
      </article>
    `;
  }

  function setupScrollCards(cards = Array.from(document.querySelectorAll(".scroll-card"))) {
    if (!cards.length) return;

    if ("IntersectionObserver" in window) {
      if (!scrollCardObserver) {
        scrollCardObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
          });
        }, { threshold: 0.12 });
      }

      cards.forEach((card, index) => {
        window.setTimeout(() => {
          scrollCardObserver.observe(card);
        }, index * 34);
      });
    } else {
      cards.forEach((card) => card.classList.add("is-visible"));
    }

    updateScrollCards();
  }

  function updateScrollCards() {
    const cards = document.querySelectorAll(".scroll-card");
    const viewportCenter = window.innerHeight / 2;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = (cardCenter - viewportCenter) / window.innerHeight;
      const shift = Math.max(-18, Math.min(18, distance * -28 + (index % 3 - 1) * 3));
      card.style.setProperty("--scroll-shift", `${shift}px`);
    });
  }

  function updateLoadMoreButton() {
    const button = document.querySelector("#loadMoreButton");
    if (!button) return;

    button.hidden = visibleCount >= filteredItems.length;
    button.textContent = visibleCount >= filteredItems.length ? "All loaded" : "Load more";
  }

  function appendVideoCards(count = getPageSize()) {
    const grid = document.querySelector("#videoGrid");
    if (!grid) return;

    const start = visibleCount;
    const end = Math.min(visibleCount + count, filteredItems.length);
    const nextItems = filteredItems.slice(start, end);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = nextItems.map(createVideoCard).join("");
    const newCards = Array.from(wrapper.children);

    newCards.forEach((card) => {
      const link = card.querySelector(".video-thumb");
      link?.addEventListener("click", (event) => {
        if (typeof window.openNetworkProfileByName !== "function") return;
        event.preventDefault();
        window.openNetworkProfileByName(itemNameFromCard(card));
      });
      grid.appendChild(card);
    });

    visibleCount = end;
    setupScrollCards(newCards);
    updateGridColumns();
    updateLoadMoreButton();
  }

  function itemNameFromCard(card) {
    return card.getAttribute("data-name") || "";
  }

  function renderVideoGrid() {
    const grid = document.querySelector("#videoGrid");
    if (!grid) return;

    grid.innerHTML = "";
    visibleCount = 0;
    updateGridColumns();
    appendVideoCards(getPageSize());
  }

  function setActiveTag(tagName) {
    const bar = document.querySelector("#wallTags");
    if (!bar) return;

    activeTag = tagName || "All";
    bar.querySelectorAll(".wall-tag").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.tag === activeTag);
    });

    filteredItems = activeTag === "All"
      ? allItems.slice()
      : allItems.filter((item) => item.tags.includes(activeTag));

    renderVideoGrid();
  }

  function collectTagCounts(items) {
    const counts = new Map();
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }

  function renderTagBar() {
    const bar = document.querySelector("#wallTags");
    if (!bar) return;

    const tags = collectTagCounts(allItems);
    bar.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "wall-tag is-active";
    allButton.textContent = "All";
    allButton.dataset.tag = "All";
    bar.appendChild(allButton);

    tags.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wall-tag";
      button.textContent = tag;
      button.dataset.tag = tag;
      bar.appendChild(button);
    });

    bar.addEventListener("click", (event) => {
      const button = event.target.closest(".wall-tag");
      if (!button) return;
      setActiveTag(button.dataset.tag || "All");
    });
  }

  function mount() {
    allItems = buildWallItems();
    filteredItems = allItems.slice();
    renderTagBar();
    renderVideoGrid();
  }

  const loadMoreButton = document.querySelector("#loadMoreButton");
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
      appendVideoCards(getPageSize());
    });
  }

  window.addEventListener("scroll", updateScrollCards, { passive: true });
  window.addEventListener("resize", () => {
    updateGridColumns();
    updateScrollCards();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
