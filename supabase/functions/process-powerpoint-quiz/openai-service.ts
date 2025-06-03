
import { ExtractedQuizData } from './types.ts';
import { SlideContent } from './powerpoint-parser.ts';

export async function processWithOpenAI(importRecord: any, slideContents: SlideContent[]): Promise<ExtractedQuizData> {
  // Filter to only content slides
  const contentSlides = slideContents.filter(slide => slide.hasContent);
  
  if (contentSlides.length === 0) {
    throw new Error('No content slides found to generate questions from');
  }
  
  // Create a detailed prompt with actual slide content
  const slideContentSummary = contentSlides.map(slide => 
    `Slide ${slide.slideNumber}: "${slide.textContent.substring(0, 200)}${slide.textContent.length > 200 ? '...' : ''}"`
  ).join('\n');

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
          Your task is to analyze the presentation content and create exactly ONE multiple choice question per content slide.
          
          CRITICAL REQUIREMENTS:
          - Generate exactly 1 question per slide that contains meaningful content
          - Each question must have exactly 4 multiple choice options (A, B, C, D)
          - Base each question ONLY on the actual content provided from that specific slide
          - Use the slide content to create the correct answer and 3 plausible incorrect options
          - Questions should test understanding of the key concept presented on each slide
          - DO NOT use generic immigration law knowledge - only use what's provided in the slide content
          
          Return your response as a JSON object with this exact structure:
          {
            "title": "Quiz title based on presentation content",
            "description": "Brief description of the quiz topic",
            "slides_analyzed": [
              {
                "slide_number": 1,
                "content_extracted": "The actual key content from the slide",
                "content_summary": "Brief summary of what this slide covers",
                "has_quiz_content": true
              }
            ],
            "questions": [
              {
                "question_text": "Clear question testing the slide's key concept",
                "slide_number": 1,
                "slide_content_used": "The slide content that informed this question",
                "options": [
                  {"text": "Correct answer based on slide content", "is_correct": true},
                  {"text": "Plausible incorrect option A", "is_correct": false},
                  {"text": "Plausible incorrect option B", "is_correct": false},
                  {"text": "Plausible incorrect option C", "is_correct": false}
                ]
              }
            ]
          }
          
          Guidelines for question creation:
          - Focus ONLY on the information provided in each slide
          - Make incorrect options believable but clearly wrong based on the slide content
          - Ensure questions are clear and unambiguous
          - Test practical knowledge from the specific slide content`
        },
        {
          role: 'user',
          content: `Please analyze this PowerPoint file: "${importRecord.filename}" and create quiz questions based on the actual slide content.
          
          Here is the actual content from each slide:
          
          ${slideContentSummary}
          
          IMPORTANT: Create exactly one question per slide listed above. Base each question ONLY on the content from that specific slide. Do not use general knowledge - only use what's written in the slide content provided.
          
          For each slide, identify the main concept or key information and create a multiple choice question that tests understanding of that specific content.`
        }
      ],
      temperature: 0.2,
    }),
  });

  if (!openAIResponse.ok) {
    const errorText = await openAIResponse.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
  }

  const aiResult = await openAIResponse.json();
  
  if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
    throw new Error('Invalid response from OpenAI API');
  }
  
  const content = aiResult.choices[0].message.content;
  
  // Clean up the response if it's wrapped in markdown code blocks
  const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleanContent);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', cleanContent);
    throw new Error('Failed to parse AI response as JSON');
  }
}
