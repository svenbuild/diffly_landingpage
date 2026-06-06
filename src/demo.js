/* =========================================================================
   Interactive Diffly demo — powered by the SAME engine the app uses:
   @pierre/trees (FileTree) + @pierre/diffs (FileDiff).
   Clicking a file in the tree renders its real diff. Split/Unified toggle
   re-renders through the diff engine. Loaded as a lazy chunk.
   ========================================================================= */
import { FileTree } from '@pierre/trees'
import { FileDiff } from '@pierre/diffs'

/* ---- demo changeset (realistic before/after content) -------------------- */
const FILES = [
  {
    path: 'src/diff/engine.ts',
    status: 'modified',
    add: 5,
    del: 3,
    before: `import { tokenize } from './lexer'

export function diff(a: string, b: string) {
  const out: Line[] = []
  for (let i = 0; i < a.length; i++) {
    out.push({ type: 'context', text: a[i] })
  }
  return out
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
`,
  },
  {
    path: 'src/diff/lcs.ts',
    status: 'added',
    add: 14,
    del: 0,
    before: '',
    after: `// Longest common subsequence for line-level diffing.
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
`,
  },
  {
    path: 'src/ui/Pane.svelte',
    status: 'modified',
    add: 6,
    del: 2,
    before: `<script lang="ts">
  export let lines: Line[] = []
</script>

{#each lines as line}
  <div class="row">{line.text}</div>
{/each}
`,
    after: `<script lang="ts">
  export let lines: Line[] = []
  export let wrap = false
</script>

{#each lines as line (line.id)}
  <div class="row" class:wrap data-type={line.type}>
    <span class="gutter">{line.no}</span>
    {line.text}
  </div>
{/each}
`,
  },
  {
    path: 'src/legacy/naive-diff.ts',
    status: 'deleted',
    add: 0,
    del: 6,
    before: `// Superseded by diff/engine.ts
export function naiveDiff(a: string, b: string) {
  if (a === b) return []
  return [{ removed: a }, { added: b }]
}
`,
    after: '',
  },
  {
    path: 'README.md',
    status: 'modified',
    add: 4,
    del: 1,
    before: `# Diffly

A desktop diff tool.

## Features
- Compare files
`,
    after: `# Diffly

A fast desktop diff viewer for files and folders.

## Features
- Compare files and whole directory trees
- Side-by-side and unified views
- Selective hunk merging
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
  const viewButtons = Array.from(root.querySelectorAll('[data-view]'))

  if (!treeHost || !diffHost) return

  // On narrow screens the tree is hidden and a split diff is cramped — start
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

  // File tree (left) — real @pierre/trees with git-status badges
  const tree = new FileTree({
    paths: FILES.map((f) => f.path),
    initialExpansion: 'open',
    initialSelectedPaths: [current],
    initialVisibleRowCount: 12,
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
