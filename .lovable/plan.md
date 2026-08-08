# Make Shawn an admin

## What I found

`shawn@newfrontier.us` (active, not deleted) currently has only the **team_leader** role and no P&P permission record. That is why the Policies & Procedures tab does not appear for him — the tab requires admin/owner, tester, or an explicit P&P permission.

## Change

- Replace his `team_leader` role with **admin** in `user_roles`.
- No P&P permission row is needed: LMS admins automatically get P&P admin rights.

## Notes

- This is a data change only, no schema or code changes.
- He will need to refresh/re-login for the role to take effect.
- If he should keep team leader duties as well, say so and I will keep both roles instead of replacing.
