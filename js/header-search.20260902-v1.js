const HEADER_SEARCH_VERSION = "header-search.20260902-v4";
console.info(`[site] ${HEADER_SEARCH_VERSION}`);

(function initHeaderSearch() {
  const SEARCH_ICON = `
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
      <path d="M16.2 16.2 20.5 20.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
    </svg>
  `;

  function getSearchNames() {
    if (typeof PROFILE_DATA === "object" && PROFILE_DATA) {
      return Object.keys(PROFILE_DATA).sort((a, b) => a.localeCompare(b));
    }
    return [];
  }

  function normalizeQuery(value) {
    if (typeof foldSearchText === "function") {
      return foldSearchText(value);
    }
    return (value || "")
      .trim()
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/[\u2018\u2019'`´]/g, "")
      .replace(/\u3000/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function getNameSearchSources(name) {
    const profile = typeof PROFILE_DATA === "object" && PROFILE_DATA ? PROFILE_DATA[name] : null;
    const aliases = Array.isArray(profile?.searchAliases) ? profile.searchAliases : [];
    return [name, ...aliases];
  }

  function splitNameTokens(name) {
    return normalizeQuery(name)
      .replace(/[()]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function nameSearchVariants(name) {
    const normalized = normalizeQuery(name);
    const tokens = splitNameTokens(name);
    const reversed = [...tokens].reverse().join(" ");
    const compact = tokens.join("");
    const initials = tokens.map((token) => token[0] || "").join("");

    return { normalized, tokens, reversed, compact, initials };
  }

  function tokenMatches(queryToken, nameToken) {
    if (!queryToken || !nameToken) return false;
    if (nameToken.startsWith(queryToken) || queryToken.startsWith(nameToken)) return true;
    if (nameToken.includes(queryToken) || queryToken.includes(nameToken)) return true;
    return false;
  }

  function isSubsequence(needle, haystack) {
    if (!needle) return false;
    let index = 0;
    for (const char of haystack) {
      if (char === needle[index]) index += 1;
      if (index === needle.length) return true;
    }
    return false;
  }

  function scoreSingleNameMatch(name, query) {
    const needle = normalizeQuery(query);
    if (!needle) return 0;

    const variants = nameSearchVariants(name);
    const queryTokens = needle.split(/\s+/).filter(Boolean);

    if (variants.normalized === needle || variants.reversed === needle) return 1000;
    if (variants.normalized.startsWith(needle) || variants.reversed.startsWith(needle)) return 900;

    if (queryTokens.length > 1) {
      const allStart = queryTokens.every((qt) =>
        variants.tokens.some((nt) => nt.startsWith(qt))
      );
      if (allStart) return 850;

      const allPartial = queryTokens.every((qt) =>
        variants.tokens.some((nt) => tokenMatches(qt, nt))
      );
      if (allPartial) return 800;

      return 0;
    }

    if (variants.tokens.some((nt) => nt.startsWith(needle))) return 750;
    if (variants.normalized.includes(needle) || variants.reversed.includes(needle)) return 700;
    if (variants.compact.includes(needle)) return 650;
    if (variants.tokens.some((nt) => tokenMatches(needle, nt))) return 600;
    if (needle.length >= 2 && variants.initials.startsWith(needle)) return 550;
    if (needle.length >= 2 && isSubsequence(needle, variants.compact)) return 500;

    return 0;
  }

  function scoreNameMatch(name, query) {
    return Math.max(
      0,
      ...getNameSearchSources(name).map((source) => scoreSingleNameMatch(source, query))
    );
  }

  function filterNames(query) {
    const needle = normalizeQuery(query);
    if (!needle) return [];

    return getSearchNames()
      .map((name) => ({ name, score: scoreNameMatch(name, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((entry) => entry.name);
  }

  function findExactMatch(query, matches = []) {
    const needle = normalizeQuery(query);
    if (!needle) return null;

    const candidates = matches.length ? matches : getSearchNames();
    for (const name of candidates) {
      for (const source of getNameSearchSources(name)) {
        const variants = nameSearchVariants(source);
        if (variants.normalized === needle || variants.reversed === needle) {
          return name;
        }
      }
    }
    return null;
  }

  function pickSubmitMatch(query) {
    const matches = filterNames(query);
    const exact = findExactMatch(query, matches);
    if (exact) return exact;
    if (matches.length === 1) return matches[0];
    if (!matches.length) return null;

    const scored = getSearchNames()
      .map((name) => ({ name, score: scoreNameMatch(name, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    if (!scored.length) return null;
    if (scored[0].score >= 900) return scored[0].name;
    if (scored.length === 1) return scored[0].name;
    if (scored.length > 1 && scored[0].score - scored[1].score >= 200) return scored[0].name;

    return null;
  }

  function resolveProfileName(name) {
    if (typeof getCanonicalProfileName === "function") {
      return getCanonicalProfileName(name);
    }
    return name;
  }

  function openProfile(name) {
    const canonical = resolveProfileName(name);
    if (typeof window.openNetworkProfileByName === "function" && window.openNetworkProfileByName(canonical)) {
      return;
    }

    const target = `index.html?profile=${encodeURIComponent(canonical)}#network`;
    if (window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/")) {
      window.location.hash = "network";
      window.location.search = `?profile=${encodeURIComponent(canonical)}`;
      return;
    }

    window.location.href = target;
  }

  function createSearchForm() {
    const form = document.createElement("form");
    form.className = "header-search";
    form.setAttribute("role", "search");
    form.innerHTML = `
      <label class="visually-hidden" for="headerSearch-${Math.random().toString(36).slice(2, 8)}">Search network</label>
      <div class="header-search-field">
        <input
          class="header-search-input"
          type="search"
          name="q"
          placeholder="Search"
          autocomplete="off"
          enterkeyhint="search"
          spellcheck="false"
        >
        <button class="header-search-button" type="submit" aria-label="Search">
          ${SEARCH_ICON}
        </button>
      </div>
      <div class="header-search-results" hidden></div>
    `;

    const input = form.querySelector(".header-search-input");
    const results = form.querySelector(".header-search-results");
    const label = form.querySelector("label");
    const inputId = `headerSearch-${Math.random().toString(36).slice(2, 8)}`;
    input.id = inputId;
    label.setAttribute("for", inputId);

    function hideResults() {
      results.hidden = true;
      results.innerHTML = "";
    }

    function renderResults(matches) {
      results.innerHTML = "";
      if (!matches.length) {
        hideResults();
        return;
      }

      matches.forEach((name) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "header-search-result";
        button.textContent = name;
        button.addEventListener("click", () => {
          input.value = name;
          hideResults();
          openProfile(name);
        });
        results.appendChild(button);
      });
      results.hidden = false;
    }

    input.addEventListener("input", () => {
      renderResults(filterNames(input.value));
    });

    input.addEventListener("focus", () => {
      renderResults(filterNames(input.value));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const selected = pickSubmitMatch(input.value);
      if (selected) {
        openProfile(selected);
        hideResults();
        return;
      }
      renderResults(filterNames(input.value));
    });

    document.addEventListener("click", (event) => {
      if (!form.contains(event.target)) hideResults();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideResults();
        input.blur();
      }
    });

    return form;
  }

  function mountSearch() {
    document.querySelectorAll(".site-header").forEach((header) => {
      if (header.querySelector(".header-search")) return;
      const nav = header.querySelector(".nav-links");
      if (!nav) return;
      header.insertBefore(createSearchForm(), nav);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSearch, { once: true });
  } else {
    mountSearch();
  }
})();
