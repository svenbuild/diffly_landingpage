import './style.css'

/* -------------------------------------------------------------------------
   Diffly app repository (source of the desktop builds)
   ------------------------------------------------------------------------- */
const REPO = 'svenbuild/diffly'

/* -------------------------------------------------------------------------
   Nav: condensed/blurred background once the page scrolls
   ------------------------------------------------------------------------- */
const nav = document.getElementById('nav')
const onScroll = () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 12)
}
onScroll()
window.addEventListener('scroll', onScroll, { passive: true })

/* -------------------------------------------------------------------------
   Reveal-on-scroll with light, grouped staggering
   ------------------------------------------------------------------------- */
const reveals = Array.from(document.querySelectorAll('.reveal'))

reveals.forEach((el) => {
  let d = 0
  if (el.dataset.delay) {
    d = Number(el.dataset.delay)
  } else {
    const parent = el.parentElement
    if (parent && (parent.classList.contains('bento') || parent.classList.contains('steps'))) {
      d = Array.prototype.indexOf.call(parent.children, el)
    }
  }
  el.style.setProperty('--d', String(d))
})

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('in')
        if (entry.target.classList.contains('hero-window')) {
          entry.target.classList.add('settled')
        }
        io.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )
  reveals.forEach((el) => io.observe(el))
} else {
  reveals.forEach((el) => el.classList.add('in', 'settled'))
}

/* Settle the hero window shortly after load even before it is scrolled. */
const heroWindow = document.querySelector('.hero-window')
if (heroWindow) {
  requestAnimationFrame(() => {
    heroWindow.classList.add('in')
    setTimeout(() => heroWindow.classList.add('settled'), 650)
  })
}

/* -------------------------------------------------------------------------
   Live demo - lazy chunk that boots the real @pierre diff/tree engine.
   Loaded immediately (it is the hero centerpiece) but kept out of the main
   bundle so initial paint stays fast.
   ------------------------------------------------------------------------- */
const demoRoot = document.querySelector('[data-demo]')
const folderTreeEl = document.querySelector('[data-folder-tree]')
if (demoRoot || folderTreeEl) {
  import('./demo.js')
    .then((m) => {
      if (demoRoot) m.mountDemo(demoRoot)
      if (folderTreeEl) m.mountFolderTree(folderTreeEl)
    })
    .catch((err) => console.warn('Diffly demo failed to load:', err))
}

/* -------------------------------------------------------------------------
   Wire the download buttons to the latest full release's assets.
   Fetches the GitHub release at runtime so links never go stale on a new
   version. The primary buttons point at the visitor's platform; the
   platform list links every artifact. Falls back gracefully to the release
   page if the API is unavailable (offline / rate limited).
   ------------------------------------------------------------------------- */
/* Static fallback: direct asset URLs for the newest release at build time.
   Used immediately on load and kept if the GitHub API is unreachable, so the
   download buttons always point at a real file, never at a GitHub page. */
const FALLBACK_VERSION = 'v0.2.3'
const FALLBACK_ASSETS = {
  'win-setup': 'Diffly-Setup-0.2.3.exe',
  'win-portable': 'Diffly-0.2.3.exe',
  'mac-dmg': 'Diffly-0.2.3-arm64.dmg',
  'mac-zip': 'Diffly-0.2.3-arm64-mac.zip',
  'linux-appimage': 'Diffly-0.2.3.AppImage',
  'linux-deb': 'diffly_0.2.3_amd64.deb',
}
const fallbackUrl = (key) =>
  `https://github.com/${REPO}/releases/download/${FALLBACK_VERSION}/${FALLBACK_ASSETS[key]}`

const ASSET_MATCHERS = {
  'win-setup': (n) => /setup.*\.exe$/i.test(n),
  'win-portable': (n) => /\.exe$/i.test(n) && !/setup/i.test(n),
  'mac-dmg': (n) => /\.dmg$/i.test(n),
  'mac-zip': (n) => /mac\.zip$/i.test(n),
  'linux-appimage': (n) => /\.appimage$/i.test(n),
  'linux-deb': (n) => /\.deb$/i.test(n),
}

function detectPlatform() {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return { key: 'win-setup', label: 'Windows' }
  if (/Macintosh|Mac OS X/i.test(ua)) return { key: 'mac-dmg', label: 'macOS' }
  if (/Linux/i.test(ua)) return { key: 'linux-appimage', label: 'Linux' }
  return null
}

function formatSize(bytes) {
  if (!bytes) return ''
  return ` · ${(bytes / 1048576).toFixed(0)} MB`
}

function setLabels(platform, version, size) {
  document.querySelectorAll('[data-hero-download-label]').forEach((el) => {
    el.textContent = `Download for ${platform.label}`
  })
  const label = `Download ${version || ''} for ${platform.label}${formatSize(size)}`
  document.querySelectorAll('[data-download-label]').forEach((el) => {
    el.textContent = label.replace(/\s+/g, ' ').trim()
  })
}

/* Wire everything from the static fallback right away, so the buttons point
   at a direct file download even before (or without) the API response. */
const platform = detectPlatform() || { key: 'win-setup', label: 'Windows' }

document.querySelectorAll('[data-dl]').forEach((a) => {
  if (FALLBACK_ASSETS[a.dataset.dl]) a.href = fallbackUrl(a.dataset.dl)
})
document.querySelectorAll('[data-download]').forEach((a) => {
  a.href = fallbackUrl(platform.key)
})
setLabels(platform, FALLBACK_VERSION)

/* Then refresh URLs, version, and sizes from the latest GitHub release. */
async function wireDownloads() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const release = await res.json()

    const assets = release.assets || []
    const version = release.tag_name || release.name
    const findAsset = (key) => assets.find((a) => ASSET_MATCHERS[key]?.(a.name)) || null

    // Per-platform links (dropdown menus).
    document.querySelectorAll('[data-dl]').forEach((a) => {
      const asset = findAsset(a.dataset.dl)
      if (asset) a.href = asset.browser_download_url
    })

    // Primary buttons follow the visitor's platform.
    const primary = findAsset(platform.key)
    if (primary) {
      document.querySelectorAll('[data-download]').forEach((a) => {
        a.href = primary.browser_download_url
      })
    }

    if (version) {
      document.querySelectorAll('[data-version]').forEach((el) => {
        el.textContent = version
      })
    }
    setLabels(platform, version || FALLBACK_VERSION, primary?.size)
  } catch (err) {
    // Keep the static fallback hrefs already wired above.
    console.warn('Diffly: could not resolve latest release -', err.message)
  }
}

wireDownloads()

/* -------------------------------------------------------------------------
   Split-button dropdowns: toggle, close on outside click or Escape.
   ------------------------------------------------------------------------- */
document.querySelectorAll('[data-dl-split]').forEach((split) => {
  const toggle = split.querySelector('[data-dl-toggle]')
  const menu = split.querySelector('[data-dl-menu]')
  if (!toggle || !menu) return

  const close = () => {
    menu.hidden = true
    toggle.setAttribute('aria-expanded', 'false')
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation()
    const open = menu.hidden
    // Close any other open menu first.
    document.querySelectorAll('[data-dl-menu]').forEach((m) => (m.hidden = true))
    document
      .querySelectorAll('[data-dl-toggle]')
      .forEach((t) => t.setAttribute('aria-expanded', 'false'))
    if (open) {
      menu.hidden = false
      toggle.setAttribute('aria-expanded', 'true')
    }
  })

  menu.addEventListener('click', close)
  document.addEventListener('click', (e) => {
    if (!split.contains(e.target)) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })
})
