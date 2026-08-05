
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateCreateUserRequest } from './validation.ts';
import { authenticateRequest } from './auth.ts';
import { checkUserPermissions } from './permissions.ts';
import { createUserAccount, resendInvite, resolveSiteUrl } from './userCreation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  console.log('Create single user request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const siteUrl = resolveSiteUrl(req);

    // Authenticate the requesting user
    const authResult = await authenticateRequest(req.headers.get('Authorization'));
    if (!authResult.success) {
      return json({ error: authResult.error }, authResult.status);
    }

    console.log('Authenticated user:', authResult.user!.id);

    // Check permissions
    const permissionResult = await checkUserPermissions(authResult.user!.id, authResult.user!.email || '');
    if (!permissionResult.allowed) {
      return json({ error: permissionResult.error }, permissionResult.status);
    }

    // --- Resend invite mode -------------------------------------------------
    if (body?.mode === 'resend') {
      const email = typeof body.email === 'string' ? body.email : '';
      if (!email) {
        return json({ error: 'An email address is required' }, 400);
      }

      const resendResult = await resendInvite(email, siteUrl);
      if (!resendResult.success) {
        return json({ error: resendResult.error, success: false }, 400);
      }

      return json({
        success: true,
        message: `A new link was sent to ${resendResult.email}. Only the newest email will work; earlier links are now unusable.`,
      });
    }

    // --- Create (invite) mode ----------------------------------------------
    const validation = validateCreateUserRequest(body);
    if (!validation.isValid) {
      console.error('Invalid create user request:', validation.error);
      return json({ error: validation.error }, 400);
    }

    const userData = validation.data!;
    console.log('Inviting user:', userData.email);

    const createResult = await createUserAccount(userData, siteUrl);
    if (!createResult.success) {
      return json({ error: createResult.error }, 400);
    }

    console.log('User invited successfully:', createResult.email);

    return json({
      success: true,
      message: `Invite sent to ${createResult.email}. They'll set their own password from the link.`,
      userId: createResult.userId,
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return json({ error: error.message || 'Failed to create user', success: false }, 500);
  }
});
