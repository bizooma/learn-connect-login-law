
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { QuizData, QuestionData, OptionData } from './types';

interface QuizManagerProps {
  quizzes: QuizData[];
  onQuizzesChange: (quizzes: QuizData[]) => void;
}

const QuizManager = ({ quizzes, onQuizzesChange }: QuizManagerProps) => {
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<number>>(new Set());

  const addQuiz = () => {
    const newQuiz: QuizData = {
      title: '',
      description: '',
      passing_score: 70,
      time_limit_minutes: 30,
      is_active: true,
      questions: []
    };
    onQuizzesChange([...quizzes, newQuiz]);
  };

  const updateQuiz = (quizIndex: number, field: keyof QuizData, value: any) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex] = { ...updatedQuizzes[quizIndex], [field]: value };
    onQuizzesChange(updatedQuizzes);
  };

  const deleteQuiz = (quizIndex: number) => {
    const updatedQuizzes = quizzes.filter((_, index) => index !== quizIndex);
    onQuizzesChange(updatedQuizzes);
  };

  const addQuestion = (quizIndex: number) => {
    const newQuestion: QuestionData = {
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false }
      ]
    };
    
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions.push(newQuestion);
    onQuizzesChange(updatedQuizzes);
  };

  const updateQuestion = (quizIndex: number, questionIndex: number, field: keyof QuestionData, value: any) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions[questionIndex] = {
      ...updatedQuizzes[quizIndex].questions[questionIndex],
      [field]: value
    };
    onQuizzesChange(updatedQuizzes);
  };

  const deleteQuestion = (quizIndex: number, questionIndex: number) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions = updatedQuizzes[quizIndex].questions.filter((_, index) => index !== questionIndex);
    onQuizzesChange(updatedQuizzes);
  };

  const addOption = (quizIndex: number, questionIndex: number) => {
    const newOption: OptionData = {
      option_text: '',
      is_correct: false
    };
    
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions[questionIndex].options.push(newOption);
    onQuizzesChange(updatedQuizzes);
  };

  const updateOption = (quizIndex: number, questionIndex: number, optionIndex: number, field: keyof OptionData, value: any) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions[questionIndex].options[optionIndex] = {
      ...updatedQuizzes[quizIndex].questions[questionIndex].options[optionIndex],
      [field]: value
    };
    onQuizzesChange(updatedQuizzes);
  };

  const deleteOption = (quizIndex: number, questionIndex: number, optionIndex: number) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[quizIndex].questions[questionIndex].options = 
      updatedQuizzes[quizIndex].questions[questionIndex].options.filter((_, index) => index !== optionIndex);
    onQuizzesChange(updatedQuizzes);
  };

  const toggleQuizExpanded = (quizIndex: number) => {
    setExpandedQuizzes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quizIndex)) {
        newSet.delete(quizIndex);
      } else {
        newSet.add(quizIndex);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quizzes</h3>
        <Button onClick={addQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          Add Quiz
        </Button>
      </div>

      {quizzes.map((quiz, quizIndex) => (
        <Card key={quizIndex} className="border-purple-200">
          <CardHeader className="bg-purple-50 cursor-pointer" onClick={() => toggleQuizExpanded(quizIndex)}>
            <CardTitle className="flex items-center justify-between">
              <span>Quiz {quizIndex + 1}: {quiz.title || 'Untitled Quiz'}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuiz(quizIndex);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          {expandedQuizzes.has(quizIndex) && (
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label>Quiz Title</Label>
                <Input
                  value={quiz.title}
                  onChange={(e) => updateQuiz(quizIndex, 'title', e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              
              <div>
                <Label>Quiz Description</Label>
                <Textarea
                  value={quiz.description}
                  onChange={(e) => updateQuiz(quizIndex, 'description', e.target.value)}
                  placeholder="Enter quiz description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={quiz.passing_score || 70}
                    onChange={(e) => updateQuiz(quizIndex, 'passing_score', parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={quiz.time_limit_minutes || 30}
                    onChange={(e) => updateQuiz(quizIndex, 'time_limit_minutes', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={quiz.is_active ?? true}
                  onCheckedChange={(checked) => updateQuiz(quizIndex, 'is_active', checked)}
                />
                <Label>Active Quiz</Label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Questions</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion(quizIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {quiz.questions.map((question, questionIndex) => (
                  <Card key={questionIndex} className="border-orange-200 ml-4">
                    <CardHeader className="bg-orange-50 py-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>Question {questionIndex + 1}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteQuestion(quizIndex, questionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <Label>Question Text</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(quizIndex, questionIndex, 'question_text', e.target.value)}
                          placeholder="Enter question text"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Question Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value) => updateQuestion(quizIndex, questionIndex, 'question_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={question.points || 1}
                            onChange={(e) => updateQuestion(quizIndex, questionIndex, 'points', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Answer Options</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(quizIndex, questionIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>

                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              checked={option.is_correct}
                              onCheckedChange={(checked) => 
                                updateOption(quizIndex, questionIndex, optionIndex, 'is_correct', checked)
                              }
                            />
                            <Input
                              value={option.option_text}
                              onChange={(e) => 
                                updateOption(quizIndex, questionIndex, optionIndex, 'option_text', e.target.value)
                              }
                              placeholder="Enter option text"
                              className="flex-1"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteOption(quizIndex, questionIndex, optionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {quizzes.length === 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No quizzes created yet.</p>
            <Button onClick={addQuiz}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizManager;
