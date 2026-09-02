const SITE_FOOTER_VERSION = "site-footer.20260903-v4";
console.info(`[site] ${SITE_FOOTER_VERSION}`);

(function initSiteFooter() {
  const RCA_BASE = "https://www.rca.ac.uk";

  const footerLinks = [
    { label: "Privacy & cookies", href: `${RCA_BASE}/data-protection-privacy-cookies/` },
    { label: "Terms & conditions", href: `${RCA_BASE}/terms-conditions/` },
    { label: "Accessibility", href: `${RCA_BASE}/accessibility/` },
    {
      label: "Harassment & sexual misconduct",
      href: `${RCA_BASE}/more/organisation/policies-and-codes-of-practice/harassment-sexual-misconduct/`,
    },
    {
      label: "Modern Slavery Statement",
      href: `${RCA_BASE}/more/organisation/policies-and-codes-of-practice/modern-slavery-statement/`,
    },
    { label: "Media centre", href: `${RCA_BASE}/news-and-events/media-centre/` },
  ];

  function createFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-rca-footer";
    footer.setAttribute("aria-label", "Royal College of Art footer");

    const linksHtml = footerLinks
      .map(
        (item) =>
          `<a class="site-rca-footer__link" href="${item.href}" target="_blank" rel="noopener">${item.label}</a>`
      )
      .join("");

    footer.innerHTML = `
      <div class="site-rca-footer__inner">
        <div class="site-rca-footer__upper">
          <div class="site-rca-footer__brand">
            <a class="site-rca-footer__logo" href="${RCA_BASE}/" target="_blank" rel="noopener" aria-label="Royal College of Art">
              <img class="site-rca-footer__logo-image" src="media/rca-logo.png" alt="Royal College of Art" width="500" height="256">
            </a>
            <p class="site-rca-footer__programme">Digital Direction</p>
            <a class="site-rca-footer__contact" href="${RCA_BASE}/contact-us/" target="_blank" rel="noopener">
              <span>Contact us</span>
              <svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.2 6 6.2 11 1.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-90 6 3.7)"/></svg>
            </a>
          </div>
          <a class="site-rca-footer__qaa" href="https://www.qaa.ac.uk/membership" target="_blank" rel="noopener" aria-label="QAA Membership Badge">
            <span class="site-rca-footer__qaa-label">Member</span>
            <span class="site-rca-footer__qaa-title">QAA</span>
            <span class="site-rca-footer__qaa-year">2024-25</span>
          </a>
        </div>
        <div class="site-rca-footer__lower">
          <nav class="site-rca-footer__links" aria-label="Footer navigation">${linksHtml}</nav>
          <p class="site-rca-footer__address">
            Registered Office: Royal College of Art, Kensington Gore, London SW7 2EU
          </p>
        </div>
      </div>
    `;

    return footer;
  }

  function mountFooter() {
    if (document.querySelector(".site-rca-footer")) return;
    const main = document.querySelector("main");
    const footer = createFooter();
    if (main) main.insertAdjacentElement("afterend", footer);
    else document.body.appendChild(footer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFooter, { once: true });
  } else {
    mountFooter();
  }
})();
