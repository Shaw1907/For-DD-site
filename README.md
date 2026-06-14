# Company Studio Website Framework

Static website starter for a company homepage.

## Structure

- `index.html` - homepage with fixed header, interactive network hero, social dock, and waterfall video grid
- `mobile.html` - mobile experiment fork kept for comparison only; not the production entry
- `project.html` - reusable project/detail page
- `css/styles.css` - visual system and responsive layout
- `css/mobile.20260614-v1.css` - mobile-only experiment fork kept out of the production entry
- `js/responsive-controller.20260614-v1.js` - shared responsive state helper for breakpoint/input/orientation metadata
- `js/device-router.20260614-v1.js` - old routing experiment, no longer loaded by production pages
- `js/network.20260614-v23.js` - animated canvas network module and profile overlay data binding with protected DD targets, global all-name connection field, robust phone-detected vertical DD, profile bio/project/social/process placeholders, and draggable/tappable names
- `js/main.20260608-v8.js` - homepage stable event accordion switching, append-only load-more video grid, YouTube link slots, and scroll-card motion
- `js/mobile-network.20260614-v11.js` - mobile-only network module fork
- `js/mobile-main.20260614-v1.js` - mobile-only homepage interaction fork
- `js/project.20260608-v1.js` - detail page rendering from `?id=...`
- `js/person.20260608-v1.js` - person detail page rendering from `?name=...`

Older unversioned scripts may remain in the folder during prototyping, but active pages load the versioned scripts above.

## Responsive Delivery Model

- `index.html` is the production entry for GitHub Pages and custom domains.
- The production model uses one URL, one content tree, and one shared desktop/mobile code path.
- CSS media queries own the layout breakpoints: mobile <= 680px, tablet <= 1024px, desktop <= 1440px, and wide > 1440px.
- `js/responsive-controller.20260614-v1.js` does not redirect. It only annotates the document with `html[data-breakpoint]`, `html[data-input]`, and `html[data-orientation]` so interactions can adapt to touch, mouse, and ambiguous devices.
- Ambiguous devices such as tablets, foldables, resized desktop windows, and browser zoom states stay on the same URL and flow through CSS breakpoints.

## Local Preview

Open `index.html` directly in a browser, or run a static server from this folder.

## Next Content To Replace

- Company name and logo mark
- Social URLs
- Project titles, descriptions, years, and categories in `js/main.js`
- Placeholder visual blocks with real image/video assets
- Contact email and domain metadata
