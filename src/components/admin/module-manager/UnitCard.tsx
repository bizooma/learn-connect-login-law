
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import MultipleFileUpload from "@/components/admin/MultipleFileUpload";

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
  files?: Array<{ url: string; name: string; size: number }>;
  _lastFilesUpdate?: number;
}

interface UnitCardProps {
  unit: UnitData;
  moduleIndex: number;
  lessonIndex: number;
  unitIndex: number;
  onUpdateUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (moduleIndex: number, lessonIndex: number, unitIndex: number) => void;
  onVideoFileChange: (moduleIndex: number, lessonIndex: number, unitIndex: number, file: File | null) => void;
  canMoveUnitUp: boolean;
  canMoveUnitDown: boolean;
  onMoveUnitUp: () => void;
  onMoveUnitDown: () => void;
}

const UnitCard = ({
  unit,
  moduleIndex,
  lessonIndex,
  unitIndex,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  canMoveUnitUp,
  canMoveUnitDown,
  onMoveUnitUp,
  onMoveUnitDown,
}: UnitCardProps) => {
  console.log('UnitCard render:', { unit: unit.title, files: unit.files, unitIndex });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onVideoFileChange(moduleIndex, lessonIndex, unitIndex, file);
  };

  const handleFilesUpdate = (files: Array<{ url: string; name: string; size: number }>) => {
    console.log('UnitCard: Updating files for unit', unit.title, 'with:', files);
    onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'files', files);
    
    // Force re-render by updating timestamp
    onUpdateUnit(moduleIndex, lessonIndex, unitIndex, '_lastFilesUpdate', Date.now());
  };

  // Ensure files is always an array
  const currentFiles = Array.isArray(unit.files) ? unit.files : [];
  console.log('UnitCard: Current files for display:', currentFiles);

  return (
    <Card className="border border-yellow-200 ml-4">
      <CardHeader className="bg-yellow-50 py-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Input
              value={unit.title}
              onChange={(e) => onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'title', e.target.value)}
              placeholder="Unit title"
              className="font-medium"
            />
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <div className="flex flex-col space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveUnitUp}
                disabled={!canMoveUnitUp}
                className="p-1"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMoveUnitDown}
                disabled={!canMoveUnitDown}
                className="p-1"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteUnit(moduleIndex, lessonIndex, unitIndex)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <Textarea
          value={unit.description}
          onChange={(e) => onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'description', e.target.value)}
          placeholder="Unit description"
          rows={2}
        />
        
        <Textarea
          value={unit.content}
          onChange={(e) => onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'content', e.target.value)}
          placeholder="Unit content"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Video Type</label>
            <Select
              value={unit.video_type}
              onValueChange={(value: 'youtube' | 'upload') => 
                onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'video_type', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube URL</SelectItem>
                <SelectItem value="upload">Upload File</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input
              type="number"
              value={unit.duration_minutes}
              onChange={(e) => onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        {unit.video_type === 'youtube' ? (
          <div>
            <label className="block text-sm font-medium mb-1">YouTube URL</label>
            <Input
              value={unit.video_url}
              onChange={(e) => onUpdateUnit(moduleIndex, lessonIndex, unitIndex, 'video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Video File</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id={`video-upload-${moduleIndex}-${lessonIndex}-${unitIndex}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`video-upload-${moduleIndex}-${lessonIndex}-${unitIndex}`)?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Video File
              </Button>
              {unit.video_file && (
                <span className="text-sm text-gray-600">{unit.video_file.name}</span>
              )}
            </div>
          </div>
        )}

        <MultipleFileUpload
          key={`unit-${moduleIndex}-${lessonIndex}-${unitIndex}-files-${unit._lastFilesUpdate || 0}`}
          currentFiles={currentFiles}
          onFilesUpdate={handleFilesUpdate}
          label="Unit Download Files"
          contentType="unit"
          contentIndex={unitIndex}
        />

        {/* Debug info to verify files are being tracked */}
        {currentFiles.length > 0 && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {currentFiles.length} files tracked: {currentFiles.map(f => f.name).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnitCard;
