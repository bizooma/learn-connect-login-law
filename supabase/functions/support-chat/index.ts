import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const studentKnowledgeBase = `
Getting Started:
- Log into your account and navigate to your dashboard
- View your assigned courses and track progress
- Switch between Dashboard, Certificates, and Profile tabs

Course Management:
- Access courses from Dashboard tab with 'Assigned Courses' and 'Completed Courses'
- Browse all courses in the Course Catalog
- Track progress automatically as you complete units

Taking Courses:
- Watch course videos with automatic progress tracking
- Navigate: Course → Units → Modules → Lessons
- Mark units complete using 'Mark as Complete' button
- Use LMS Tree for course overview

Quizzes & Assessments:
- Click 'Start Quiz' to begin assessments
- Use Previous/Next buttons to navigate
- Review answers before submitting
- Retake failed quizzes (check with admin for policies)

Leaderboards:
- Learning Streak: Consecutive days of activity (1+ units/day)
- Category boards: Completion rates in Sales/Legal training
- Rankings updated regularly based on activity
- Grace period for streaks if you miss a day

Certificates:
- Earned automatically upon course completion
- View all certificates in Certificates tab
- Download PDF copies for your records
- Each has unique verification number

Law Firm Management (for Law Firm Owners):
- Set up your law firm profile in the Settings tab
- Upload your law firm logo for branding
- Manage seat allocation for your employees
- Add employees to your law firm:
  1. Go to the Employee Management section
  2. Click "Add Employee" button
  3. Fill in employee details (name, email, role)
  4. Select their role (student, team_leader, etc.)
  5. Assign them to courses as needed
- View employee progress and completion rates
- Remove employees when they leave your firm
- Track seat usage vs. total seats purchased

Team Leadership (for Team Leaders):
- View and manage your team members
- Monitor team progress across assigned courses
- Access team performance dashboards
- Assign courses to team members
- View individual team member progress

Profile Management:
- Update personal information in Profile tab
- Upload professional profile picture
- Change password and security settings
- Update law firm association if applicable
- Manage notification preferences

Dashboard Navigation:
- Dashboard: View course progress and statistics
- Certificates: Download and view earned certificates
- Profile: Manage personal and professional information
- Course Catalog: Browse available courses
- LMS Tree: Visual course structure overview
- Leaderboards: View competitive rankings

Common Tasks:
- How to enroll in courses: Courses are assigned by administrators
- How to track progress: View Dashboard for real-time progress
- How to get certificates: Complete all course requirements
- How to contact support: Use this chat or submit a ticket
- How to reset password: Use "Forgot Password" on login page
- How to update profile: Go to Profile tab and edit information
`;

const adminKnowledgeBase = `
User Management:
- Create, edit, and delete user accounts
- Assign roles (admin, owner, student, client, free, team_leader)
- Bulk import users via CSV
- Track user activity and progress

Course Management:
- Create and edit courses with modules, lessons, and units
- Upload course materials and videos
- Set up quizzes and assessments
- Manage course assignments and enrollments

Progress Tracking:
- Monitor student progress across all courses
- Generate progress reports
- Mark units as completed for students
- Track completion statistics

Team Management:
- Create and manage admin teams
- Assign team members and leaders
- View team progress dashboards
- Manage law firm associations

System Administration:
- Configure global events and calendars
- Manage certificates and badges
- Monitor system performance
- Handle support tickets and user issues
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userRole } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Always use student knowledge base for user-facing support
    const knowledgeBase = studentKnowledgeBase;
    
    // Generate AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful support assistant for a Learning Management System. Use this knowledge base to answer questions accurately:

${knowledgeBase}

Guidelines:
- Be helpful and friendly
- Provide specific, actionable answers
- Reference relevant sections from the knowledge base
- If you can't answer something, suggest submitting a support ticket
- Keep responses concise but informative
- Use bullet points for step-by-step instructions`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    // Save conversation to database
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    const messages = conversation?.messages || [];
    messages.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() }
    );

    if (conversation) {
      await supabase
        .from('chat_conversations')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('id', conversation.id);
    } else {
      await supabase
        .from('chat_conversations')
        .insert({
          session_id: sessionId,
          messages,
          user_role: userRole
        });
    }

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in support-chat function:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});