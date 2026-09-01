const PERSON_SCRIPT_VERSION = "person.20260608-v1";
console.info(`[site] ${PERSON_SCRIPT_VERSION}`);

const personParams = new URLSearchParams(window.location.search);
const personName = personParams.get("name") || "Selected Name";
const personSlug = personParams.get("person") || "selected-name";
const profile = typeof getProfileByName === "function" ? getProfileByName(personName) : null;

document.title = `${personName} | Company Studio`;

const personFields = {
  personName,
  personSlug: profile?.project?.title || personSlug,
  personSummary: profile?.bio
    || "This page is reserved for related works, biography, project credits, and media connected to this person.",
  personNote: profile?.project
    ? `${profile.project.title}. ${profile.project.description}`
    : "Later this section can become a video grid, image gallery, writing archive, embedded film, or selected project list."
};

Object.entries(personFields).forEach(([id, value]) => {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
});

const metaStatus = document.querySelector(".project-meta dd:last-child");
if (metaStatus && profile) {
  metaStatus.textContent = "Published";
}

const copy = document.querySelector(".project-copy");
if (copy && profile) {
  const links = document.createElement("p");
  const parts = [];
  if (profile.email) parts.push(`Email: ${profile.email}`);
  if (profile.instagram) parts.push(`Instagram: @${profile.instagram.replace(/^@/, "")}`);
  if (profile.website) parts.push(`Website: ${profile.website}`);
  if (profile.youtube || profile.project?.youtube) {
    parts.push(`YouTube: ${profile.youtube || profile.project.youtube}`);
  }
  if (profile.rednote) parts.push(`REDnote: ${profile.rednote}`);
  if (profile.project?.imagesDrive) parts.push(`Images: ${profile.project.imagesDrive}`);
  links.textContent = parts.join(" · ");
  copy.appendChild(links);
}
