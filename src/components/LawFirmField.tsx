
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

interface LawFirmFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LawFirmField = ({ value, onChange }: LawFirmFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="lawFirmName">Law Firm Name <span className="text-gray-500">(Optional)</span></Label>
      <div className="relative">
        <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id="lawFirmName"
          name="lawFirmName"
          type="text"
          placeholder="Smith & Associates Law Firm"
          value={value}
          onChange={onChange}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default LawFirmField;
