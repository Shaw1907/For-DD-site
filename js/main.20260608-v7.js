const MAIN_SCRIPT_VERSION = "main.20260608-v7";
console.info(`[site] ${MAIN_SCRIPT_VERSION}`);

const PAGE_SIZE = 6;
let visibleProjectCount = PAGE_SIZE;

const eventBanners = [
  {
    id: "yellow",
    label: "Fromless",
    venue: "Venue 01",
    title: "Fromless Yellow",
    description: "A hero banner slot for the first venue, poster, programme, or activity announcement.",
    date: "2026",
    location: "Main Hall",
    color: "#ffc400",
    bg: "#686866",
    accent: "rgba(255, 196, 0, 0.42)"
  },
  {
    id: "blue",
    label: "Fromless",
    venue: "Venue 02",
    title: "Fromless Blue",
    description: "Click each colour strip to expand its corresponding banner without leaving the homepage.",
    date: "2026",
    location: "Screening Room",
    color: "#0d55ff",
    bg: "#626463",
    accent: "rgba(13, 85, 255, 0.46)"
  },
  {
    id: "pink",
    label: "Fromless",
    venue: "Venue 03",
    title: "Fromless Pink",
    description: "Use this area for each venue's hero image, poster, timetable, or featured event.",
    date: "2026",
    location: "Studio Space",
    color: "#f600ad",
    bg: "#676665",
    accent: "rgba(246, 0, 173, 0.44)"
  }
];

const projects = [
  {
    id: "signal-room",
    title: "Signal Room",
    category: "Installation",
    summary: "A spatial video study built around pulse, proximity, and response.",
    body: "This page is a reusable detail template. Replace this text with the project concept, production notes, credits, press links, embedded video, or gallery content once the company assets are ready.",
    year: "2026",
    format: "Video / Installation",
    status: "Framework",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#64d4c2", "#eb756d"]
  },
  {
    id: "open-field",
    title: "Open Field",
    category: "Film",
    summary: "A cinematic placeholder for a campaign, short film, or public artwork.",
    body: "Each card on the homepage links to this detail page with a different project id. The same template can support film pages, director pages, case studies, or campaign microsites.",
    year: "2025",
    format: "Short Film",
    status: "Draft",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#e7b45d", "#4c7bd9"]
  },
  {
    id: "night-index",
    title: "Night Index",
    category: "Archive",
    summary: "An index-style page for research footage, interviews, or documentation.",
    body: "The current visual blocks are local CSS placeholders. Later, they can become real image thumbnails, hosted videos, Vimeo embeds, YouTube embeds, or self-hosted mp4 files.",
    year: "2026",
    format: "Archive",
    status: "Placeholder",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#9fce7a", "#eb756d"]
  },
  {
    id: "soft-machine",
    title: "Soft Machine",
    category: "Research",
    summary: "A flexible section for experimental work, process, or behind-the-scenes media.",
    body: "This structure is intentionally light: the company can keep the homepage expressive while each subpage carries richer written content and production details.",
    year: "2024",
    format: "Research Video",
    status: "Framework",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#6f8bd8", "#e7b45d"]
  },
  {
    id: "studio-notes",
    title: "Studio Notes",
    category: "Series",
    summary: "A serial format for recurring updates, editorial films, and social cuts.",
    body: "Use this page for repeatable content. The metadata block can be expanded into credits, collaborators, locations, clients, or exhibition dates.",
    year: "2026",
    format: "Series",
    status: "Draft",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#eb756d", "#64d4c2"]
  },
  {
    id: "future-works",
    title: "Future Works",
    category: "Commission",
    summary: "A project tile ready for upcoming commissions or locked client pages.",
    body: "If some future pages need to stay private, GitHub Pages alone is not the best place for password protection. For public company pages, this static setup is clean and quick.",
    year: "2026",
    format: "Commission",
    status: "Planning",
    youtubeUrl: "https://www.youtube.com/",
    colors: ["#4c7bd9", "#9fce7a"]
  }
];

const archiveFeed = Array.from({ length: 60 }, (_, index) => {
  const project = projects[index % projects.length];
  const cycle = Math.floor(index / projects.length);
  return {
    ...project,
    feedId: `${project.id}-${cycle + 1}`,
    title: cycle === 0 ? project.title : `${project.title} ${String(cycle + 1).padStart(2, "0")}`,
    year: String(Number(project.year) + cycle),
    youtubeUrl: project.youtubeUrl
  };
});

function renderEventBanner(activeIndex = 0) {
  const banner = document.querySelector("#eventBanner");
  if (!banner) return;

  banner.innerHTML = eventBanners.map((event, index) => {
    const isActive = index === activeIndex;
    const tab = `
      <button
        class="event-accordion-tab${isActive ? " is-active" : ""}"
        type="button"
        style="background: ${event.color}"
        aria-pressed="${isActive}"
        data-event-index="${index}"
      >
        <span class="event-tab-label">${event.label}</span>
      </button>
    `;

    if (!isActive) return tab;

    return `${tab}
      <article class="event-accordion-panel" style="--event-a: ${event.accent}" aria-label="${event.title}">
        <div class="event-display-inner">
          <p class="event-venue">${event.venue}</p>
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          <div class="event-meta">
            <span>${event.date}</span>
            <span>${event.location}</span>
            <span>Hero Image / Poster</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  banner.querySelectorAll("[data-event-index]").forEach((button) => {
    button.addEventListener("click", () => {
      renderEventBanner(Number(button.dataset.eventIndex));
    });
  });
}

function renderVideoGrid() {
  const grid = document.querySelector("#videoGrid");
  const button = document.querySelector("#loadMoreButton");
  if (!grid) return;

  const visibleProjects = archiveFeed.slice(0, visibleProjectCount);
  grid.innerHTML = visibleProjects.map((project) => {
    const [a, b] = project.colors;
    return `
      <article class="video-card scroll-card" style="--tile-a: ${a}; --tile-b: ${b}">
        <a class="video-thumb" href="project.html?id=${project.id}" aria-label="Open ${project.title}"></a>
        <div class="video-info">
          <h3>${project.title}</h3>
          <p>${project.category} · ${project.year}</p>
          <a class="video-youtube-link" href="${project.youtubeUrl}" target="_blank" rel="noopener">YouTube link</a>
        </div>
      </article>
    `;
  }).join("");

  setupScrollCards();

  if (button) {
    button.hidden = visibleProjectCount >= archiveFeed.length;
    button.textContent = visibleProjectCount >= archiveFeed.length ? "All loaded" : "Load more";
  }
}

function setupScrollCards() {
  const cards = Array.from(document.querySelectorAll(".scroll-card"));
  if (!cards.length) return;

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.12 });
    cards.forEach((card) => observer.observe(card));
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

renderEventBanner(2);
renderVideoGrid();

window.addEventListener("scroll", updateScrollCards, { passive: true });
window.addEventListener("resize", updateScrollCards);

const loadMoreButton = document.querySelector("#loadMoreButton");
if (loadMoreButton) {
  loadMoreButton.addEventListener("click", () => {
    visibleProjectCount = Math.min(visibleProjectCount + PAGE_SIZE, archiveFeed.length);
    renderVideoGrid();
  });
}
