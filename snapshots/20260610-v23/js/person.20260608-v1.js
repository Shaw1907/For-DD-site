const PERSON_SCRIPT_VERSION = "person.20260608-v1";
console.info(`[site] ${PERSON_SCRIPT_VERSION}`);

const personParams = new URLSearchParams(window.location.search);
const personName = personParams.get("name") || "Selected Name";
const personSlug = personParams.get("person") || "selected-name";

document.title = `${personName} | Company Studio`;

const personFields = {
  personName,
  personSlug,
  personSummary: "This page is reserved for related works, biography, project credits, and media connected to this person.",
  personNote: "Later this section can become a video grid, image gallery, writing archive, embedded film, or selected project list."
};

Object.entries(personFields).forEach(([id, value]) => {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
});
