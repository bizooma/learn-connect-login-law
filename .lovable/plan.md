
## Overview

Two phases in one plan because Phase 2 depends on Phase 1.

**Phase 1** — replace the hardcoded sample list on the Groups page with a real database-backed groups system (so "Exceptions" actually has something to point at).

**Phase 2** — build the functional Gamification settings tab and gate streaks/leaderboards across the app based on those settings.

---

## Phase 1: Real Groups system

### Database

Two new tables (with grants, RLS, and the standard `updated_at` trigger):

- `groups` — fields: `name`, `type` ("Role" | "Department" | "Team" | "Custom"), `description`, `manager_id` (optional, references `profiles`).
- `group_members` — fields: `group_id`, `user_id`. Unique on `(group_id, user_id)`.

Access rules in plain English:
- **Groups:** any signed-in user can view groups. Only admins can create, edit, or delete.
- **Group members:** any signed-in user can view group membership. Only admins can add or remove members.

### UI changes

Rewrite `src/pages/AdminWikiGroupsPage.tsx` to read/write from `groups` instead of the hardcoded `GROUPS` array:

- Table lists real groups with name, type, description, manager, and member count.
- "Add group" dialog: name, type (dropdown), description, optional manager.
- Row actions: Edit (same dialog), Delete (confirm), Manage members (dialog with a searchable user picker that adds/removes rows in `group_members`).
- Search box filters by name/type as it does today.

No changes to the wiki sidebar or routing.

---

## Phase 2: Gamification settings tab + UI gating

### Database

Extend `organization_settings` with three columns:

- `gamification_enabled` boolean, default `true`.
- `streak_frequency` text, default `'weekly'`, allowed values `'weekly' | 'monthly' | 'quarterly'` (enforced by CHECK).
- `gamification_excluded_groups` `uuid[]`, default `'{}'`.

Existing access rules already cover the new columns (admins write, everyone signed in reads).

### Settings page — Gamification tab

Replace the "coming soon" placeholder with:

- **Enable gamification** toggle, with the helper text from the screenshot.
- **Completion streaks** section: explanation copy + a 3-option **Streak frequency** selector (Weekly / Monthly / Quarterly).
- **Exceptions**: multi-select of groups (from Phase 1's `groups` table). Helper text: "People in these groups won't see streaks or the leaderboard."
- All fields disabled when the master toggle is off.
- Save button writes everything to `organization_settings`.

Note about the screenshot's "11 week streak" preview card: visual fluff; skip it for now unless you want it added.

### App-wide gating

Add a `useGamificationSettings()` hook (cached) that returns `{ enabled, streakFrequency, isUserExcluded }`. The hook also checks whether the current user belongs to any excluded group.

Then gate UI at these existing surfaces:

- `src/components/leaderboards/*` (Category, Streak, Mini leaderboards) — render nothing when `enabled === false` or the viewer is excluded.
- `src/pages/Leaderboards.tsx` — same; show an empty state if disabled.
- `src/components/badges/StudentBadgesSection.tsx` and any streak chips inside `StudentDashboard` / `TeamLeaderDashboard` — same gating.
- Sidebar / nav links to "Leaderboards" — hidden when disabled.

`streak_frequency` is stored and surfaced to the UI, but the underlying `update_learning_streak` function continues to operate as it does today. Recomputing streaks against a weekly/monthly/quarterly cadence is a bigger backend change and is out of scope for this plan — flag it as a follow-up.

---

## Out of scope (call out as follow-ups)

- Reworking `update_learning_streak` to compute streaks per the chosen frequency.
- Importing 33 existing groups — you'll create them in the new Groups UI or we can do a one-time import if you provide the list.
- Permissions for non-admin "group managers" to edit their own group (current plan: admin-only writes).
