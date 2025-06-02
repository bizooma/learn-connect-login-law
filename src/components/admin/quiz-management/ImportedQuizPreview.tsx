
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Save, X, Check, AlertCircle } from "lucide-react";

interface ImportedQuizData {
  title: string;
  description: string;
  questions: Array<{
    question_text: string;
    slide_number?: number;
    options: Array<{
      text: string;
      is_correct: boolean;
    }>;
  }>;
}

interface ImportedQuizPreviewProps {
  importData: ImportedQuizData;
  onConfirmImport: (finalData: ImportedQuizData & { unit_id: string; passing_score: number; time_limit_minutes?: number }) => void;
  onCancel: () => void;
  units: Array<{ id: string; title: string; lesson: { title: string; course: { title: string } } }>;
}

const ImportedQuizPreview = ({ importData, onConfirmImport, onCancel, units }: ImportedQuizPreviewProps) => {
  const [editData, setEditData] = useState<ImportedQuizData>(importData);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);

  const handleQuestionEdit = (index: number, field: string, value: any) => {
    const newQuestions = [...editData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setEditData({ ...editData, questions: newQuestions });
  };

  const handleOptionEdit = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const newQuestions = [...editData.questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    
    // If marking as correct, unmark others
    if (field === 'is_correct' && value === true) {
      newOptions.forEach((opt, idx) => {
        if (idx !== optionIndex) opt.is_correct = false;
      });
    }
    
    newQuestions[questionIndex].options = newOptions;
    setEditData({ ...editData, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = editData.questions.filter((_, i) => i !== index);
    setEditData({ ...editData, questions: newQuestions });
  };

  const handleConfirm = () => {
    if (!selectedUnitId) return;
    
    onConfirmImport({
      ...editData,
      unit_id: selectedUnitId,
      passing_score: passingScore,
      time_limit_minutes: timeLimit
    });
  };

  const hasValidQuestions = editData.questions.length > 0 && 
    editData.questions.every(q => 
      q.question_text.trim() && 
      q.options.length === 4 && 
      q.options.some(opt => opt.is_correct) &&
      q.options.every(opt => opt.text.trim())
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Imported Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiz-title">Quiz Title</Label>
              <Input
                id="quiz-title"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="passing-score">Passing Score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min="1"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="quiz-description">Description</Label>
            <Textarea
              id="quiz-description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit-select">Assign to Unit</Label>
              <select
                id="unit-select"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a unit...</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.lesson.course.title} → {unit.lesson.title} → {unit.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="time-limit">Time Limit (minutes, optional)</Label>
              <Input
                id="time-limit"
                type="number"
                min="1"
                value={timeLimit || ""}
                onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="No time limit"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Questions ({editData.questions.length})
          </h3>
          {!hasValidQuestions && (
            <Badge variant="destructive" className="flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Issues found
            </Badge>
          )}
        </div>

        {editData.questions.map((question, questionIndex) => {
          const hasCorrectAnswer = question.options.some(opt => opt.is_correct);
          const isEditing = editingQuestion === questionIndex;

          return (
            <Card key={questionIndex}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium">Question {questionIndex + 1}</span>
                      {question.slide_number && (
                        <Badge variant="outline">Slide {question.slide_number}</Badge>
                      )}
                      {!hasCorrectAnswer && (
                        <Badge variant="destructive">No correct answer</Badge>
                      )}
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => handleQuestionEdit(questionIndex, 'question_text', e.target.value)}
                        className="mb-2"
                      />
                    ) : (
                      <p className="font-medium">{question.question_text}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingQuestion(isEditing ? null : questionIndex)}
                    >
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded border-2 ${
                        option.is_correct 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <Input
                              value={option.text}
                              onChange={(e) => handleOptionEdit(questionIndex, optionIndex, 'text', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant={option.is_correct ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleOptionEdit(questionIndex, optionIndex, 'is_correct', !option.is_correct)}
                            >
                              {option.is_correct ? <Check className="h-4 w-4" /> : "Mark Correct"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className={option.is_correct ? 'font-medium' : ''}>
                              {String.fromCharCode(65 + optionIndex)}. {option.text}
                            </span>
                            {option.is_correct && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedUnitId || !hasValidQuestions || !editData.title.trim()}
        >
          Create Quiz ({editData.questions.length} questions)
        </Button>
      </div>
    </div>
  );
};

export default ImportedQuizPreview;
