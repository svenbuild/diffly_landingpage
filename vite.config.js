import { defineConfig } from 'vite'

// Diffly app repository the desktop builds are published from.
const REPO = 'svenbuild/diffly'

/**
 * Resolve the latest full release (version + direct installer URL) from GitHub.
 * Returns null on any failure so the build never breaks when offline / rate
 * limited.
 */
async function fetchLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'diffly-landing-build',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const release = await res.json()
    const exes = (release.assets || []).filter((a) => /\.exe$/i.test(a.name))
    const installer =
      exes.find((a) => /setup/i.test(a.name)) ||
      exes.find((a) => !/portable/i.test(a.name)) ||
      exes[0]
    const version = release.tag_name || release.name
    if (!version) return null
    return { version, url: installer ? installer.browser_download_url : release.html_url }
  } catch {
    return null
  }
}

/**
 * Bake the current release into index.html at build time so the version label
 * and download links are correct on first paint and without JavaScript. The
 * runtime fetch in src/main.js still refreshes everything on each visit, so the
 * page stays current between deploys too. Targets only the [data-version],
 * [data-download] and [data-download-label] hooks, so the markup/UI is untouched.
 */
function injectLatestRelease() {
  return {
    name: 'inject-latest-release',
    apply: 'build',
    async transformIndexHtml(html) {
      const release = await fetchLatestRelease()
      if (!release) {
        this.warn?.('inject-latest-release: could not reach GitHub, keeping static values')
        return html
      }
      const { version, url } = release
      const out = html
        .replace(/(\sdata-version[^>]*>)[^<]*/g, `$1${version}`)
        .replace(/(\sdata-download\s+href=")[^"]*(")/g, `$1${url}$2`)
        .replace(/(\sdata-download-label[^>]*>)[^<]*/g, `$1Download ${version} (.exe)`)
      // eslint-disable-next-line no-console
      console.log(`inject-latest-release: baked ${version}`)
      return out
    },
  }
}

// Static landing page for Diffly. No framework - plain HTML/CSS/JS bundled by Vite.
export default defineConfig({
  plugins: [injectLatestRelease()],
  server: {
    port: 5180,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
})
