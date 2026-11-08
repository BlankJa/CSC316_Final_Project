# City X-ray: Look beneath the headline

A CSC316 (Data Visualization, University of Toronto) data story about how Toronto's public resources are distributed, and why headline totals can mislead.

> Before judging whether a community is well served, residents should ask what a number includes and how many people it serves.

**Team:** Ken (Henry) Chen, Jacob Zhou, Connie (Mengxuan) Guo

**Status:** Prototype I, work in progress. The storyboard is in [`docs/storyboard.jpg`](docs/storyboard.jpg).

## Run locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly will block data loading.

There is no build step. D3 v7.9.0 and the fonts load from CDNs, so you need an internet connection.

## Folder structure and owners

| Path | Purpose | Owner |
|---|---|---|
| `index.html` | Page and chart containers | Connie |
| `css/variables.css` | Shared palette, fonts, spacing | Connie |
| `css/style.css` | Layout and sections | Connie |
| `js/main.js` | Chart loading, scroll observers, progress nav | Connie |
| `js/charts/hook.js` | Section 1: 158-dot hook | Connie |
| `js/charts/lens.js` | Section 5: X-ray lens | Connie |
| `js/charts/treemap.js` | Section 2: budget treemap, spending lenses and $100 receipts | Jacob |
| `js/charts/grossNet.js` | Section 3: gross vs net budget comparison | Jacob |
| `js/charts/libraryRates.js` | Section 4: per-resident rates (stub) | Ken |
| `js/utils/placeholder.js` | Shared placeholder and error cards | Connie |
| `js/utils/tooltip.js` | Shared tooltip helper | Connie |
| `data/` | Cleaned data; see [`data/README.md`](data/README.md) | Each chart's owner |
| `docs/storyboard.jpg` | Final hand-drawn storyboard | Team |

## Chart interface

Every chart file exports one function with the same shape:

```js
export function renderX(selector, data, options) { ... }
```

`js/main.js` loads the data and calls it. To connect your chart, set its `dataPath` in the `CHARTS` list in `main.js`.

Each chart must:

- Draw only inside its own container (`#hook-chart`, `#treemap-chart`, `#grossnet-chart`, `#library-chart`, `#lens-chart`).
- Read colours from the CSS variables.
- Handle window resize, for example with a `ResizeObserver` on the container.
- Skip animation when `prefers-reduced-motion` is set.
- Keep a text alternative. Update the `<figcaption>` beside your container in `index.html` when your chart's finding changes.

If a chart throws an error or its data file fails to load, `main.js` shows a friendly message in that container and the rest of the page keeps working. Details are in the browser console.

D3 is available as the global `d3`. Each stub has a TODO block at the top listing its data, suggested encoding and colours.

## Palette

All colours are in `css/variables.css`. Use the variables and do not add hex values to chart files.

```js
selection.style('fill', 'var(--teal)');   // use .style, not .attr, for var()
```

| Variable | Use |
|---|---|
| `--paper`, `--card` | Backgrounds |
| `--ink` | Main text and outlines; safe on every colour here |
| `--muted` | Secondary text on `--paper` or `--card` only |
| `--grid` | Light rules and texture |
| `--peach`, `--rose`, `--teal`, `--lime` | Chart fills; add an `--ink` outline |
| `--highlight` | Highlighter behind key numbers |
| `--accent` | Emphasis, focus, marks that must stand out |

Never use colour as the only way to encode meaning. Add a label, pattern or position.

## Git workflow

1. Pull before starting: `git checkout main && git pull`.
2. Work on your own branch: `git checkout -b feature/treemap`.
3. Only edit your own chart file unless the team has agreed otherwise.
4. Push your branch and open a pull request to merge into `main`.
