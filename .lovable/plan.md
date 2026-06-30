## Current state

The five Content-tab fields save to `organization_settings` and reload correctly, but no other code reads them. Each toggle currently has no real effect.

## Plan: wire each setting end-to-end

**1. Shared settings hook**
Create `src/hooks/useOrgContentSettings.ts` — a React Query hook that fetches the singleton `organization_settings` row once and exposes `{ publicShareEnabled, pdfDownloadsEnabled, esignaturePermission, feedbackEnabled, defaultDiscoverability }`. Used by all consumers below so we don't refetch per component.

**2. Enable "Public share" feature**
- In `ShareSubjectDialog.tsx`, hide/disable the "Public share" toggle when `publicShareEnabled === false`.
- In `WikiCategoryRow.tsx` action menu, hide "Copy link" (public share link) when disabled.

**3. Enable PDF downloads**
- In `WikiCategoryRow.tsx` action menu, hide the "Print PDF" item when `pdfDownloadsEnabled === false`.
- Same for any page-level PDF action in `WikiPageEditorPage.tsx` if present.

**4. E-signature permission**
- We don't have an e-signature feature in the app yet. Two options:
  - (a) Save the preference only and note "applies when e-signatures ship" — what we have today.
  - (b) Add a minimal "Require e-signature" toggle on subjects, gated by this permission.
- Recommend (a) for now since building the full e-sig flow is a separate feature.

**5. Allow content feedback**
- We don't have a feedback UI on articles/pages yet. Either:
  - (a) Save preference only, wire later when feedback UI is built.
  - (b) Add a small "Flag / Suggest improvement" button to `WikiPageEditorPage` viewer that respects the toggle.
- Recommend (a) unless you want the feedback button built now.

**6. Default content discoverability**
- In the "Create subject" dialog, pre-select the new subject's `discoverability` to `defaultDiscoverability` instead of hard-coding `"discoverable"`.
- Existing subjects are unaffected; admins can still override per subject in Share dialog.

## Questions before I build

- For **e-signatures** and **content feedback**: do you want me to (a) just leave the preference saved for later, or (b) build the minimal feature so the toggle controls something visible today?
- Should the **public share** and **PDF downloads** toggles also hide the corresponding actions for admins, or only for non-admins?

Once you answer those, I'll switch to build mode and wire everything.