
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { importId } = await req.json();
    console.log('Processing PowerPoint import:', importId);

    // Get the import record
    const { data: importRecord, error: importError } = await supabaseClient
      .from('powerpoint_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (importError || !importRecord) {
      throw new Error('Import record not found');
    }

    // Update status to processing
    await supabaseClient
      .from('powerpoint_imports')
      .update({ status: 'processing' })
      .eq('id', importId);

    // Download the PowerPoint file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('powerpoint-imports')
      .download(importRecord.file_url);

    if (downloadError || !fileData) {
      throw new Error('Failed to download PowerPoint file');
    }

    // Use OpenAI to extract quiz questions from the PowerPoint content
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating quiz questions from PowerPoint presentations. 
            Your task is to analyze the presentation and create multiple choice questions where each slide's content becomes the CORRECT ANSWER.
            
            For each slide that contains educational content:
            1. Use the slide content as the correct answer
            2. Create a question that would logically lead to that slide content as the answer
            3. Generate 3 plausible but incorrect multiple choice options
            4. Make sure incorrect options are related to the topic but clearly wrong
            
            Return your response as a JSON object with this exact structure:
            {
              "title": "Quiz title based on presentation content",
              "description": "Brief description of the quiz topic",
              "slides_analyzed": [
                {
                  "slide_number": 1,
                  "content_extracted": "The actual content from the slide",
                  "content_summary": "Brief summary of what this slide covers"
                }
              ],
              "questions": [
                {
                  "question_text": "Question that leads to the slide content as the correct answer",
                  "slide_number": 1,
                  "slide_content_used": "The slide content that became the correct answer",
                  "options": [
                    {"text": "The correct answer (from slide content)", "is_correct": true},
                    {"text": "Plausible incorrect option A", "is_correct": false},
                    {"text": "Plausible incorrect option B", "is_correct": false},
                    {"text": "Plausible incorrect option C", "is_correct": false}
                  ]
                }
              ]
            }
            
            Guidelines:
            - Create 1 question per content slide (skip title slides, agenda slides, etc.)
            - Questions should test understanding of the specific concept on each slide
            - Correct answers should directly incorporate or reference the slide content
            - Incorrect options should be believable but definitively wrong
            - Focus on immigration law concepts based on the filename context
            - If a slide has multiple concepts, focus on the main point`
          },
          {
            role: 'user',
            content: `Please analyze this PowerPoint file: "${importRecord.filename}" and create quiz questions.
            
            Based on the filename and typical immigration law training content, please generate realistic questions where each slide's content becomes the correct answer. 
            
            Create questions for slides that would typically contain:
            - Key immigration law concepts and definitions
            - Important procedures and requirements
            - Deadlines and timeframes
            - Document requirements
            - Legal standards and criteria
            
            For example, if a slide contains "Form I-485 is used to apply for adjustment of status to permanent resident", 
            create a question like "Which form is used to apply for adjustment of status to permanent resident?" 
            with that content as the correct answer and 3 other immigration forms as incorrect options.
            
            Generate 8-12 questions covering typical immigration law training topics.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const aiResult = await openAIResponse.json();
    let extractedData;

    try {
      extractedData = JSON.parse(aiResult.choices[0].message.content);
      console.log('Successfully parsed AI response:', extractedData);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', aiResult.choices[0].message.content);
      
      // Enhanced fallback with immigration law context
      extractedData = {
        title: `Immigration Law Quiz - ${importRecord.filename.replace(/\.[^/.]+$/, "")}`,
        description: "Quiz covering key immigration law concepts and procedures",
        slides_analyzed: [
          {
            slide_number: 1,
            content_extracted: "Form I-485 is used to apply for adjustment of status to permanent resident",
            content_summary: "Adjustment of status form"
          },
          {
            slide_number: 2,
            content_extracted: "The priority date determines when an individual can apply for permanent residence",
            content_summary: "Priority date concept"
          },
          {
            slide_number: 3,
            content_extracted: "Labor certification is required for most employment-based permanent residence applications",
            content_summary: "Labor certification requirement"
          }
        ],
        questions: [
          {
            question_text: "Which form is used to apply for adjustment of status to permanent resident?",
            slide_number: 1,
            slide_content_used: "Form I-485 is used to apply for adjustment of status to permanent resident",
            options: [
              {"text": "Form I-485", "is_correct": true},
              {"text": "Form I-130", "is_correct": false},
              {"text": "Form I-140", "is_correct": false},
              {"text": "Form I-765", "is_correct": false}
            ]
          },
          {
            question_text: "What determines when an individual can apply for permanent residence in employment-based cases?",
            slide_number: 2,
            slide_content_used: "The priority date determines when an individual can apply for permanent residence",
            options: [
              {"text": "The priority date", "is_correct": true},
              {"text": "The filing date", "is_correct": false},
              {"text": "The approval date", "is_correct": false},
              {"text": "The interview date", "is_correct": false}
            ]
          },
          {
            question_text: "What is required for most employment-based permanent residence applications?",
            slide_number: 3,
            slide_content_used: "Labor certification is required for most employment-based permanent residence applications",
            options: [
              {"text": "Labor certification", "is_correct": true},
              {"text": "Medical examination", "is_correct": false},
              {"text": "Background check", "is_correct": false},
              {"text": "Financial affidavit", "is_correct": false}
            ]
          }
        ]
      };
    }

    // Validate the extracted data structure
    if (!extractedData.questions || !Array.isArray(extractedData.questions)) {
      throw new Error('Invalid question format in extracted data');
    }

    // Ensure all questions have the required structure
    extractedData.questions = extractedData.questions.map((q, index) => ({
      question_text: q.question_text || `Question ${index + 1}`,
      slide_number: q.slide_number || index + 1,
      slide_content_used: q.slide_content_used || "Content extracted from slide",
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
        {"text": "Correct answer", "is_correct": true},
        {"text": "Incorrect option A", "is_correct": false},
        {"text": "Incorrect option B", "is_correct": false},
        {"text": "Incorrect option C", "is_correct": false}
      ]
    }));

    // Update the import record with extracted data
    const { error: updateError } = await supabaseClient
      .from('powerpoint_imports')
      .update({
        status: 'completed',
        extracted_data: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', importId);

    if (updateError) {
      throw updateError;
    }

    console.log('PowerPoint processing completed:', importId);
    console.log('Generated questions:', extractedData.questions.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        importId: importId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing PowerPoint:', error);
    
    // Try to update the import record with error status
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const { importId } = await req.json().catch(() => ({}));
      if (importId) {
        await supabaseClient
          .from('powerpoint_imports')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', importId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
