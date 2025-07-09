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

const userKnowledgeBase = `
GENERAL PLATFORM USAGE (All Users):

Getting Started:
- Log into your account and navigate to your dashboard
- View your assigned courses and track progress
- Access different sections based on your role and permissions

Course Learning:
- Access courses from your Dashboard
- Watch course videos with automatic progress tracking
- Navigate: Course → Units → Modules → Lessons
- Mark units complete using 'Mark as Complete' button
- Use LMS Tree for visual course overview
- Take quizzes and assessments within courses
- Track your learning progress in real-time

Certificates & Achievements:
- Earn certificates automatically upon course completion
- View all certificates in Certificates tab
- Download PDF copies for your records
- Each certificate has a unique verification number
- Earn badges for achievements and milestones

Leaderboards & Competition:
- Learning Streak: Consecutive days of activity (1+ units/day)
- Category boards: Completion rates in Sales/Legal training
- Rankings updated regularly based on activity
- Grace period for streaks if you miss a day

Profile Management:
- Update personal information in Profile tab
- Upload professional profile picture
- Change password and security settings
- Manage notification preferences

LAW FIRM OWNER FEATURES:

Law Firm Setup & Management:
- Set up your law firm profile in the Settings tab
- Upload your law firm logo for branding
- Manage seat allocation for your employees
- View seat usage vs. total seats purchased

Employee Management:
- Add employees to your law firm:
  1. Go to Employee Management section on your dashboard
  2. Click "Add Employee" button
  3. Fill in employee details (name, email, role)
  4. Select their role (student, team_leader, etc.)
  5. Assign them to courses as needed
- View employee progress and completion rates
- Remove employees when they leave your firm
- Track team performance across all employees

Course Assignment (Owners):
- Assign courses to your employees
- Monitor completion rates across your firm
- View detailed progress reports
- Set up course requirements for different roles

Calendar & Events:
- Create law firm-specific calendar events
- Schedule training sessions and meetings
- Share calendar events with your employees

TEAM LEADER FEATURES:

Team Management:
- View and manage your assigned team members
- Monitor team progress across assigned courses
- Access team performance dashboards
- View individual team member progress and completion rates

Team Leadership Tasks:
- Assign courses to team members (if authorized)
- Track team learning goals and deadlines
- Generate team progress reports
- Support team members with course completion

STUDENT/EMPLOYEE FEATURES:

Learning & Development:
- Access courses assigned by your law firm or team leader
- Complete required training and continuing education
- Track your personal learning progress
- Meet course deadlines and requirements
- Participate in firm-wide learning initiatives

Career Development:
- Build your professional skill set through assigned courses
- Earn certificates for completed training
- Track your learning achievements and milestones
- Stay current with legal and professional development requirements

CLIENT FEATURES:

Client Portal Access:
- Access client-specific resources and materials
- View training materials relevant to your legal matter
- Track progress on required client education
- Access law firm resources and updates

FREE USER FEATURES:

Limited Access:
- Browse available free content and resources
- Access basic learning materials
- View platform features and capabilities
- Upgrade options for full access

COMMON SUPPORT TASKS (All Roles):

Account & Access:
- How to reset your password: Use "Forgot Password" on login page
- How to update your profile information
- How to contact support: Use this chat or submit a ticket
- How to navigate between different dashboard sections

Course Navigation:
- How to find your assigned courses
- How to track your learning progress
- How to download certificates
- How to use the LMS Tree for course overview
- How to complete quizzes and assessments

Technical Support:
- Browser compatibility and requirements
- Video playback issues and troubleshooting
- Login and access problems
- Certificate download issues
- Progress tracking problems

Note: Administrative functions like user management, system configuration, and advanced settings are not covered in this support system. For those needs, please contact your system administrator directly.
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
    
    // Use comprehensive knowledge base for all non-admin roles
    const knowledgeBase = userKnowledgeBase;
    
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