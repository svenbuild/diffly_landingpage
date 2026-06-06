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
   Wire the download buttons to the latest full release's installer .exe.
   Fetches the GitHub release at runtime so links never go stale on a new
   version. Falls back gracefully to the release page if the API is
   unavailable (offline / rate limited).
   ------------------------------------------------------------------------- */
function pickInstaller(assets = []) {
  const exes = assets.filter((a) => /\.exe$/i.test(a.name))
  // Prefer the NSIS installer ("...Setup x.y.z.exe") over the portable build.
  return (
    exes.find((a) => /setup/i.test(a.name)) ||
    exes.find((a) => !/portable/i.test(a.name)) ||
    exes[0] ||
    null
  )
}

function formatSize(bytes) {
  if (!bytes) return ''
  return ` · ${(bytes / 1048576).toFixed(0)} MB`
}

async function wireDownloads() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) throw new Error(`GitHub API ${res.status}`)
    const release = await res.json()

    const installer = pickInstaller(release.assets)
    const href = installer ? installer.browser_download_url : release.html_url
    const version = release.tag_name || release.name

    document.querySelectorAll('[data-download]').forEach((a) => {
      a.href = href
      a.removeAttribute('target')
      if (installer) a.setAttribute('download', '')
    })

    if (version) {
      document.querySelectorAll('[data-version]').forEach((el) => {
        el.textContent = version
      })
    }

    if (installer) {
      const label = `Download ${version || 'installer'} (.exe)${formatSize(installer.size)}`
      document.querySelectorAll('[data-download-label]').forEach((el) => {
        el.textContent = label
      })
    }
  } catch (err) {
    // Keep the static fallback hrefs already present in the markup.
    console.warn('Diffly: could not resolve latest release -', err.message)
  }
}

wireDownloads()
