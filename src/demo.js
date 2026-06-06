/* =========================================================================
   Interactive Diffly demo - powered by the SAME engine the app uses:
   @pierre/trees (FileTree) + @pierre/diffs (FileDiff).
   Clicking a file in the tree renders its real diff. Split/Unified toggle
   re-renders through the diff engine. Loaded as a lazy chunk.
   ========================================================================= */
import { FileTree } from '@pierre/trees'
import { FileDiff } from '@pierre/diffs'

/* ---- demo changeset: each file is long enough to fill the diff pane ------ */
const FILES = [
  {
    path: 'src/diff/engine.ts',
    status: 'modified',
    add: 6,
    del: 4,
    before: `import { tokenize } from './lexer'

export function diff(a: string, b: string) {
  const out: Line[] = []
  for (let i = 0; i < a.length; i++) {
    out.push({ type: 'context', text: a[i] })
  }
  return out
}

export function format(lines: Line[]) {
  return lines.map((l) => l.text).join('\\n')
}

export function isEmpty(d: Diff) {
  return d.lines.length === 0
}
`,
    after: `import { tokenize } from './lexer'
import { computeLcs } from './lcs'

export function diff(a: string, b: string, opts: DiffOptions = {}) {
  const out: Line[] = []
  const lcs = computeLcs(tokenize(a), tokenize(b))
  for (const row of lcs) {
    out.push(paint(row, opts))
  }
  return out
}

export function format(lines: Line[]) {
  return lines.map((l) => l.text).join('\\n')
}

export function isEmpty(d: Diff) {
  return d.changed === 0
}
`,
  },
  {
    path: 'src/diff/lcs.ts',
    status: 'added',
    add: 27,
    del: 0,
    before: '',
    after: `// Longest common subsequence for line-level diffing.
import type { Token, Row } from './types'

export function computeLcs(a: Token[], b: Token[]): Row[] {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1))

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i].eq(b[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  return backtrack(a, b, dp)
}

function backtrack(a: Token[], b: Token[], dp: Int32Array[]): Row[] {
  const rows: Row[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i].eq(b[j])) rows.push({ type: 'context', a: i++, b: j++ })
    else if (dp[i + 1][j] >= dp[i][j + 1]) rows.push({ type: 'del', a: i++ })
    else rows.push({ type: 'add', b: j++ })
  }
  return rows
}
`,
  },
  {
    path: 'src/diff/lexer.ts',
    status: 'modified',
    add: 5,
    del: 3,
    before: `export interface Token {
  text: string
  kind: TokenKind
}

export function tokenize(src: string): Token[] {
  const out: Token[] = []
  for (const part of src.split(/\\b/)) {
    out.push({ text: part, kind: classify(part) })
  }
  return out
}

function classify(t: string): TokenKind {
  if (/^\\d+$/.test(t)) return 'number'
  return 'text'
}
`,
    after: `export interface Token {
  text: string
  kind: TokenKind
  eq(other: Token): boolean
}

export function tokenize(src: string, opts: LexOptions = {}): Token[] {
  const out: Token[] = []
  for (const part of src.split(opts.boundary ?? /\\b/)) {
    out.push(new Tok(part, classify(part)))
  }
  return out
}

function classify(t: string): TokenKind {
  if (/^\\d+$/.test(t)) return 'number'
  if (/^["']/.test(t)) return 'string'
  return 'text'
}
`,
  },
  {
    path: 'src/app/session.ts',
    status: 'modified',
    add: 8,
    del: 3,
    before: `import { readState, writeState } from './storage'

export interface Session {
  leftPath: string
  rightPath: string
  selected: string | null
}

export function loadSession(): Session | null {
  const raw = readState('session')
  if (!raw) return null
  return JSON.parse(raw) as Session
}

export function saveSession(s: Session) {
  writeState('session', JSON.stringify(s))
}
`,
    after: `import { readState, writeState } from './storage'
import { debounce } from '../util'

export interface Session {
  version: number
  leftPath: string
  rightPath: string
  selected: string | null
  scrollTop: number
}

export function loadSession(): Session | null {
  const raw = readState('session')
  if (!raw) return null
  const s = JSON.parse(raw) as Session
  return s.version === SCHEMA ? s : null
}

export const saveSession = debounce((s: Session) => {
  writeState('session', JSON.stringify({ ...s, version: SCHEMA }))
}, 200)
`,
  },
  {
    path: 'src/ui/Pane.svelte',
    status: 'modified',
    add: 4,
    del: 2,
    before: `<script lang="ts">
  export let lines: Line[] = []
</script>

<div class="pane">
  {#each lines as line}
    <div class="row">
      <span class="no">{line.no}</span>
      <span class="text">{line.text}</span>
    </div>
  {/each}
</div>

<style>
  .pane { overflow: auto; }
</style>
`,
    after: `<script lang="ts">
  export let lines: Line[] = []
  export let wrap = false
</script>

<div class="pane" class:wrap>
  {#each lines as line (line.id)}
    <div class="row" data-type={line.type}>
      <span class="no">{line.no}</span>
      <span class="text">{line.text}</span>
    </div>
  {/each}
</div>

<style>
  .pane { overflow: auto; }
  .pane.wrap .text { white-space: pre-wrap; }
</style>
`,
  },
  {
    path: 'src/ui/Tree.svelte',
    status: 'modified',
    add: 4,
    del: 2,
    before: `<script lang="ts">
  export let nodes: Node[] = []
</script>

<ul class="tree">
  {#each nodes as node}
    <li>
      <TreeRow {node} />
    </li>
  {/each}
</ul>
`,
    after: `<script lang="ts">
  export let nodes: Node[] = []
  export let selected: string | null = null
</script>

<ul class="tree">
  {#each nodes as node (node.path)}
    <li class:active={node.path === selected}>
      <TreeRow {node} on:select />
    </li>
  {/each}
</ul>
`,
  },
  {
    path: 'src/legacy/naive-diff.ts',
    status: 'deleted',
    add: 0,
    del: 16,
    before: `// Superseded by diff/engine.ts
export function naiveDiff(a: string, b: string) {
  if (a === b) return []
  const out = []
  const al = a.split('\\n')
  const bl = b.split('\\n')
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) {
      out.push({ removed: al[i], added: bl[i] })
    }
  }
  return out
}

export const NAIVE = true
`,
    after: '',
  },
  {
    path: 'README.md',
    status: 'modified',
    add: 9,
    del: 2,
    before: `# Diffly

A desktop diff tool.

## Features
- Compare files

## Build
Run the dev server with npm run dev.
`,
    after: `# Diffly

A fast desktop diff viewer for files and folders.

## Features
- Compare files and whole directory trees
- Side-by-side and unified views
- Syntax highlighting, light & dark themes
- Ignore whitespace and case
- Session restore on restart

## Install
Download the latest release for Windows.

## Build
Run the desktop app with npm run electron:dev.
`,
  },
  {
    path: 'package.json',
    status: 'modified',
    add: 4,
    del: 1,
    before: `{
  "name": "diffly",
  "version": "0.1.5",
  "private": true,
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build"
  },
  "dependencies": {
    "electron-updater": "^6.6.2"
  }
}
`,
    after: `{
  "name": "diffly",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "electron-builder --win nsis portable"
  },
  "dependencies": {
    "@pierre/diffs": "^1.2.5",
    "@pierre/trees": "^1.0.0-beta.4",
    "electron-updater": "^6.6.2"
  }
}
`,
  },
]

const STATUS_LABEL = {
  modified: 'Modified',
  added: 'Added',
  deleted: 'Deleted',
}

const baseName = (p) => p.split('/').pop() || p
const crumbOf = (p) => p.split('/').join('  ›  ')

/* ---- shadow-root theming so the engine matches Diffly's look ------------- */
const DIFF_CSS = `
  :host {
    --diffs-dark-bg: #0d1117;
    --diffs-light-bg: #0d1117;
    --diffs-font-family-override: 'JetBrains Mono', ui-monospace, monospace;
    --diffs-header-font-family: 'Satoshi', system-ui, sans-serif;
    --diffs-font-size: 12.5px;
    --diffs-line-height: 20px;
  }
  *, *::before, *::after { scrollbar-width: none; -ms-overflow-style: none; }
  *::-webkit-scrollbar { width: 0; height: 0; display: none; }
`

const TREE_CSS = `
  :host {
    color-scheme: dark;
    display: flex;
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
    --trees-font-family-override: 'JetBrains Mono', ui-monospace, monospace;
    --trees-font-size-override: 12.5px;
    --trees-bg-override: #0f141b;
    --trees-fg-override: #e6edf3;
    --trees-fg-muted-override: #8b949e;
    --trees-accent-override: #2f81f7;
    --trees-border-color-override: rgba(255, 255, 255, 0.06);
    --trees-selected-bg-override: rgba(47, 129, 247, 0.16);
    --trees-selected-fg-override: #ffffff;
    --trees-focus-ring-color-override: #2f81f7;
    --trees-status-added-override: #3fb950;
    --trees-status-modified-override: #58a6ff;
    --trees-status-deleted-override: #f85149;
    --trees-padding-inline-override: 10px;
  }
  *, *::before, *::after { scrollbar-width: none; -ms-overflow-style: none; }
  *::-webkit-scrollbar { width: 0; height: 0; display: none; }
`

function diffOptions(diffStyle) {
  return {
    theme: 'github-dark',
    themeType: 'dark',
    diffStyle,
    disableFileHeader: true,
    expandUnchanged: false,
    unsafeCSS: DIFF_CSS,
  }
}

export function mountDemo(root) {
  const treeHost = root.querySelector('[data-demo-tree]')
  const diffHost = root.querySelector('[data-demo-diff]')
  const crumbEl = root.querySelector('[data-demo-crumb]')
  const addEl = root.querySelector('[data-demo-add]')
  const delEl = root.querySelector('[data-demo-del]')
  const tagEl = root.querySelector('[data-demo-tag]')
  const filesEl = root.querySelector('[data-demo-files]')
  const viewButtons = Array.from(root.querySelectorAll('[data-view]'))

  if (!treeHost || !diffHost) return

  if (filesEl) filesEl.textContent = `${FILES.length} files changed`

  // On narrow screens the tree is hidden and a split diff is cramped - start
  // unified there so the demo reads cleanly on phones.
  const compact =
    typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 640px)').matches
  let diffStyle = compact ? 'unified' : 'split'
  let current = FILES[0].path
  const fileDiff = new FileDiff(diffOptions(diffStyle))

  const fileFor = (path) => FILES.find((f) => f.path === path) || FILES[0]

  function renderDiff() {
    const f = fileFor(current)
    const name = baseName(current)
    fileDiff.setOptions(diffOptions(diffStyle))
    fileDiff.render({
      oldFile: { name, contents: f.before, cacheKey: `${current}:old` },
      newFile: { name, contents: f.after, cacheKey: `${current}:new` },
      containerWrapper: diffHost,
      forceRender: true,
    })
  }

  function updateMeta() {
    const f = fileFor(current)
    if (crumbEl) crumbEl.textContent = crumbOf(current)
    if (addEl) addEl.textContent = `+${f.add}`
    if (delEl) delEl.textContent = `−${f.del}`
    if (tagEl) {
      tagEl.textContent = STATUS_LABEL[f.status] || ''
      tagEl.dataset.status = f.status
    }
  }

  function select(path) {
    if (!path || path === current) return
    current = path
    updateMeta()
    renderDiff()
  }

  // File tree (left) - real @pierre/trees with git-status badges
  const tree = new FileTree({
    paths: FILES.map((f) => f.path),
    initialExpansion: 'open',
    initialSelectedPaths: [current],
    initialVisibleRowCount: 16,
    search: false,
    icons: { set: 'complete', colored: true },
    gitStatus: FILES.map((f) => ({ path: f.path, status: f.status })),
    unsafeCSS: TREE_CSS,
    onSelectionChange: (paths) => select(paths[0]),
  })
  tree.render({ containerWrapper: treeHost })

  // Split / Unified toggle
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.view === 'unified' ? 'unified' : 'split'
      if (next === diffStyle) return
      diffStyle = next
      viewButtons.forEach((b) => b.classList.toggle('is-active', b === btn))
      renderDiff()
    })
  })

  // reflect the initial layout (may be unified on small screens)
  viewButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.view === diffStyle))

  root.classList.add('demo--ready')
  updateMeta()
  renderDiff()

  return () => {
    fileDiff.cleanUp?.()
    tree.cleanUp?.()
  }
}

/* ---- secondary demo: a real file tree for the "folder trees" feature card -- */
const FOLDER_PATHS = [
  'src/App.svelte',
  'src/main.ts',
  'src/lib/api.ts',
  'src/lib/format.ts',
  'src/lib/compare/CompareViewer.svelte',
  'src/lib/compare/DiffView.svelte',
  'src/lib/compare/DirectoryList.svelte',
  'src/lib/theme/index.ts',
  'src/lib/theme/tokens.ts',
  'src/legacy/old-diff.ts',
  'src/legacy/old-tree.ts',
  'README.md',
  'package.json',
  'tsconfig.json',
]

const FOLDER_STATUS = [
  { path: 'src/App.svelte', status: 'modified' },
  { path: 'src/lib/api.ts', status: 'modified' },
  { path: 'src/lib/format.ts', status: 'modified' },
  { path: 'src/lib/compare/DiffView.svelte', status: 'added' },
  { path: 'src/lib/compare/DirectoryList.svelte', status: 'added' },
  { path: 'src/lib/theme/tokens.ts', status: 'added' },
  { path: 'src/legacy/old-diff.ts', status: 'deleted' },
  { path: 'src/legacy/old-tree.ts', status: 'deleted' },
  { path: 'README.md', status: 'modified' },
]

export function mountFolderTree(el) {
  if (!el) return
  const tree = new FileTree({
    paths: FOLDER_PATHS,
    initialExpansion: 'open',
    initialSelectedPaths: ['src/lib/api.ts'],
    initialVisibleRowCount: 16,
    search: false,
    icons: { set: 'complete', colored: true },
    gitStatus: FOLDER_STATUS,
    unsafeCSS: TREE_CSS,
  })
  tree.render({ containerWrapper: el })
  el.classList.add('demo--ready')
  return () => tree.cleanUp?.()
}
