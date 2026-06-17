# Floating Bubbles Banner

Add a fun, lightweight animated banner under the 4 filter tabs on the Admin Wiki page. Pure CSS — no new dependencies.

## Visual concept

A short horizontal banner (~96px tall) with a soft gradient background in brand colors (Deep Blue #213C82 → a lighter blue), with translucent circular "bubbles" drifting upward and gently swaying side-to-side. Bubbles vary in size, opacity, speed, and horizontal start position, and have a subtle highlight to read as bubbles rather than dots. A short friendly headline sits on top, e.g. "Your team's playbook, all in one place."

```text
┌───────────────────────────────────────────────────────┐
│   ° .   o     .  O   .    °   o    .     °    o      │
│  Your team's playbook, all in one place.   .  °       │
│   °  O    .    °    o    .    O    °   .    o   °    │
└───────────────────────────────────────────────────────┘
```

## What to build

1. **New component**: `src/components/admin/wiki/BubblesBanner.tsx`
   - Rounded container with gradient background using brand tokens.
   - ~14 absolutely-positioned bubble `<span>`s with randomized inline styles (size 8–40px, left %, animation-delay, animation-duration 6–14s, opacity 0.15–0.5).
   - Each bubble uses a `float-up` keyframe (translateY from 100% to -120% + slight translateX wobble) and an inner radial-gradient highlight.
   - `pointer-events-none` overlay so it never blocks clicks.
   - Optional headline + small subtext centered, white text with soft shadow.
   - Respects `prefers-reduced-motion`: bubbles render static.

2. **Keyframes**: add `float-up` (and a `bubble-sway` variant) to `tailwind.config.ts` under `keyframes` / `animation`, matching the existing pattern.

3. **Wire-up**: in `src/pages/AdminWikiPage.tsx`, render `<BubblesBanner />` directly under the filter tab row and above the subjects list.

## Notes

- All colors via semantic tokens / brand hex already in use; no hardcoded grays.
- No data, no props required for v1 (headline can be a prop with a sensible default).
- Self-contained — easy to remove or swap later.
