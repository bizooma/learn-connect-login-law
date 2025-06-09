
import type { CertificateTemplate, CertificateRecord } from './types.ts';

export async function loadTemplateImage(templateUrl: string): Promise<Uint8Array> {
  console.log('Loading template image from:', templateUrl);
  
  let finalUrl = templateUrl;
  
  // Handle relative URLs by constructing absolute URL
  if (templateUrl.startsWith('/')) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    finalUrl = `${supabaseUrl}${templateUrl}`;
    console.log('Resolved relative URL to:', finalUrl);
  }
  
  try {
    const templateResponse = await fetch(finalUrl);
    if (!templateResponse.ok) {
      console.error('Failed to fetch template image:', {
        url: finalUrl,
        status: templateResponse.status,
        statusText: templateResponse.statusText
      });
      throw new Error(`Failed to load certificate template image: ${templateResponse.status} ${templateResponse.statusText}`);
    }

    const templateArrayBuffer = await templateResponse.arrayBuffer();
    const imageData = new Uint8Array(templateArrayBuffer);
    
    console.log('Template image loaded successfully:', {
      url: finalUrl,
      size: imageData.length
    });
    
    return imageData;
  } catch (error) {
    console.error('Error loading template image:', error);
    throw new Error(`Failed to load certificate template image: ${error.message}`);
  }
}

export async function createCertificateCanvas(
  templateImageData: Uint8Array,
  certificateRecord: CertificateRecord
): Promise<Blob> {
  try {
    console.log('Creating certificate canvas for:', certificateRecord.recipient_name);
    
    // Create a temporary image to get dimensions
    const tempImage = new Image();
    const imageLoadPromise = new Promise((resolve, reject) => {
      tempImage.onload = resolve;
      tempImage.onerror = (error) => {
        console.error('Error loading template image for canvas:', error);
        reject(new Error('Failed to load template image for processing'));
      };
    });

    // Convert array buffer to data URL for the image
    const base64Template = btoa(String.fromCharCode(...templateImageData));
    tempImage.src = `data:image/png;base64,${base64Template}`;
    
    await imageLoadPromise;

    // Create canvas with template dimensions
    const canvas = new OffscreenCanvas(tempImage.width || 800, tempImage.height || 600);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    // Create image bitmap from the template
    const templateBlob = new Blob([templateImageData], { type: 'image/png' });
    const templateBitmap = await createImageBitmap(templateBlob);

    // Draw the template as background
    ctx.drawImage(templateBitmap, 0, 0);

    // Add text overlays
    addTextOverlays(ctx, canvas, certificateRecord);

    // Convert canvas to blob
    const certificateBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    console.log('Certificate canvas created successfully:', {
      width: canvas.width,
      height: canvas.height,
      blobSize: certificateBlob.size
    });
    
    return certificateBlob;
  } catch (error) {
    console.error('Error creating certificate canvas:', error);
    throw new Error(`Failed to create certificate: ${error.message}`);
  }
}

function addTextOverlays(
  ctx: OffscreenCanvasRenderingContext2D,
  canvas: OffscreenCanvas,
  certificateRecord: CertificateRecord
): void {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  console.log('Adding text overlays to certificate:', {
    canvasSize: `${canvasWidth}x${canvasHeight}`,
    recipient: certificateRecord.recipient_name,
    course: certificateRecord.course_title
  });

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
  
  console.log('Text overlays added successfully');
}
