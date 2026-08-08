# Make Shawn an admin (keep team leader)

## What I found

`shawn@newfrontier.us` (active, not deleted) currently has only the **team_leader** role and no P&P permission record. That is why the Policies & Procedures tab does not appear for him — the tab requires admin/owner, tester, or an explicit P&P permission.

## Change

- Add the **admin** role in `user_roles` alongside his existing **team_leader** role (both kept).
- No P&P permission row is needed: LMS admins automatically get P&P admin rights.

## Notes

- Data change only, no schema or code changes.
- Role display picks the highest-priority role, so he will show as Admin while retaining team leader access.
- He will need to refresh/re-login for the role to take effect.
