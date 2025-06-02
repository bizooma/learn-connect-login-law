
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

    const { courseId, userId } = await req.json();
    console.log('Generating certificate for:', { courseId, userId });

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Get course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new Error('Course not found');
    }

    // Get default certificate template
    const { data: template, error: templateError } = await supabaseClient
      .from('certificate_templates')
      .select('*')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error('Certificate template not found');
    }

    // Check if certificate already exists
    const { data: existingCert, error: certCheckError } = await supabaseClient
      .from('user_certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (certCheckError) {
      throw new Error('Error checking existing certificate');
    }

    let certificateRecord = existingCert;

    // Create certificate record if it doesn't exist
    if (!existingCert) {
      const recipientName = `${profile.first_name} ${profile.last_name}`;
      
      // Generate certificate number
      const { data: certNumberResult, error: certNumberError } = await supabaseClient
        .rpc('generate_certificate_number');

      if (certNumberError) {
        throw new Error('Failed to generate certificate number');
      }

      const { data: newCert, error: createError } = await supabaseClient
        .from('user_certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          template_id: template.id,
          recipient_name: recipientName,
          course_title: course.title,
          certificate_number: certNumberResult
        })
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create certificate record');
      }

      certificateRecord = newCert;
    }

    // Create canvas to generate certificate image
    const canvas = new OffscreenCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Create a simple certificate design
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);

    // Add border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 760, 560);

    // Add inner border
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 720, 520);

    // Add title
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', 400, 120);

    // Add subtitle
    ctx.font = '18px serif';
    ctx.fillText('This is to certify that', 400, 180);

    // Add recipient name
    ctx.font = 'bold 32px serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(certificateRecord.recipient_name, 400, 240);

    // Add course completion text
    ctx.fillStyle = '#1e40af';
    ctx.font = '18px serif';
    ctx.fillText('has successfully completed the course', 400, 300);

    // Add course title
    ctx.font = 'bold 28px serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(certificateRecord.course_title, 400, 360);

    // Add date
    ctx.fillStyle = '#1e40af';
    ctx.font = '16px serif';
    const issueDate = new Date(certificateRecord.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`Issued on ${issueDate}`, 400, 420);

    // Add certificate number
    ctx.font = '14px serif';
    ctx.fillText(`Certificate No: ${certificateRecord.certificate_number}`, 400, 480);

    // Add signature line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(300, 520);
    ctx.lineTo(500, 520);
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.font = '14px serif';
    ctx.fillText('New Frontier University', 400, 540);

    // Convert canvas to blob
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await blob.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="certificate-${certificateRecord.certificate_number}.png"`
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
