
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { Option } from "./questionFormValidation";

interface QuestionOptionsManagerProps {
  options: Option[];
  onOptionsChange: (options: Option[]) => void;
}

const QuestionOptionsManager = ({ options, onOptionsChange }: QuestionOptionsManagerProps) => {
  const addOption = () => {
    onOptionsChange([...options, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      onOptionsChange(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Answer Options *</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Option
        </Button>
      </div>
      
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2 p-3 border rounded">
          <Checkbox
            checked={option.isCorrect}
            onCheckedChange={(checked) => updateOption(index, 'isCorrect', checked as boolean)}
          />
          <Input
            value={option.text}
            onChange={(e) => updateOption(index, 'text', e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1"
          />
          {options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <p className="text-sm text-gray-600">Check the box to mark correct answers</p>
    </div>
  );
};

export default QuestionOptionsManager;
