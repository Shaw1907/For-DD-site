# Company Studio Website Framework

Static website starter for a company homepage.

## Structure

- `index.html` - homepage with fixed header, interactive network hero, social dock, and waterfall video grid
- `project.html` - reusable project/detail page
- `css/styles.css` - visual system and responsive layout
- `js/network.20260608-v13.js` - animated canvas network module, refined 20-second DD morph with clearer letter structure, denser fine mesh, crisp white nodes, draggable names, and expanding purple hover links
- `js/main.20260608-v8.js` - homepage stable event accordion switching, append-only load-more video grid, YouTube link slots, and scroll-card motion
- `js/project.20260608-v1.js` - detail page rendering from `?id=...`
- `js/person.20260608-v1.js` - person detail page rendering from `?name=...`

Older unversioned scripts may remain in the folder during prototyping, but `index.html`, `project.html`, and `person.html` now load the versioned scripts above.

## Local Preview

Open `index.html` directly in a browser, or run a static server from this folder.

## Next Content To Replace

- Company name and logo mark
- Social URLs
- Project titles, descriptions, years, and categories in `js/main.js`
- Placeholder visual blocks with real image/video assets
- Contact email and domain metadata
