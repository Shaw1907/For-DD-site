const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id");
const project = projects.find((item) => item.id === requestedId) || projects[0];
const [tileA, tileB] = project.colors;

document.title = `${project.title} | Company Studio`;
document.documentElement.style.setProperty("--tile-a", tileA);
document.documentElement.style.setProperty("--tile-b", tileB);

const hero = document.querySelector("#projectHero");
if (hero) {
  hero.style.setProperty("--detail-bg", `linear-gradient(135deg, ${tileA}, ${tileB})`);
}

const media = document.querySelector("#projectMedia");
if (media) {
  media.style.setProperty("--tile-a", tileA);
  media.style.setProperty("--tile-b", tileB);
}

const fields = {
  projectCategory: project.category,
  projectTitle: project.title,
  projectSummary: project.summary,
  projectBody: project.body,
  projectYear: project.year,
  projectFormat: project.format,
  projectStatus: project.status
};

Object.entries(fields).forEach(([id, value]) => {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
});
