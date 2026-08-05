# Investigate and harden new-user invite links

## Confirmed findings

- **Mariajose Martinez** was invited August 3 at 16:05 UTC. Two recovery emails were requested the next day; the second was redeemed successfully, her password was set, and she subsequently signed in.
- **Jorge Garcia** was invited August 5 at 15:24 UTC. A recovery email was requested about 4.5 hours later and was successfully redeemed; his password was set.
- **Abril Lemus** was invited August 5 at 15:23 UTC. A recovery email was requested about 4.5 hours later and was successfully redeemed; she later signed in.
- **Omar Oyervides** was invited August 5 at 15:24 UTC. He remains unconfirmed with no successful sign-in. His auth record was modified by an administrator later that day, but there is no successful invite or recovery redemption.
- None of the four accounts is banned or soft-deleted.
- The failure is isolated to the original invite links, not account creation or the later password-setting flow.
- `newfrontier.us` uses Microsoft 365 email protection. Supabase invite links are one-time links, so automated link inspection is the leading explanation for links appearing “expired” well before their time limit. The exact failed verification events are no longer available in the short-lived auth logs, so this attribution cannot be proven retrospectively.

## Implementation plan

1. **Make invite redemption deterministic**
   - Change the invite email link format to send users directly to `/reset-password` with a `token_hash` and invite type instead of routing through Supabase’s immediately consumable verification URL.
   - Keep `ResetPassword.tsx` as the component that explicitly redeems the token with `verifyOtp`, so ordinary mail-link scanners do not consume it before the user arrives.
   - Preserve the existing signed-in redirect to `/index` after the password is set.

2. **Improve failure diagnosis and recovery**
   - Replace the generic “expired” assertion with an accurate message covering used, invalid, and expired links.
   - Add a clear recovery action that lets the affected user request a fresh password-setting email without waiting for an administrator.
   - Record the verification failure category without storing tokens, allowing future incidents to distinguish expiration, prior consumption, and malformed links.

3. **Harden the administrator resend flow**
   - Keep the existing recovery-based resend behavior, which successfully recovered three of these accounts.
   - Make the success message explicitly tell the admin that the previous link becomes unusable and only the newest email should be opened.
   - Reissue Omar’s password-setting email after the fix is active; do not recreate his account or disturb assigned roles/progress.

4. **Validate before rollout**
   - Test a new invite and a resent invite through a `@newfrontier.us` Microsoft 365 inbox.
   - Confirm that opening the message does not verify the account until the browser reaches the reset page, setting a password succeeds, and `/index` routes the user to the correct dashboard.
   - Confirm an old/reused link shows the truthful recovery state and that the new self-service action sends a usable replacement.

## Technical note

The robust fix requires updating the Supabase auth invite template, not only React code. The project currently uses Supabase’s default auth sender and has no custom email domain configured. If the external Supabase project does not permit template automation, the equivalent template change will need to be applied in its Auth email-template settings while the application-side token handling and diagnostics are implemented here.