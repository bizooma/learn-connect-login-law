
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { getImportRecord, updateImportStatus, updateImportWithData, updateImportWithError, downloadFile } from './database-service.ts';
import { processWithOpenAI } from './openai-service.ts';
import { createFallbackQuizData } from './fallback-service.ts';
import { validateAndCleanExtractedData } from './data-validator.ts';

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
    const importRecord = await getImportRecord(supabaseClient, importId);

    // Update status to processing
    await updateImportStatus(supabaseClient, importId, 'processing');

    // Download the PowerPoint file from storage
    await downloadFile(supabaseClient, importRecord.file_url);

    // Use OpenAI to extract quiz questions from the PowerPoint content
    let extractedData;

    try {
      extractedData = await processWithOpenAI(importRecord);
      console.log('Successfully parsed AI response:', extractedData);
      console.log('Generated questions count:', extractedData.questions?.length || 0);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response, using fallback:', parseError);
      
      // Enhanced fallback that creates questions based on typical slide count
      const estimatedSlideCount = 10; // Default assumption for content slides
      extractedData = createFallbackQuizData(importRecord.filename, estimatedSlideCount);
    }

    // Validate and clean the extracted data
    extractedData = validateAndCleanExtractedData(extractedData);

    // Update the import record with extracted data
    await updateImportWithData(supabaseClient, importId, extractedData);

    console.log('PowerPoint processing completed:', importId);
    console.log('Generated questions:', extractedData.questions.length);
    console.log('Questions per slide ratio:', extractedData.questions.length, '/', extractedData.slides_analyzed?.length || 'unknown slides');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        importId: importId,
        questionsGenerated: extractedData.questions.length
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
        await updateImportWithError(supabaseClient, importId, error.message);
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
