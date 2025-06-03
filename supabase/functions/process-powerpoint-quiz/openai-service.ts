
import { ExtractedQuizData } from './types.ts';

export async function processWithOpenAI(importRecord: any): Promise<ExtractedQuizData> {
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
          Your task is to analyze the presentation and create exactly ONE multiple choice question per content slide.
          
          IMPORTANT REQUIREMENTS:
          - Generate exactly 1 question per slide that contains meaningful content
          - Each question must have exactly 4 multiple choice options (A, B, C, D)
          - Skip title slides, agenda slides, thank you slides, or other non-content slides
          - Use the slide content to create the correct answer and 3 plausible incorrect options
          - Questions should test understanding of the key concept presented on each slide
          
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
          - Focus on factual information, definitions, procedures, or key concepts from each slide
          - Make incorrect options believable but clearly wrong
          - Ensure questions are clear and unambiguous
          - Test practical knowledge that would be useful for someone learning the topic`
        },
        {
          role: 'user',
          content: `Please analyze this PowerPoint file: "${importRecord.filename}" and create quiz questions.
          
          This appears to be an immigration law training presentation. Please:
          
          1. Identify all slides with meaningful educational content (skip title, agenda, conclusion slides)
          2. For each content slide, create exactly ONE multiple choice question with 4 options
          3. Base questions on key facts, procedures, forms, deadlines, or concepts from each slide
          4. Ensure all 4 options are plausible but only 1 is correct
          
          Expected slide types in immigration law presentations:
          - Form definitions and purposes (I-485, I-130, I-140, etc.)
          - Process timelines and deadlines
          - Legal requirements and criteria
          - Document requirements
          - Case types and classifications
          - Important dates and priority dates
          - Fee information
          - Filing procedures
          
          Generate 1 question per content slide, aiming for 8-12 questions total if there are that many content slides.`
        }
      ],
      temperature: 0.2,
    }),
  });

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
  }

  const aiResult = await openAIResponse.json();
  return JSON.parse(aiResult.choices[0].message.content);
}
