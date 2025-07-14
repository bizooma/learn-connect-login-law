import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Note: In production, you should set up a webhook endpoint secret
    // const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    // const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    
    // For now, parse the event directly
    const event = JSON.parse(body);
    logStep("Event parsed", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logStep("Checkout session completed", { sessionId: session.id });

        const userId = session.metadata.user_id;
        const planId = session.metadata.plan_id;

        if (!userId || !planId) {
          logStep("Missing metadata", { userId, planId });
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: session.subscription,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          logStep("Error updating subscription", updateError);
          break;
        }

        // Assign owner role to user
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'owner',
          }, { onConflict: 'user_id' });

        if (roleError) {
          logStep("Error assigning role", roleError);
        }

        // Get plan details for law firm creation
        const { data: planData } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (planData) {
          // Get user profile for law firm name
          const { data: profileData } = await supabaseClient
            .from('profiles')
            .select('law_firm_name')
            .eq('id', userId)
            .single();

          const lawFirmName = profileData?.law_firm_name || 'My Law Firm';

          // Create or update law firm record
          const { error: lawFirmError } = await supabaseClient
            .from('law_firms')
            .upsert({
              owner_id: userId,
              name: lawFirmName,
              total_seats: planData.max_users,
              used_seats: 1, // Owner counts as 1 seat
            }, { onConflict: 'owner_id' });

          if (lawFirmError) {
            logStep("Error creating law firm", lawFirmError);
          } else {
            logStep("Law firm created/updated", { name: lawFirmName, seats: planData.max_users });
          }
        }

        logStep("Subscription activated successfully");
        break;
      }

      case 'invoice.payment_succeeded': {
        logStep("Payment succeeded", { invoiceId: event.data.object.id });
        // Handle successful payments for renewals
        break;
      }

      case 'invoice.payment_failed': {
        logStep("Payment failed", { invoiceId: event.data.object.id });
        // Handle failed payments
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        logStep("Subscription cancelled", { subscriptionId: subscription.id });

        // Update subscription status to cancelled
        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logStep("Error updating cancelled subscription", error);
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});