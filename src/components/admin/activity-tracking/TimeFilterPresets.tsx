
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface TimeFilterPresetsProps {
  onPresetSelect: (startDate: string, endDate?: string) => void;
}

const TimeFilterPresets = ({ onPresetSelect }: TimeFilterPresetsProps) => {
  const getDateString = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const presets = [
    { label: "Last 24 Hours", days: 1 },
    { label: "Last 3 Days", days: 3 },
    { label: "Last Week", days: 7 },
    { label: "Last Month", days: 30 },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Clock className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => onPresetSelect(getDateString(preset.days))}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPresetSelect('', '')}
        className="text-xs"
      >
        All Time
      </Button>
    </div>
  );
};

export default TimeFilterPresets;
