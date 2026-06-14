const MAIN_SCRIPT_VERSION = "main.20260608-v1";
console.info(`[site] ${MAIN_SCRIPT_VERSION}`);

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
    colors: ["#4c7bd9", "#9fce7a"]
  }
];

function renderVideoGrid() {
  const grid = document.querySelector("#videoGrid");
  if (!grid) return;

  grid.innerHTML = projects.map((project) => {
    const [a, b] = project.colors;
    return `
      <a class="video-card" href="project.html?id=${project.id}" style="--tile-a: ${a}; --tile-b: ${b}">
        <span class="video-thumb" aria-hidden="true"></span>
        <div class="video-info">
          <h3>${project.title}</h3>
          <p>${project.category} · ${project.year}</p>
        </div>
      </a>
    `;
  }).join("");
}

renderVideoGrid();
