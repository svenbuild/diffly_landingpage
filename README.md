# Diffly — Landing Page

Marketing landing page for [Diffly](https://github.com/svenbuild/diffly), the desktop diff
tool for files and folders.

Live site: [https://diffly.net](https://diffly.net)

Built as a lightweight static site with [Vite](https://vitejs.dev/) — plain HTML, CSS, and a
little vanilla JavaScript, no framework. The design reuses Diffly's own GitHub-dark theme
(blue accent, diff red/green) so the page matches the app.

The hero contains a **live, interactive demo** driven by the very same engine the desktop app
uses — [`@pierre/trees`](https://www.npmjs.com/package/@pierre/trees) for the file tree and
[`@pierre/diffs`](https://www.npmjs.com/package/@pierre/diffs) for the diff view. Clicking a
file in the tree renders its real diff; the Split / Unified toggle re-renders through the diff
engine. The demo code lives in `src/demo.js` and is loaded as a separate chunk so initial paint
stays fast.

## Develop

```bash
npm install
npm run dev      # starts the dev server on http://localhost:5180
```

## Build

```bash
npm run build    # outputs a static site to dist/
npm run preview  # serve the production build locally
```

The `dist/` folder is fully static and can be hosted anywhere (Vercel, Netlify, Cloudflare
Pages, GitHub Pages, …).

## Production

The public production site is hosted at [https://diffly.net](https://diffly.net).

- DNS is managed in Cloudflare.
- `diffly.net` and `www.diffly.net` are proxied through Cloudflare.
- The origin is a Caddy static file site on the VPS.
- `www.diffly.net` permanently redirects to `https://diffly.net`.
- HTTPS is enforced at Cloudflare and Caddy.
- Cloudflare SSL mode is Full Strict with TLS 1.2 minimum.
- Caddy sends security headers including CSP, HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and `frame-ancestors 'none'`.

No NAS paths, internal hostnames, credentials, API tokens, or private service URLs are required
by this repository or the static build. Keep deployment secrets and infrastructure notes out of
the repo.

## Deploy

Production deploys are static file uploads:

```bash
npm run build
# upload dist/ to the VPS static site release directory
# switch the Caddy site symlink to the new release
```

After deploy, verify:

```bash
curl -I https://diffly.net/
curl -I https://www.diffly.net/
curl https://diffly.net/robots.txt
```

## Download button

The primary call-to-action links **directly to the latest full release's Windows installer
(`.exe`)** rather than the GitHub releases page. `src/main.js` resolves it at runtime:

1. It fetches `https://api.github.com/repos/svenbuild/diffly/releases/latest`.
2. It picks the NSIS installer asset (`…Setup x.y.z.exe`), preferring it over the portable
   build.
3. It rewrites every `[data-download]` link to that asset's direct download URL and updates the
   version labels (`[data-version]`).

If the GitHub API is unreachable (offline or rate limited), the buttons keep their static
fallback `href` so they never break.

To point the page at a different repository, change the `REPO` constant at the top of
`src/main.js`.

## Structure

```
index.html        # all markup / sections
src/style.css     # design tokens + all styles
src/main.js       # scroll reveals, nav state, GitHub release wiring
public/           # app icon (copied from Diffly) + favicon
```

## Assets

`public/diffly-mark.png` is Diffly's application icon, copied from the app's
`build/icons/`. Re-copy it from the app repo if the brand mark changes.
