
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { parsePowerPointFile } from '../process-powerpoint-quiz/powerpoint-parser.ts';

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

    const { importId, action, avatarId, voiceId } = await req.json();
    console.log('Processing HeyGen video generation:', { importId, action, avatarId, voiceId });

    // Get the import record
    const { data: importRecord, error: fetchError } = await supabaseClient
      .from('powerpoint_video_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (fetchError || !importRecord) {
      throw new Error('Import record not found');
    }

    if (action === 'generate_script') {
      // Update status to processing script
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ status: 'generating_script' })
        .eq('id', importId);

      // Download and parse PowerPoint file
      const { data: fileData } = await supabaseClient.storage
        .from('powerpoint-uploads')
        .download(importRecord.file_url);

      if (!fileData) {
        throw new Error('Failed to download PowerPoint file');
      }

      const slideContents = await parsePowerPointFile(fileData);
      console.log('Parsed PowerPoint file, found slides:', slideContents.length);

      // Generate script using OpenAI
      const script = await generateNarrationScript(importRecord.filename, slideContents);

      // Update record with script
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          script_content: script,
          status: 'script_ready' 
        })
        .eq('id', importId);

      return new Response(
        JSON.stringify({ success: true, script }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'generate_video') {
      // Update status and avatar/voice settings
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          status: 'generating_video',
          avatar_id: avatarId,
          voice_id: voiceId
        })
        .eq('id', importId);

      // Generate video with HeyGen
      const videoUrl = await generateHeyGenVideo(importRecord.script_content, avatarId, voiceId);

      // Update record with video URL
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          heygen_video_url: videoUrl,
          status: 'completed' 
        })
        .eq('id', importId);

      return new Response(
        JSON.stringify({ success: true, videoUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in HeyGen video generation:', error);
    
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const { importId } = await req.json().catch(() => ({}));
      if (importId) {
        await supabaseClient
          .from('powerpoint_video_imports')
          .update({ 
            status: 'error',
            error_message: error.message 
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

async function generateNarrationScript(filename: string, slideContents: any[]): Promise<string> {
  const contentSlides = slideContents.filter(slide => slide.hasContent);
  
  if (contentSlides.length === 0) {
    throw new Error('No content slides found to generate script from');
  }
  
  const slideContentSummary = contentSlides.map(slide => 
    `Slide ${slide.slideNumber}: "${slide.textContent.substring(0, 300)}${slide.textContent.length > 300 ? '...' : ''}"`
  ).join('\n\n');

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
          content: `You are an expert at creating engaging narration scripts for educational videos from PowerPoint presentations.
          
          Your task is to create a natural, conversational script that an AI avatar will read to explain the content.
          
          CRITICAL REQUIREMENTS:
          - Create a flowing, natural narration that connects all the slide content
          - Use conversational language suitable for video narration
          - Include smooth transitions between topics
          - Make it engaging and educational
          - Keep sentences at moderate length for clear speech
          - Include brief pauses where natural (indicate with [PAUSE])
          - Total script should be appropriate for a 5-10 minute video
          
          Return ONLY the script text - no additional formatting or explanations.`
        },
        {
          role: 'user',
          content: `Please create a narration script for this PowerPoint presentation: "${filename}"
          
          Here is the content from each slide:
          
          ${slideContentSummary}
          
          Create a natural, engaging script that flows smoothly from topic to topic, suitable for an AI avatar to read as video narration.`
        }
      ],
      temperature: 0.3,
    }),
  });

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
  }

  const aiResult = await openAIResponse.json();
  return aiResult.choices[0].message.content.trim();
}

async function generateHeyGenVideo(script: string, avatarId: string, voiceId: string): Promise<string> {
  const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-API-KEY': Deno.env.get('HEYGEN_API_KEY') ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: avatarId,
          scale: 1.0
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId
        }
      }],
      dimension: {
        width: 1280,
        height: 720
      },
      aspect_ratio: "16:9"
    }),
  });

  if (!heygenResponse.ok) {
    const errorText = await heygenResponse.text();
    throw new Error(`HeyGen API error: ${heygenResponse.statusText} - ${errorText}`);
  }

  const result = await heygenResponse.json();
  
  // HeyGen returns a job ID, we need to poll for completion
  const jobId = result.data.video_id;
  
  // Poll for video completion (simplified - in production you'd want a webhook)
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${jobId}`, {
      headers: {
        'X-API-KEY': Deno.env.get('HEYGEN_API_KEY') ?? '',
      },
    });
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      
      if (statusResult.data.status === 'completed') {
        return statusResult.data.video_url;
      } else if (statusResult.data.status === 'failed') {
        throw new Error('HeyGen video generation failed');
      }
    }
    
    attempts++;
  }
  
  throw new Error('HeyGen video generation timed out');
}
