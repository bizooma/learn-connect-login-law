
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UserTypeRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
}

const UserTypeRadioGroup = ({ value, onChange }: UserTypeRadioGroupProps) => {
  return (
    <div className="space-y-3">
      <Label>Which best describes you:</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="law-firm-employee" id="law-firm-employee" />
          <Label htmlFor="law-firm-employee" className="text-sm font-normal">
            Law Firm Employee - want to register for courses
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="law-firm-owner" id="law-firm-owner" />
          <Label htmlFor="law-firm-owner" className="text-sm font-normal">
            Law Firm Owner - want to register myself or my team for courses
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="client" id="client" />
          <Label htmlFor="client" className="text-sm font-normal">
            Client of New Frontier Immigration Law
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="free-resources" id="free-resources" />
          <Label htmlFor="free-resources" className="text-sm font-normal">
            Only want newsletters, podcasts, and other free resources
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default UserTypeRadioGroup;
