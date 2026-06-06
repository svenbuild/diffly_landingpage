# Diffly — Landing Page

Marketing landing page for [Diffly](https://github.com/svenbuild/diffly), the desktop diff
tool for files and folders.

Built as a lightweight static site with [Vite](https://vitejs.dev/) — plain HTML, CSS, and a
little vanilla JavaScript, no framework. The design reuses Diffly's own GitHub-dark theme
(blue accent, diff red/green) so the page matches the app.

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
