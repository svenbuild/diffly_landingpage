# Diffly Landing

Landing page for [Diffly](https://github.com/svenbuild/diffly), a Windows desktop app for comparing files and folders.

**Live site:** https://diffly.net

## Stack

- Vite
- Plain HTML, CSS, and JavaScript
- `@pierre/diffs` and `@pierre/trees` for the interactive demo

## Development

```bash
npm install
npm run dev
```

Vite serves the site at `http://localhost:5180`.

## Build

```bash
npm run build
```

The static build is generated in `dist/`.

## Preview

```bash
npm run preview
```

## Repository Layout

```text
index.html       Page markup
src/style.css    Styles
src/main.js      Navigation, download link, release version
src/demo.js      Interactive demo
public/          Static assets
```

## Deployment

Upload the contents of `dist/` to the production static site.

Keep credentials, server paths, and infrastructure notes out of this repository.
