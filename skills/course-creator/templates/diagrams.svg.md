# Common SVG diagram patterns

All patterns share a single `<marker id="arr-X">` for arrowheads — rename `arr-X` per diagram (e.g., `arr-s2`, `arr-s7`) so multiple SVGs on the same page don't collide.

Palette:
- Box (neutral): `fill="#1b212b" stroke="#3a4250"`
- Box (your code / highlight): `fill="#14281c" stroke="#3fb950"`
- Box (gateway / accent): `fill="#1e2736" stroke="#5aa9ff"`
- Box (auth / purple): `fill="#2a1d33" stroke="#a371f7"`
- Box (warn / secrets): `fill="#2a2318" stroke="#d29922"`
- Box (dashed = optional / draining): add `stroke-dasharray="3 3"`
- Arrow stroke: `#5aa9ff`
- Text on dark: `fill="#e6e6e6"` (heading), `fill="#9aa3af"` (body)
- Font: `font-family="ui-sans-serif, system-ui"` for labels, `font-family="ui-mono, Menlo, monospace"` for code

## 1. Boxes + arrows (linear flow)

```svg
<svg viewBox="0 0 720 200" role="img" aria-label="A flows into B flows into C">
  <defs>
    <marker id="arr-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#5aa9ff"/>
    </marker>
  </defs>
  <rect x="20"  y="80" width="160" height="60" rx="10" fill="#1b212b" stroke="#3a4250"/>
  <text x="100" y="115" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle">A</text>
  <line x1="180" y1="110" x2="280" y2="110" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-1)"/>
  <rect x="280" y="80" width="160" height="60" rx="10" fill="#14281c" stroke="#3fb950"/>
  <text x="360" y="115" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle">B</text>
  <line x1="440" y1="110" x2="540" y2="110" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-1)"/>
  <rect x="540" y="80" width="160" height="60" rx="10" fill="#1b212b" stroke="#3a4250"/>
  <text x="620" y="115" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle">C</text>
</svg>
```

## 2. Sequence diagram with lifelines

Three actors with vertical dashed lifelines and labeled horizontal arrows. Stack messages top-to-bottom in chronological order.

```svg
<svg viewBox="0 0 780 280" role="img" aria-label="Sequence between client, server, and backend">
  <defs>
    <marker id="arr-2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#5aa9ff"/>
    </marker>
  </defs>
  <!-- actor headers -->
  <rect x="20"  y="18" width="140" height="36" rx="8" fill="#1b212b" stroke="#3a4250"/>
  <text x="90"  y="41" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" text-anchor="middle" font-weight="600">Client</text>
  <rect x="320" y="18" width="140" height="36" rx="8" fill="#14281c" stroke="#3fb950"/>
  <text x="390" y="41" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" text-anchor="middle" font-weight="600">Server</text>
  <rect x="620" y="18" width="140" height="36" rx="8" fill="#1b212b" stroke="#3a4250"/>
  <text x="690" y="41" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" text-anchor="middle" font-weight="600">Backend</text>
  <!-- lifelines -->
  <line x1="90"  y1="58" x2="90"  y2="260" stroke="#3a4250" stroke-dasharray="3 3"/>
  <line x1="390" y1="58" x2="390" y2="260" stroke="#3a4250" stroke-dasharray="3 3"/>
  <line x1="690" y1="58" x2="690" y2="260" stroke="#3a4250" stroke-dasharray="3 3"/>
  <!-- messages -->
  <line x1="90"  y1="90" x2="390" y2="90" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-2)"/>
  <text x="240" y="84" fill="#9aa3af" font-family="ui-mono, Menlo, monospace" font-size="10" text-anchor="middle">1. request</text>
  <line x1="390" y1="130" x2="690" y2="130" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-2)"/>
  <text x="540" y="124" fill="#9aa3af" font-family="ui-mono, Menlo, monospace" font-size="10" text-anchor="middle">2. fetch</text>
  <line x1="690" y1="170" x2="390" y2="170" stroke="#3fb950" stroke-width="2" marker-end="url(#arr-2)"/>
  <text x="540" y="164" fill="#9aa3af" font-family="ui-mono, Menlo, monospace" font-size="10" text-anchor="middle">3. data</text>
  <line x1="390" y1="210" x2="90" y2="210" stroke="#3fb950" stroke-width="2" marker-end="url(#arr-2)"/>
  <text x="240" y="204" fill="#9aa3af" font-family="ui-mono, Menlo, monospace" font-size="10" text-anchor="middle">4. response</text>
</svg>
```

## 3. Comparison (three side-by-side)

For "approach A vs B vs C" or before/middle/after.

```svg
<svg viewBox="0 0 760 220" role="img" aria-label="Three approaches compared">
  <text x="10"  y="22" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" font-weight="600">A — option one</text>
  <rect x="10"  y="32" width="240" height="160" rx="10" fill="#1b212b" stroke="#3a4250"/>
  <!-- inner detail -->

  <text x="260" y="22" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" font-weight="600">B — option two</text>
  <rect x="260" y="32" width="240" height="160" rx="10" fill="#1e2736" stroke="#5aa9ff"/>

  <text x="510" y="22" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="13" font-weight="600">C — option three</text>
  <rect x="510" y="32" width="240" height="160" rx="10" fill="#14281c" stroke="#3fb950"/>
</svg>
```

## 4. Topology / perimeter (with dashed boundary)

For "deployment X inside boundary Y, nothing crosses." Use a large dashed border rect as the perimeter.

```svg
<svg viewBox="0 0 800 320" role="img" aria-label="Topology with perimeter">
  <!-- perimeter -->
  <rect x="20" y="20" width="760" height="280" rx="14" fill="#0f1a14" stroke="#3fb950" stroke-dasharray="6 4"/>
  <text x="40" y="44" fill="#3fb950" font-family="ui-sans-serif, system-ui" font-size="13" font-weight="700">Internal VPC — no egress</text>

  <!-- components inside -->
  <rect x="40"  y="80" width="140" height="60" rx="8" fill="#1b212b" stroke="#3a4250"/>
  <rect x="220" y="80" width="140" height="60" rx="8" fill="#1b212b" stroke="#3a4250"/>
  <rect x="400" y="80" width="140" height="60" rx="8" fill="#1e2736" stroke="#5aa9ff"/>
  <rect x="580" y="80" width="180" height="60" rx="8" fill="#14281c" stroke="#3fb950"/>

  <!-- red "deny" line at the bottom -->
  <path d="M20 290 L780 290" stroke="#f85149" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
  <text x="400" y="282" fill="#f85149" font-family="ui-sans-serif, system-ui" font-size="11" text-anchor="middle">
    egress: deny-all — nothing crosses this line
  </text>
</svg>
```

## 5. Code-flow / annotated reader-code vs. SDK-code

Color-coded: your code (green box), SDK boundary (dashed inner border), runtime (neutral).

```svg
<svg viewBox="0 0 720 240" role="img" aria-label="Your code in the picture">
  <defs>
    <marker id="arr-5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#5aa9ff"/>
    </marker>
  </defs>

  <rect x="10"  y="70" width="150" height="100" rx="10" fill="#1b212b" stroke="#3a4250"/>
  <text x="85"  y="115" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle">Host</text>

  <rect x="195" y="70" width="130" height="100" rx="10" fill="#13202d" stroke="#3a4a5c" stroke-dasharray="4 3"/>
  <text x="260" y="115" fill="#5aa9ff" font-family="ui-sans-serif, system-ui" font-size="13" text-anchor="middle">transport</text>

  <rect x="360" y="50" width="180" height="140" rx="10" fill="#14281c" stroke="#3fb950"/>
  <text x="450" y="80" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle" font-weight="600">your_code.py</text>
  <line x1="378" y1="112" x2="522" y2="112" stroke="#3a4250" stroke-dasharray="2 2"/>
  <text x="450" y="130" fill="#3fb950" font-family="ui-mono, Menlo, monospace" font-size="11" text-anchor="middle">SDK helpers</text>
  <text x="450" y="160" fill="#9aa3af" font-family="ui-sans-serif, system-ui" font-size="11" text-anchor="middle">(SDK handles this for you)</text>

  <rect x="575" y="70" width="130" height="100" rx="10" fill="#1b212b" stroke="#3a4250"/>
  <text x="640" y="115" fill="#e6e6e6" font-family="ui-sans-serif, system-ui" font-size="14" text-anchor="middle">OS / API</text>

  <line x1="160" y1="120" x2="195" y2="120" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-5)"/>
  <line x1="325" y1="120" x2="360" y2="120" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-5)"/>
  <line x1="540" y1="120" x2="575" y2="120" stroke="#5aa9ff" stroke-width="2" marker-end="url(#arr-5)"/>

  <text x="360" y="215" fill="#9aa3af" font-family="ui-sans-serif, system-ui" font-size="11" text-anchor="middle">
    Green = code you wrote · dashed = what the SDK handles for you
  </text>
</svg>
```

## Tips

- **One marker per SVG.** Give it a unique id (`arr-s2`, `arr-s7`) so two SVGs on the same page don't share.
- **viewBox sets the coordinate system, not the on-screen size.** The `.diagram svg { max-width: 100% }` rule handles scaling.
- **No external fonts.** Use `ui-sans-serif, system-ui` / `ui-mono, Menlo, monospace`. SVG text inherits font from `font-family=` attribute.
- **Accessibility.** Set `role="img"` and `aria-label="..."` on the outer `<svg>` so screen readers describe it.
- **Avoid text wrapping.** SVG `<text>` does not wrap. Break into multiple `<text>` lines stacked by `y`.
