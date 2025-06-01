
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Check, X } from "lucide-react";
import { QuizData, QuestionData, OptionData } from "./types";

interface QuizManagerProps {
  quiz: QuizData | undefined;
  onQuizUpdate: (quiz: QuizData | undefined) => void;
}

const QuizManager = ({ quiz, onQuizUpdate }: QuizManagerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  const handleCreateQuiz = () => {
    const newQuiz: QuizData = {
      title: "New Quiz",
      description: "",
      passing_score: 70,
      time_limit_minutes: undefined,
      is_active: true,
      questions: []
    };
    onQuizUpdate(newQuiz);
    setIsEditing(true);
  };

  const handleDeleteQuiz = () => {
    onQuizUpdate(undefined);
    setIsEditing(false);
  };

  const handleQuizChange = (field: keyof QuizData, value: any) => {
    if (!quiz) return;
    onQuizUpdate({ ...quiz, [field]: value });
  };

  const handleAddQuestion = () => {
    if (!quiz) return;
    const newQuestion: QuestionData = {
      question_text: "New question",
      question_type: 'multiple_choice',
      points: 1,
      sort_order: quiz.questions.length,
      options: [
        { option_text: "Option 1", is_correct: true, sort_order: 0 },
        { option_text: "Option 2", is_correct: false, sort_order: 1 }
      ]
    };
    onQuizUpdate({ ...quiz, questions: [...quiz.questions, newQuestion] });
  };

  const handleDeleteQuestion = (questionIndex: number) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.filter((_, i) => i !== questionIndex);
    onQuizUpdate({ ...quiz, questions: updatedQuestions });
  };

  const handleQuestionChange = (questionIndex: number, field: keyof QuestionData, value: any) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.map((q, i) => 
      i === questionIndex ? { ...q, [field]: value } : q
    );
    onQuizUpdate({ ...quiz, questions: updatedQuestions });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: keyof OptionData, value: any) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === questionIndex) {
        const updatedOptions = q.options.map((o, j) => 
          j === optionIndex ? { ...o, [field]: value } : o
        );
        return { ...q, options: updatedOptions };
      }
      return q;
    });
    onQuizUpdate({ ...quiz, questions: updatedQuestions });
  };

  const handleAddOption = (questionIndex: number) => {
    if (!quiz) return;
    const question = quiz.questions[questionIndex];
    const newOption: OptionData = {
      option_text: `Option ${question.options.length + 1}`,
      is_correct: false,
      sort_order: question.options.length
    };
    
    const updatedQuestions = quiz.questions.map((q, i) => 
      i === questionIndex ? { ...q, options: [...q.options, newOption] } : q
    );
    onQuizUpdate({ ...quiz, questions: updatedQuestions });
  };

  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.map((q, i) => {
      if (i === questionIndex) {
        const updatedOptions = q.options.filter((_, j) => j !== optionIndex);
        return { ...q, options: updatedOptions };
      }
      return q;
    });
    onQuizUpdate({ ...quiz, questions: updatedQuestions });
  };

  if (!quiz) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <Button onClick={handleCreateQuiz} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base">Quiz</CardTitle>
            <Badge variant="secondary">
              {quiz.questions.length} questions
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteQuiz}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Quiz Title</Label>
                <Input
                  value={quiz.title}
                  onChange={(e) => handleQuizChange('title', e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <Label>Passing Score (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.passing_score}
                  onChange={(e) => handleQuizChange('passing_score', parseInt(e.target.value) || 70)}
                />
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={quiz.description || ''}
                onChange={(e) => handleQuizChange('description', e.target.value)}
                placeholder="Enter quiz description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  min="1"
                  value={quiz.time_limit_minutes || ''}
                  onChange={(e) => handleQuizChange('time_limit_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="No limit"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={quiz.is_active}
                  onCheckedChange={(checked) => handleQuizChange('is_active', checked)}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Questions</h4>
                <Button onClick={handleAddQuestion} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {quiz.questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="bg-gray-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Question {questionIndex + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <Input
                          value={question.question_text}
                          onChange={(e) => handleQuestionChange(questionIndex, 'question_text', e.target.value)}
                          placeholder="Enter question text"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(questionIndex, 'points', parseInt(e.target.value) || 1)}
                          placeholder="Points"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Options</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddOption(questionIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Input
                            value={option.option_text}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'option_text', e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center space-x-1">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={option.is_correct}
                              onChange={(e) => {
                                // Only one option can be correct, so update all options
                                const updatedOptions = question.options.map((o, i) => ({
                                  ...o,
                                  is_correct: i === optionIndex
                                }));
                                handleQuestionChange(questionIndex, 'options', updatedOptions);
                              }}
                            />
                            <Label className="text-xs">Correct</Label>
                          </div>
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOption(questionIndex, optionIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="font-medium">{quiz.title}</p>
            {quiz.description && (
              <p className="text-sm text-gray-600">{quiz.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Passing Score: {quiz.passing_score}%</span>
              {quiz.time_limit_minutes && (
                <span>Time Limit: {quiz.time_limit_minutes} min</span>
              )}
              <Badge variant={quiz.is_active ? "default" : "secondary"}>
                {quiz.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizManager;
