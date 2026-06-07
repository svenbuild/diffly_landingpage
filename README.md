# Diffly Landing Page

Static landing page for [Diffly](https://github.com/svenbuild/diffly).

Live: https://diffly.net

## Setup

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5180`.

## Build

```bash
npm run build
npm run preview
```

The production output is written to `dist/`.

## Project

```text
index.html      Page markup
src/style.css   Styles
src/main.js     UI behavior and release download link
src/demo.js     Interactive diff demo
public/         Static assets
```

## Notes

- The download button resolves the latest Windows installer from the Diffly GitHub release.
- The page is plain HTML, CSS, and vanilla JavaScript with Vite.
- Keep deployment secrets and infrastructure notes out of this repository.
