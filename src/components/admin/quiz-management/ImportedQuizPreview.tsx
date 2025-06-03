
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Edit, Save, X, Presentation, CheckCircle, AlertCircle } from "lucide-react";

interface ImportedQuizPreviewProps {
  importData: any;
  onConfirmImport: (finalData: any) => void;
  onCancel: () => void;
  units: any[];
}

const ImportedQuizPreview = ({ importData, onConfirmImport, onCancel, units }: ImportedQuizPreviewProps) => {
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [quizData, setQuizData] = useState({
    title: importData.title || "",
    description: importData.description || "",
    unit_id: "",
    passing_score: 70,
    time_limit_minutes: 60,
    questions: importData.questions || []
  });

  const handleQuizFieldChange = (field: string, value: any) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, index) => 
        index === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) => 
        qIndex === questionIndex ? {
          ...q,
          options: q.options.map((opt, oIndex) => 
            oIndex === optionIndex ? { ...opt, [field]: value } : opt
          )
        } : q
      )
    }));
  };

  const handleOptionCorrectChange = (questionIndex: number, optionIndex: number) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) => 
        qIndex === questionIndex ? {
          ...q,
          options: q.options.map((opt, oIndex) => ({ 
            ...opt, 
            is_correct: oIndex === optionIndex 
          }))
        } : q
      )
    }));
  };

  const handleConfirm = () => {
    if (!quizData.unit_id) {
      alert("Please select a unit for this quiz");
      return;
    }
    onConfirmImport(quizData);
  };

  const getSlidesAnalyzed = () => {
    return importData.slides_analyzed || [];
  };

  const getQuestionValidation = (question: any) => {
    const hasCorrectAnswer = question.options?.some(opt => opt.is_correct);
    const hasQuestionText = question.question_text?.trim().length > 0;
    const hasAllOptions = question.options?.length === 4 && question.options.every(opt => opt.text?.trim().length > 0);
    
    return {
      isValid: hasCorrectAnswer && hasQuestionText && hasAllOptions,
      issues: [
        !hasQuestionText && "Missing question text",
        !hasAllOptions && "Missing or incomplete answer options",
        !hasCorrectAnswer && "No correct answer selected"
      ].filter(Boolean)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Presentation className="h-5 w-5 text-blue-600" />
              <CardTitle>Review Imported Quiz</CardTitle>
            </div>
            <Badge variant="secondary">
              {quizData.questions.length} questions generated
            </Badge>
          </div>
          <CardDescription>
            Review and edit the quiz questions extracted from your PowerPoint presentation. 
            Each question is based on content from a specific slide.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Slides Analysis Summary */}
      {getSlidesAnalyzed().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Slides Analyzed</CardTitle>
            <CardDescription>
              Content extracted from {getSlidesAnalyzed().length} slides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {getSlidesAnalyzed().map((slide, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">Slide {slide.slide_number}</Badge>
                    <span className="text-sm font-medium">{slide.content_summary}</span>
                  </div>
                  <p className="text-sm text-gray-600">{slide.content_extracted}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quiz Settings</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingQuiz(!editingQuiz)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editingQuiz ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingQuiz ? (
            <>
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quizData.title}
                  onChange={(e) => handleQuizFieldChange("title", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quizData.description}
                  onChange={(e) => handleQuizFieldChange("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={quizData.unit_id} onValueChange={(value) => handleQuizFieldChange("unit_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.title} ({unit.lesson?.course?.title})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={quizData.passing_score}
                    onChange={(e) => handleQuizFieldChange("passing_score", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="1"
                    value={quizData.time_limit_minutes}
                    onChange={(e) => handleQuizFieldChange("time_limit_minutes", parseInt(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={() => setEditingQuiz(false)}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <div><strong>Title:</strong> {quizData.title}</div>
              <div><strong>Description:</strong> {quizData.description}</div>
              <div><strong>Unit:</strong> {units.find(u => u.id === quizData.unit_id)?.title || "Not selected"}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Passing Score:</strong> {quizData.passing_score}%</div>
                <div><strong>Time Limit:</strong> {quizData.time_limit_minutes} minutes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Generated Questions</h3>
          <Badge variant="outline">
            {quizData.questions.filter(q => getQuestionValidation(q).isValid).length} / {quizData.questions.length} valid
          </Badge>
        </div>

        {quizData.questions.map((question, questionIndex) => {
          const validation = getQuestionValidation(question);
          const isEditing = editingQuestion === questionIndex;

          return (
            <Card key={questionIndex} className={`${!validation.isValid ? 'border-orange-200 bg-orange-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Question {questionIndex + 1}</Badge>
                    {question.slide_number && (
                      <Badge variant="secondary">From Slide {question.slide_number}</Badge>
                    )}
                    {validation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingQuestion(isEditing ? null : questionIndex)}
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Show slide content reference */}
                {question.slide_content_used && (
                  <div className="bg-blue-50 p-3 rounded-lg mt-2">
                    <div className="text-sm font-medium text-blue-900 mb-1">Original Slide Content:</div>
                    <div className="text-sm text-blue-800">{question.slide_content_used}</div>
                  </div>
                )}

                {!validation.isValid && (
                  <div className="bg-orange-100 p-2 rounded text-sm text-orange-800">
                    Issues: {validation.issues.join(", ")}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(questionIndex, "question_text", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer Options</Label>
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Switch
                            checked={option.is_correct}
                            onCheckedChange={() => handleOptionCorrectChange(questionIndex, optionIndex)}
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, "text", e.target.value)}
                            className={option.is_correct ? "border-green-500 bg-green-50" : ""}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="font-medium">{question.question_text}</div>
                    <div className="space-y-1">
                      {question.options?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded ${
                            option.is_correct 
                              ? "bg-green-100 border border-green-300 text-green-800" 
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option.text}
                          {option.is_correct && <Badge className="ml-2" variant="default">Correct</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!quizData.unit_id || quizData.questions.filter(q => getQuestionValidation(q).isValid).length === 0}
        >
          Create Quiz ({quizData.questions.filter(q => getQuestionValidation(q).isValid).length} questions)
        </Button>
      </div>
    </div>
  );
};

export default ImportedQuizPreview;
