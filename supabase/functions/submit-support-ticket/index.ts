import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supportTeam = [
  'joe@bizooma.com',
  'erin.walsh@newfrontier.us',
  'carolina@newfrontieruniversity.com'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      userRole, 
      subject, 
      description, 
      category, 
      priority 
    } = await req.json();

    // Validate required fields
    if (!userId || !userName || !userEmail || !subject || !description) {
      throw new Error('Missing required fields');
    }

    // Create ticket in database
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole || 'student',
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium'
      })
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Generate email content
    const emailHtml = generateSupportEmailHtml(ticket);
    const emailText = generateSupportEmailText(ticket);

    // Send notification emails to support team
    console.log('Sending notification emails to support team:', supportTeam);
    const emailPromises = supportTeam.map(email => 
      resend.emails.send({
        from: 'New Frontier University Support <onboarding@resend.dev>',
        to: [email],
        subject: `New Support Ticket: ${subject}`,
        html: emailHtml,
        text: emailText
      })
    );

    // Send confirmation email to user
    console.log('Sending confirmation email to user:', userEmail);
    emailPromises.push(
      resend.emails.send({
        from: 'New Frontier University Support <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Support Ticket Submitted: ${subject}`,
        html: generateConfirmationEmailHtml(ticket),
        text: generateConfirmationEmailText(ticket)
      })
    );

    const emailResults = await Promise.all(emailPromises);
    console.log('Email sending results:', emailResults);

    return new Response(JSON.stringify({ 
      success: true,
      ticketId: ticket.id,
      message: 'Support ticket submitted successfully. You will receive email confirmation shortly.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-support-ticket function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit support ticket. Please try again.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSupportEmailHtml(ticket: any) {
  const priorityColor = ticket.priority === 'high' ? '#dc2626' : 
                       ticket.priority === 'medium' ? '#ea580c' : '#16a34a';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1>New Support Ticket</h1>
      </div>
      
      <div style="padding: 20px; background: #f8fafc;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin-top: 0;">Ticket Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Ticket ID:</td>
              <td style="padding: 8px 0;">${ticket.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0;">${ticket.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; font-size: 12px;">
                  ${ticket.priority}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Category:</td>
              <td style="padding: 8px 0; text-transform: capitalize;">${ticket.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
              <td style="padding: 8px 0;">${new Date(ticket.created_at).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e40af; margin-top: 0;">User Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 8px 0;">${ticket.user_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${ticket.user_email}" style="color: #1e40af;">${ticket.user_email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Role:</td>
              <td style="padding: 8px 0; text-transform: capitalize;">${ticket.user_role}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1e40af; margin-top: 0;">Description</h3>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${ticket.description}</div>
        </div>
      </div>
      
      <div style="background: #e2e8f0; padding: 15px; text-align: center; font-size: 14px; color: #64748b;">
        New Frontier University Support System
      </div>
    </div>
  `;
}

function generateSupportEmailText(ticket: any) {
  return `
NEW SUPPORT TICKET

Ticket ID: ${ticket.id}
Subject: ${ticket.subject}
Priority: ${ticket.priority.toUpperCase()}
Category: ${ticket.category}
Submitted: ${new Date(ticket.created_at).toLocaleString()}

USER INFORMATION
Name: ${ticket.user_name}
Email: ${ticket.user_email}
Role: ${ticket.user_role}

DESCRIPTION
${ticket.description}

---
New Frontier University Support System
  `;
}

function generateConfirmationEmailHtml(ticket: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>Support Ticket Submitted</h1>
      </div>
      
      <div style="padding: 20px; background: #f8fafc;">
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #16a34a; margin-top: 0;">Thank you for contacting support!</h2>
          
          <p>Your support ticket has been successfully submitted. Here are the details:</p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0;">
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p><strong>Submitted:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
          </div>
          
          <p>Our support team will review your request and respond within 24-48 hours during business days. For urgent issues, please contact us directly.</p>
          
          <p>You can reference ticket ID <strong>${ticket.id}</strong> in any follow-up communications.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p><strong>Need immediate help?</strong></p>
            <p>• Check our <a href="#" style="color: #1e40af;">Knowledge Base</a> for common solutions</p>
            <p>• Ask our chatbot for quick answers</p>
            <p>• Email us directly at <a href="mailto:support@newfrontieruniversity.com" style="color: #1e40af;">support@newfrontieruniversity.com</a></p>
          </div>
        </div>
      </div>
      
      <div style="background: #e2e8f0; padding: 15px; text-align: center; font-size: 14px; color: #64748b;">
        New Frontier University Support Team
      </div>
    </div>
  `;
}

function generateConfirmationEmailText(ticket: any) {
  return `
SUPPORT TICKET SUBMITTED

Thank you for contacting support! Your ticket has been successfully submitted.

Ticket Details:
- Ticket ID: ${ticket.id}
- Subject: ${ticket.subject}
- Priority: ${ticket.priority}
- Submitted: ${new Date(ticket.created_at).toLocaleString()}

Our support team will review your request and respond within 24-48 hours during business days.

You can reference ticket ID ${ticket.id} in any follow-up communications.

Need immediate help?
- Check our Knowledge Base for common solutions
- Ask our chatbot for quick answers
- Email us directly at support@newfrontieruniversity.com

---
New Frontier University Support Team
  `;
}