
import { ExtractedQuizData, QuizQuestion } from './types.ts';

export function validateAndCleanExtractedData(extractedData: ExtractedQuizData): ExtractedQuizData {
  // Validate and ensure proper structure
  if (!extractedData.questions || !Array.isArray(extractedData.questions)) {
    throw new Error('Invalid question format in extracted data');
  }

  // Ensure all questions have exactly 4 options and proper structure
  extractedData.questions = extractedData.questions.map((q, index) => {
    const options = Array.isArray(q.options) && q.options.length === 4 ? q.options : [
      {"text": "Correct answer", "is_correct": true},
      {"text": "Incorrect option A", "is_correct": false},
      {"text": "Incorrect option B", "is_correct": false},
      {"text": "Incorrect option C", "is_correct": false}
    ];
    
    // Ensure exactly one correct answer
    const correctCount = options.filter(opt => opt.is_correct).length;
    if (correctCount !== 1) {
      options.forEach((opt, idx) => {
        opt.is_correct = idx === 0; // Make first option correct if there's an issue
      });
    }
    
    return {
      question_text: q.question_text || `Question ${index + 1}`,
      slide_number: q.slide_number || index + 1,
      slide_content_used: q.slide_content_used || `Content extracted from slide ${index + 1}`,
      options: options
    };
  });

  return extractedData;
}
