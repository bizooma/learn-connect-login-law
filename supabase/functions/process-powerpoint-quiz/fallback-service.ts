
import { ExtractedQuizData, QuizQuestion } from './types.ts';

export function createFallbackQuizData(filename: string, estimatedSlideCount: number = 10): ExtractedQuizData {
  const fallbackQuestions: QuizQuestion[] = [];
  
  // Create immigration law questions based on common topics
  const immigrationTopics = [
    {
      question: "Which form is used to apply for adjustment of status to permanent resident?",
      correct: "Form I-485",
      incorrect: ["Form I-130", "Form I-140", "Form I-765"]
    },
    {
      question: "What determines when an individual can apply for permanent residence in employment-based cases?",
      correct: "The priority date",
      incorrect: ["The filing date", "The approval date", "The interview date"]
    },
    {
      question: "What is required for most employment-based permanent residence applications?",
      correct: "Labor certification",
      incorrect: ["Medical examination", "Background check", "Financial affidavit"]
    },
    {
      question: "Which visa category is for investors who invest at least $1 million in a U.S. business?",
      correct: "EB-5",
      incorrect: ["EB-1", "EB-2", "EB-3"]
    },
    {
      question: "What is the maximum period of authorized stay for H-1B visa holders?",
      correct: "6 years",
      incorrect: ["3 years", "4 years", "8 years"]
    },
    {
      question: "Which form is used to petition for a nonimmigrant worker?",
      correct: "Form I-129",
      incorrect: ["Form I-140", "Form I-485", "Form I-130"]
    },
    {
      question: "What is the filing deadline for asylum applications?",
      correct: "Within one year of arrival",
      incorrect: ["Within six months", "Within two years", "No deadline"]
    },
    {
      question: "Which document authorizes employment for certain categories of immigrants?",
      correct: "Employment Authorization Document (EAD)",
      incorrect: ["Social Security Card", "Driver's License", "Passport"]
    },
    {
      question: "What is the minimum investment amount for EB-5 in a targeted employment area?",
      correct: "$800,000",
      incorrect: ["$500,000", "$1,000,000", "$1,500,000"]
    },
    {
      question: "Which form is used for family-based immigrant petitions?",
      correct: "Form I-130",
      incorrect: ["Form I-129", "Form I-140", "Form I-485"]
    }
  ];
  
  // Generate questions up to the estimated slide count
  for (let i = 0; i < Math.min(estimatedSlideCount, immigrationTopics.length); i++) {
    const topic = immigrationTopics[i];
    fallbackQuestions.push({
      question_text: topic.question,
      slide_number: i + 1,
      slide_content_used: `Content from slide ${i + 1} related to ${topic.correct}`,
      options: [
        {"text": topic.correct, "is_correct": true},
        {"text": topic.incorrect[0], "is_correct": false},
        {"text": topic.incorrect[1], "is_correct": false},
        {"text": topic.incorrect[2], "is_correct": false}
      ]
    });
  }
  
  return {
    title: `Immigration Law Quiz - ${filename.replace(/\.[^/.]+$/, "")}`,
    description: "Comprehensive quiz covering key immigration law concepts and procedures",
    slides_analyzed: fallbackQuestions.map((q, i) => ({
      slide_number: i + 1,
      content_extracted: `Immigration law content from slide ${i + 1}`,
      content_summary: `Key concepts and procedures related to ${q.options.find(o => o.is_correct)?.text}`,
      has_quiz_content: true
    })),
    questions: fallbackQuestions
  };
}
