
export interface SlideContent {
  slideNumber: number;
  textContent: string;
  hasContent: boolean;
}

export async function parsePowerPointFile(fileBlob: Blob): Promise<SlideContent[]> {
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
