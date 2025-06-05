
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

    if (!template.template_image_url) {
      throw new Error('Template image URL not found');
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

    // Load the template image
    console.log('Loading template image from:', template.template_image_url);
    const templateResponse = await fetch(template.template_image_url);
    if (!templateResponse.ok) {
      throw new Error('Failed to load certificate template image');
    }

    const templateArrayBuffer = await templateResponse.arrayBuffer();
    const templateImageData = new Uint8Array(templateArrayBuffer);

    // Create a temporary image to get dimensions
    const tempImage = new Image();
    const imageLoadPromise = new Promise((resolve, reject) => {
      tempImage.onload = resolve;
      tempImage.onerror = reject;
    });

    // Convert array buffer to data URL for the image
    const base64Template = btoa(String.fromCharCode(...templateImageData));
    tempImage.src = `data:image/png;base64,${base64Template}`;
    
    await imageLoadPromise;

    // Create canvas with template dimensions
    const canvas = new OffscreenCanvas(tempImage.width || 800, tempImage.height || 600);
    const ctx = canvas.getContext('2d');

    // Create image bitmap from the template
    const templateBlob = new Blob([templateImageData], { type: 'image/png' });
    const templateBitmap = await createImageBitmap(templateBlob);

    // Draw the template as background
    ctx.drawImage(templateBitmap, 0, 0);

    // Configure text styling for overlays
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Add recipient name (positioned for typical certificate layout)
    ctx.fillStyle = '#1e40af'; // Blue color for name
    ctx.font = `bold ${Math.floor(canvasWidth * 0.04)}px serif`; // Responsive font size
    ctx.textAlign = 'center';
    ctx.fillText(
      certificateRecord.recipient_name,
      canvasWidth / 2,
      canvasHeight * 0.45 // Positioned at 45% height
    );

    // Add course title
    ctx.fillStyle = '#dc2626'; // Red color for course title
    ctx.font = `bold ${Math.floor(canvasWidth * 0.032)}px serif`;
    ctx.fillText(
      certificateRecord.course_title,
      canvasWidth / 2,
      canvasHeight * 0.6 // Positioned at 60% height
    );

    // Add date
    ctx.fillStyle = '#1e40af';
    ctx.font = `${Math.floor(canvasWidth * 0.018)}px serif`;
    const issueDate = new Date(certificateRecord.issued_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(
      `Issued on ${issueDate}`,
      canvasWidth / 2,
      canvasHeight * 0.75 // Positioned at 75% height
    );

    // Add certificate number
    ctx.font = `${Math.floor(canvasWidth * 0.016)}px serif`;
    ctx.fillText(
      `Certificate No: ${certificateRecord.certificate_number}`,
      canvasWidth / 2,
      canvasHeight * 0.85 // Positioned at 85% height
    );

    // Convert canvas to blob
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await blob.arrayBuffer();

    console.log('Certificate generated successfully');

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
