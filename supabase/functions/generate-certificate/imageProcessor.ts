
import type { CertificateTemplate, CertificateRecord } from './types.ts';

export async function loadTemplateImage(templateUrl: string, supabaseClient?: any, storagePath?: string): Promise<Uint8Array> {
  console.log('Loading template image from:', templateUrl, 'Storage path:', storagePath);
  
  // If we have a storage path, try to get the image from Supabase storage first
  if (storagePath && supabaseClient) {
    try {
      console.log('Attempting to fetch from Supabase storage:', storagePath);
      const { data, error } = await supabaseClient.storage
        .from('certificate-templates')
        .download(storagePath);
      
      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);
        console.log('Template image loaded successfully from storage:', {
          path: storagePath,
          size: imageData.length
        });
        return imageData;
      } else {
        console.warn('Failed to load from storage, falling back to URL:', error?.message);
      }
    } catch (error) {
      console.warn('Error loading from storage, falling back to URL:', error.message);
    }
  }
  
  // Fallback to direct URL fetch
  try {
    console.log('Attempting to fetch template from URL:', templateUrl);
    const templateResponse = await fetch(templateUrl);
    
    if (!templateResponse.ok) {
      throw new Error(`Failed to load certificate template: ${templateResponse.status} ${templateResponse.statusText}`);
    }

    const templateArrayBuffer = await templateResponse.arrayBuffer();
    const imageData = new Uint8Array(templateArrayBuffer);
    
    console.log('Template image loaded successfully from URL:', {
      url: templateUrl,
      size: imageData.length,
      contentType: templateResponse.headers.get('content-type')
    });
    
    return imageData;
  } catch (error) {
    console.error('Error loading template image:', {
      templateUrl,
      storagePath,
      error: error.message
    });
    throw new Error(`Failed to load certificate template image: ${error.message}`);
  }
}

export async function createCertificateCanvas(
  templateImageData: Uint8Array,
  certificateRecord: CertificateRecord
): Promise<Blob> {
  try {
    console.log('Creating certificate with ImageMagick-style approach for:', certificateRecord.recipient_name);
    
    // For now, we'll create a simple text-based certificate since Canvas API isn't available in Deno
    // This is a fallback approach that creates a basic certificate image
    
    // Create SVG certificate
    const svgWidth = 800;
    const svgHeight = 600;
    
    const svgContent = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        
        <!-- Border -->
        <rect x="50" y="50" width="${svgWidth-100}" height="${svgHeight-100}" 
              fill="none" stroke="#1e40af" stroke-width="4"/>
        
        <!-- Inner border -->
        <rect x="70" y="70" width="${svgWidth-140}" height="${svgHeight-140}" 
              fill="none" stroke="#dc2626" stroke-width="2"/>
        
        <!-- Title -->
        <text x="${svgWidth/2}" y="150" text-anchor="middle" 
              font-family="serif" font-size="36" font-weight="bold" fill="#1e40af">
          Certificate of Completion
        </text>
        
        <!-- Presented to text -->
        <text x="${svgWidth/2}" y="220" text-anchor="middle" 
              font-family="serif" font-size="18" fill="#666">
          This is to certify that
        </text>
        
        <!-- Recipient name -->
        <text x="${svgWidth/2}" y="280" text-anchor="middle" 
              font-family="serif" font-size="32" font-weight="bold" fill="#1e40af">
          ${certificateRecord.recipient_name}
        </text>
        
        <!-- Has completed text -->
        <text x="${svgWidth/2}" y="330" text-anchor="middle" 
              font-family="serif" font-size="18" fill="#666">
          has successfully completed the course
        </text>
        
        <!-- Course title -->
        <text x="${svgWidth/2}" y="380" text-anchor="middle" 
              font-family="serif" font-size="24" font-weight="bold" fill="#dc2626">
          ${certificateRecord.course_title}
        </text>
        
        <!-- Date -->
        <text x="${svgWidth/2}" y="450" text-anchor="middle" 
              font-family="serif" font-size="16" fill="#1e40af">
          Issued on ${new Date(certificateRecord.issued_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </text>
        
        <!-- Certificate number -->
        <text x="${svgWidth/2}" y="480" text-anchor="middle" 
              font-family="serif" font-size="14" fill="#666">
          Certificate No: ${certificateRecord.certificate_number}
        </text>
      </svg>
    `;
    
    // Convert SVG to blob
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    
    console.log('SVG certificate created successfully:', {
      width: svgWidth,
      height: svgHeight,
      blobSize: svgBlob.size
    });
    
    return svgBlob;
  } catch (error) {
    console.error('Error creating certificate:', error);
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
