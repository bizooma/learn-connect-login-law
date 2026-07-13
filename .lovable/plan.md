
# Department Hub — v1 Prototype

A new "hub" surface that sits above the LMS and P&P apps. Staff would eventually land here and click a department tile to jump into whatever they need. For v1 it's hidden behind a URL so we can test the concept without touching current workflows.

## Rollout

- Live at `/hub` only. No links from any existing page, no changes to login redirects, no changes to headers.
- Testers reach it by typing the URL or using a shared link.
- The LMS, P&P, dashboards, and login flow behave exactly as they do today.

## What the page looks like

- Header strip with page title ("Departments") and the same brand styling as the rest of the admin app (deep blue `#213C82`, yellow `#FFDA00` accents).
- Below the header: a responsive grid of **department cards**. Each card shows the department name, a short description, and an icon.
- Clicking a department card opens that department's **tile view**: a grid of individual tiles that deep-link into existing LMS courses/sections, P&P pages/categories, or role dashboards.
- A back button returns to the department grid.
- Tiles open the target in the same tab (so the browser back button returns to the hub).

No role filtering in v1 — every visitor sees every department and every tile.

## Content model (v1)

All departments and tiles live in a single TypeScript config file, e.g. `src/config/hub.ts`. No database, no admin UI yet. Editing the hub means editing that file.

Shape (illustrative):

```text
Department
  id, name, description, icon
  tiles: Tile[]

Tile
  label, description, icon
  target: { kind: "lms-course" | "lms-section" | "pp-page" | "pp-category" | "dashboard", ref: string }
```

We'll resolve `target` to a real in-app path (e.g. `/course/:id`, `/section/:id`, `/admin/wiki/pages/:pageId`, `/student-dashboard`, etc.).

## What you'll need to provide

- The department list (names + short descriptions).
- For each department, the tiles you want and what each one should point to. For LMS items I need the course or section (name is fine, I'll look up the IDs); for P&P items I need the page or category; for dashboards just which role.

I can stub the hub with placeholder departments/tiles first so you can see the layout, then swap in your real list.

## Out of scope for v1

- Role/department-based filtering
- Auth gating on `/hub` (open to anyone who knows the URL, same as other routes today)
- Admin UI to edit tiles
- Analytics on tile clicks
- Making `/hub` the default post-login destination
- Any changes to the existing header, nav, or dashboards

## Technical notes

- New route `/hub` added to `src/App.tsx` pointing at a new `src/pages/Hub.tsx`.
- New components under `src/components/hub/` (`DepartmentGrid`, `DepartmentDetail`, `Tile`).
- Config in `src/config/hub.ts`.
- Uses existing shadcn `Card` primitives and lucide icons; no new deps.
- Department detail can be a second view in the same page via local state, or a nested route `/hub/:departmentId` — I'd suggest the nested route so links are shareable.

## Effort

Small. The scaffold (route, page, grid, tile component, placeholder config) is a short build. Most of the real work is you and me populating the config with the right departments, tiles, and target links.
