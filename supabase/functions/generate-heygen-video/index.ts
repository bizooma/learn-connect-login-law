import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Copy the interfaces and parsing logic directly into this function
interface SlideContent {
  slideNumber: number;
  textContent: string;
  hasContent: boolean;
}

async function parsePowerPointFile(fileBlob: Blob): Promise<SlideContent[]> {
  try {
    // Import JSZip dynamically
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    
    const zip = await JSZip.loadAsync(fileBlob);
    const slides: SlideContent[] = [];
    
    // Get all slide files from the PowerPoint structure
    const slideFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')
    );
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return aNum - bNum;
    });
    
    for (const slideFile of slideFiles) {
      const slideNumber = parseInt(slideFile.match(/slide(\d+)\.xml/)?.[1] || '0');
      
      try {
        const slideXml = await zip.files[slideFile].async('text');
        const textContent = extractTextFromSlideXml(slideXml);
        
        // Skip slides with minimal content (likely title slides or agenda)
        const hasContent = textContent.length > 20 && 
          !isNonContentSlide(textContent);
        
        slides.push({
          slideNumber,
          textContent: textContent || `Slide ${slideNumber} content`,
          hasContent
        });
      } catch (error) {
        console.error(`Error parsing slide ${slideNumber}:`, error);
        slides.push({
          slideNumber,
          textContent: `Content from slide ${slideNumber}`,
          hasContent: false
        });
      }
    }
    
    return slides;
  } catch (error) {
    console.error('Error parsing PowerPoint file:', error);
    throw new Error('Failed to parse PowerPoint file');
  }
}

function extractTextFromSlideXml(xmlContent: string): string {
  try {
    // Remove XML tags and extract text content
    // This is a simplified parser - in production you might want a more robust XML parser
    let text = xmlContent
      .replace(/<[^>]*>/g, ' ') // Remove all XML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Clean up common PowerPoint artifacts
    text = text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    
    return text;
  } catch (error) {
    console.error('Error extracting text from slide XML:', error);
    return '';
  }
}

function isNonContentSlide(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Skip slides that are likely non-content
  const skipPhrases = [
    'thank you',
    'questions',
    'agenda',
    'outline',
    'table of contents',
    'overview',
    'introduction',
    'conclusion'
  ];
  
  return skipPhrases.some(phrase => lowerText.includes(phrase)) && text.length < 100;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log('HeyGen video generation request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody: any;
  let importId: string | undefined;

  try {
    // Parse request body once and store it
    requestBody = await req.json();
    const { importId: reqImportId, action } = requestBody;
    importId = reqImportId;
    
    console.log('Processing HeyGen video generation:', { importId, action });

    // Validate required parameters
    if (!importId) {
      throw new Error('Import ID is required');
    }

    if (!action) {
      throw new Error('Action is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the import record
    const { data: importRecord, error: fetchError } = await supabaseClient
      .from('powerpoint_video_imports')
      .select('*')
      .eq('id', importId)
      .single();

    if (fetchError || !importRecord) {
      console.error('Import record fetch error:', fetchError);
      throw new Error('Import record not found');
    }

    console.log('Import record found:', importRecord.filename);

    if (action === 'generate_script') {
      // Update status to processing script
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ status: 'generating_script' })
        .eq('id', importId);

      console.log('Downloading PowerPoint file from storage...');
      
      // Download and parse PowerPoint file
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('powerpoint-uploads')
        .download(importRecord.file_url);

      if (downloadError || !fileData) {
        console.error('File download error:', downloadError);
        throw new Error('Failed to download PowerPoint file');
      }

      console.log('PowerPoint file downloaded successfully, parsing...');

      const slideContents = await parsePowerPointFile(fileData);
      console.log('Parsed PowerPoint file, found slides:', slideContents.length);

      if (slideContents.length === 0) {
        throw new Error('No content found in PowerPoint file');
      }

      // Generate script using OpenAI
      console.log('Generating narration script...');
      const script = await generateNarrationScript(importRecord.filename, slideContents);

      // Update record with script and your specific clone settings
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          script_content: script,
          status: 'script_ready',
          avatar_id: '1569542b64d048f9b6316e2f6c9276b7',
          voice_id: '1569542b64d048f9b6316e2f6c9276b7'
        })
        .eq('id', importId);

      console.log('Script generated and saved successfully');

      return new Response(
        JSON.stringify({ success: true, script }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'generate_video') {
      // Use your specific clone ID
      const avatarId = '1569542b64d048f9b6316e2f6c9276b7';

      // Update status
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          status: 'generating_video',
          avatar_id: avatarId,
          voice_id: avatarId
        })
        .eq('id', importId);

      console.log('Generating video with HeyGen using clone ID:', avatarId);

      // Generate video with HeyGen - try with just avatar_id for voice
      const videoUrl = await generateHeyGenVideo(importRecord.script_content, avatarId);

      // Update record with video URL
      await supabaseClient
        .from('powerpoint_video_imports')
        .update({ 
          heygen_video_url: videoUrl,
          status: 'completed' 
        })
        .eq('id', importId);

      console.log('Video generated successfully:', videoUrl);

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
    
    // Only try to update error status if we have an importId and can create supabase client
    if (importId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );
        
        await supabaseClient
          .from('powerpoint_video_imports')
          .update({ 
            status: 'error',
            error_message: error.message 
          })
          .eq('id', importId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
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

async function generateNarrationScript(filename: string, slideContents: SlideContent[]): Promise<string> {
  console.log('Starting script generation for:', filename);
  
  const contentSlides = slideContents.filter(slide => slide.hasContent);
  
  if (contentSlides.length === 0) {
    throw new Error('No content slides found to generate script from');
  }
  
  const slideContentSummary = contentSlides.map(slide => 
    `Slide ${slide.slideNumber}: "${slide.textContent.substring(0, 300)}${slide.textContent.length > 300 ? '...' : ''}"`
  ).join('\n\n');

  console.log('Calling OpenAI API for script generation...');

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
    const errorText = await openAIResponse.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
  }

  const aiResult = await openAIResponse.json();
  const script = aiResult.choices[0].message.content.trim();
  
  console.log('Script generated successfully, length:', script.length);
  return script;
}

async function generateHeyGenVideo(script: string, avatarId: string): Promise<string> {
  console.log('Starting HeyGen video generation with clone ID:', avatarId);
  
  // Try the simplified API structure for clones
  const requestBody = {
    video_inputs: [{
      character: {
        type: "avatar",
        avatar_id: avatarId,
        scale: 1.0
      },
      voice: {
        type: "text",
        input_text: script
        // Remove voice_id for clones - the voice is part of the avatar
      }
    }],
    dimension: {
      width: 1280,
      height: 720
    },
    aspect_ratio: "16:9"
  };

  console.log('HeyGen request body:', JSON.stringify(requestBody, null, 2));
  
  const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-API-KEY': Deno.env.get('HEYGEN_API_KEY') ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!heygenResponse.ok) {
    const errorText = await heygenResponse.text();
    console.error('HeyGen API error:', errorText);
    
    // Try to parse the error to provide better feedback
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error?.code === 'avatar_not_found') {
        throw new Error(`Clone ID "${avatarId}" not found. Please verify your clone ID in HeyGen dashboard.`);
      }
      if (errorData.error?.message) {
        throw new Error(`HeyGen API error: ${errorData.error.message}`);
      }
    } catch (parseError) {
      // Fall back to original error
    }
    
    throw new Error(`HeyGen API error: ${heygenResponse.statusText} - ${errorText}`);
  }

  const result = await heygenResponse.json();
  console.log('HeyGen response:', result);
  
  // HeyGen returns a job ID, we need to poll for completion
  const jobId = result.data.video_id;
  console.log('Video job ID:', jobId);
  
  // Poll for video completion (simplified - in production you'd want a webhook)
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max
  
  while (attempts < maxAttempts) {
    console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${jobId}`, {
      headers: {
        'X-API-KEY': Deno.env.get('HEYGEN_API_KEY') ?? '',
      },
    });
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      console.log('Video status:', statusResult.data.status);
      
      if (statusResult.data.status === 'completed') {
        console.log('Video completed successfully:', statusResult.data.video_url);
        return statusResult.data.video_url;
      } else if (statusResult.data.status === 'failed') {
        throw new Error('HeyGen video generation failed');
      }
    }
    
    attempts++;
  }
  
  throw new Error('HeyGen video generation timed out');
}
