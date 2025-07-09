import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Knowledge base content for search
const knowledgeBase = [
  {
    category: "Getting Started",
    items: [
      {
        title: "Logging In & Accessing Your Dashboard",
        content: "Learn how to log into your student account and navigate to your personalized dashboard. Your dashboard shows your course progress, certificates earned, and quick access to all platform features."
      },
      {
        title: "Understanding Your Dashboard",
        content: "Your dashboard displays key statistics: Assigned Courses (courses given to you), In Progress (courses you're actively taking), Completed (finished courses), and Certificates (awards you've earned)."
      },
      {
        title: "Navigating Between Sections",
        content: "Use the yellow tabs to switch between Dashboard (course overview), Certificates (your earned awards), and Profile (personal information management)."
      }
    ]
  },
  {
    category: "Course Management",
    items: [
      {
        title: "Viewing Your Courses",
        content: "Access your courses from the Dashboard tab. Switch between 'Assigned Courses' (new courses) and 'Completed Courses' (finished courses) using the yellow sub-tabs."
      },
      {
        title: "Starting a Course",
        content: "Click on any assigned course card to begin. You'll see the course structure with units, modules, and lessons organized in a clear hierarchy."
      },
      {
        title: "Course Progress Tracking",
        content: "Your progress is automatically saved as you complete units. The progress bar shows your completion percentage, and completed sections are marked with checkmarks."
      }
    ]
  },
  {
    category: "Taking Courses",
    items: [
      {
        title: "Watching Course Videos",
        content: "Each lesson contains video content. Videos track your progress automatically. You can pause, rewind, and take notes while watching."
      },
      {
        title: "Marking Units Complete",
        content: "After finishing all content in a unit, mark it as complete using the 'Mark as Complete' button. This updates your progress and unlocks the next section."
      }
    ]
  },
  {
    category: "Certificates",
    items: [
      {
        title: "Earning Certificates",
        content: "You earn a certificate when you complete all required course content and pass any required assessments. Certificates are automatically generated upon course completion."
      },
      {
        title: "Downloading Certificates",
        content: "Click the 'Download' button next to any certificate to save a PDF copy to your device. You can print these for your records or share with employers."
      }
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userRole, userId } = await req.json();

    if (!question || !userRole || !userId) {
      throw new Error('Question, userRole, and userId are required');
    }

    // Search knowledge base for relevant content
    const relevantContent = searchKnowledgeBase(question);
    
    let response = '';
    let responseType = 'knowledge_base';

    if (relevantContent.length > 0) {
      // Use knowledge base content to answer
      response = generateKnowledgeBaseResponse(question, relevantContent, userRole);
    } else {
      // Use AI to generate a helpful response
      response = await generateAIResponse(question, userRole);
      responseType = 'ai_generated';
    }

    // Log the interaction
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    await supabase.from('chatbot_interactions').insert({
      user_id: userId,
      user_role: userRole,
      question,
      response,
      response_type: responseType
    });

    return new Response(JSON.stringify({ 
      response,
      responseType,
      suggestions: getQuickSuggestions(userRole)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot-response function:', error);
    return new Response(JSON.stringify({ 
      error: 'I apologize, but I\'m having trouble right now. Please try again or submit a support ticket for immediate assistance.',
      responseType: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function searchKnowledgeBase(question: string) {
  const searchTerms = question.toLowerCase().split(' ');
  const matches = [];

  for (const category of knowledgeBase) {
    for (const item of category.items) {
      const content = (item.title + ' ' + item.content).toLowerCase();
      const matchScore = searchTerms.filter(term => content.includes(term)).length;
      
      if (matchScore > 0) {
        matches.push({
          ...item,
          category: category.category,
          score: matchScore
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function generateKnowledgeBaseResponse(question: string, relevantContent: any[], userRole: string) {
  const rolePrefix = userRole === 'student' ? 'As a student' : 
                    userRole === 'owner' ? 'As a law firm owner' :
                    userRole === 'team_leader' ? 'As a team leader' : 'As a user';

  let response = `${rolePrefix}, here's what I found that might help:\n\n`;
  
  relevantContent.forEach((item, index) => {
    response += `**${item.title}**\n${item.content}\n\n`;
  });

  response += "If you need more specific help, feel free to ask another question or submit a support ticket for personalized assistance.";
  
  return response;
}

async function generateAIResponse(question: string, userRole: string) {
  try {
    const roleContext = userRole === 'student' ? 'a student taking courses' :
                       userRole === 'owner' ? 'a law firm owner managing employees' :
                       userRole === 'team_leader' ? 'a team leader overseeing team members' :
                       'a user of the platform';

    const systemPrompt = `You are a helpful support assistant for New Frontier University's learning platform. 
    The user is ${roleContext}. Provide helpful, concise answers about using the platform. 
    If you cannot answer their question, suggest they submit a support ticket.
    Keep responses under 200 words and be friendly and professional.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm having trouble generating a response right now. Please submit a support ticket and our team will help you directly.";
  }
}

function getQuickSuggestions(userRole: string) {
  const commonSuggestions = [
    "How do I access my courses?",
    "How do I download my certificates?",
    "How do I update my profile?"
  ];

  const roleSuggestions = {
    student: [
      "How do I mark a unit as complete?",
      "How do I take a quiz?",
      "How do I track my progress?"
    ],
    owner: [
      "How do I manage my employees?",
      "How do I assign courses to my team?",
      "How do I view team progress?"
    ],
    team_leader: [
      "How do I monitor team member progress?",
      "How do I help struggling team members?",
      "How do I view team reports?"
    ]
  };

  return [...commonSuggestions, ...(roleSuggestions[userRole as keyof typeof roleSuggestions] || [])];
}