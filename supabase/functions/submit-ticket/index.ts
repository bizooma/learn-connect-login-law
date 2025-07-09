import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, priority, subject, description } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create support ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_email: email,
        user_name: name,
        category,
        priority,
        subject,
        description,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send email notifications to support team
    const recipients = [
      'joe@bizooma.com',
      'erin.walsh@newfrontier.us',
      'carolina@newfrontieruniversity.com'
    ];

    const priorityEmoji = {
      low: '🟢',
      medium: '🟡', 
      high: '🟠',
      urgent: '🔴'
    };

    const categoryEmoji = {
      technical: '🔧',
      account: '👤',
      course: '📚',
      general: '💬'
    };

    for (const recipient of recipients) {
      await resend.emails.send({
        from: "NFU Support <support@newfrontieruniversity.com>",
        to: [recipient],
        subject: `${priorityEmoji[priority as keyof typeof priorityEmoji]} New Support Ticket: ${subject}`,
        html: `
          <h2>New Support Ticket Submitted</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ticket #:</strong> ${ticket.ticket_number}</p>
            <p><strong>Category:</strong> ${categoryEmoji[category as keyof typeof categoryEmoji]} ${category.charAt(0).toUpperCase() + category.slice(1)}</p>
            <p><strong>Priority:</strong> ${priorityEmoji[priority as keyof typeof priorityEmoji]} ${priority.toUpperCase()}</p>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <h3>Description:</h3>
          <div style="background: white; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
            ${description.replace(/\n/g, '<br>')}
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            Please respond to this ticket by contacting the user directly at <a href="mailto:${email}">${email}</a>
          </p>
        `,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticketNumber: ticket.ticket_number,
        message: 'Support ticket submitted successfully' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-ticket function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});