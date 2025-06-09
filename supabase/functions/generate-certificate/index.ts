
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import type { CertificateData } from './types.ts';
import { 
  getUserProfile, 
  getCourseDetails, 
  getCertificateTemplate, 
  getOrCreateCertificateRecord 
} from './database.ts';
import { loadTemplateImage, createCertificateCanvas } from './imageProcessor.ts';

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

    const { courseId, userId }: CertificateData = await req.json();
    console.log('Generating certificate for:', { courseId, userId });

    // Get all required data
    const [profile, course, template] = await Promise.all([
      getUserProfile(supabaseClient, userId),
      getCourseDetails(supabaseClient, courseId),
      getCertificateTemplate(supabaseClient)
    ]);

    console.log('Certificate data retrieved:', {
      profileName: `${profile.first_name} ${profile.last_name}`,
      courseTitle: course.title,
      templateId: template.id,
      templateUrl: template.template_image_url
    });

    // Get or create certificate record
    const certificateRecord = await getOrCreateCertificateRecord(
      supabaseClient,
      userId,
      courseId,
      template,
      profile,
      course
    );

    console.log('Certificate record prepared:', {
      certificateId: certificateRecord.id,
      certificateNumber: certificateRecord.certificate_number
    });

    // Load template image and generate certificate
    const templateImageData = await loadTemplateImage(template.template_image_url);
    const certificateBlob = await createCertificateCanvas(templateImageData, certificateRecord);
    
    const arrayBuffer = await certificateBlob.arrayBuffer();

    console.log('Certificate generated successfully:', {
      certificateNumber: certificateRecord.certificate_number,
      fileSize: arrayBuffer.byteLength
    });

    return new Response(arrayBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="certificate-${certificateRecord.certificate_number}.png"`
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    
    // Provide detailed error information for debugging
    const errorResponse = {
      error: error.message,
      details: error.stack || 'No stack trace available',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
