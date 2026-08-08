# Shawn's missing team card

## What I checked

- Shawn (shawn@newfrontier.us) has both roles in the database: `admin` and `team_leader`.
- 11 staff profiles list him as their team leader (`profiles.team_leader_id`), plus 6 list him as manager.
- There is exactly one record in Admin Teams: "Test Team", created by another admin, containing 2 test accounts (free@test.com, client@test.com). Shawn is not in it.

## Why he sees no team card

Two separate things are named "team" in the app, and neither shows him his people:

1. **Team cards** (the cards with a progress dashboard) only exist inside Admin -> Teams. They come from the `admin_teams` table, which today holds only the unrelated "Test Team". Nothing there belongs to Shawn.
2. **His real 11 direct reports** only appear on the Team Leader Dashboard, which he can never reach: the app picks a single primary role per user, Shawn resolves to `admin`, so he is redirected to the admin dashboard and the team-leader route bails out with "not a team leader".

So the earlier answer was wrong: giving him admin did not surface a team card, it actually hid the team-leader view he used to qualify for.

## The fix

**1. Let dual-role users reach the team leader view**
- Treat `team_leader` as an additive role: the app already tracks extra roles, so mark someone a team leader when `team_leader` appears in any of their roles, not only when it is their primary role.
- The Team Leader Dashboard route stops redirecting admins who also hold `team_leader`.
- Index routing still sends Shawn to the admin dashboard by default (admin takes precedence).

**2. Give him a way in from the admin dashboard**
- Add a "My Team" entry in the admin dashboard header menu (next to Hub), shown only when the signed-in admin also holds `team_leader`, linking to `/team-leader-dashboard`.
- On the admin dashboard, show a compact "My Team (11)" summary card for these users with a link into the full team progress view.

**3. Leave Admin -> Teams alone**
`admin_teams` stays as-is (it is a separate manual grouping feature). If the client wants Shawn's 11 reports as a formal admin team too, that is a separate data task.

## Technical notes

- `src/hooks/useUserRole.tsx`: derive `isTeamLeader` from the full roles array instead of the primary role only. No schema change.
- `src/pages/TeamLeaderDashboard.tsx`: guard uses the updated `isTeamLeader`.
- `src/components/admin/AdminDashboardHeader.tsx`: conditional "My Team" link.
- Admin dashboard: small summary card sourced from the existing `useTeamLeaderProgress` hook (`profiles.team_leader_id`).
- No database or RLS changes required.
