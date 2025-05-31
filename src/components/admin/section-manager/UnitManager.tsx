
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Play, Upload, GripVertical } from "lucide-react";
import { UnitData } from "./types";

interface UnitManagerProps {
  unit: UnitData;
  unitIndex: number;
  sectionIndex: number;
  onUpdateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (sectionIndex: number, unitIndex: number) => void;
  onVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
  dragHandleProps?: any;
  isDragging?: boolean;
}

const UnitManager = ({ 
  unit, 
  unitIndex, 
  sectionIndex, 
  onUpdateUnit, 
  onDeleteUnit, 
  onVideoFileChange,
  dragHandleProps,
  isDragging,
}: UnitManagerProps) => {
  return (
    <Card className={`border-l-4 border-l-blue-200 ${isDragging ? 'shadow-lg' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>
            <h5 className="font-medium">Unit {unitIndex + 1}</h5>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteUnit(sectionIndex, unitIndex)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor={`unit-title-${sectionIndex}-${unitIndex}`}>Unit Title</Label>
            <Input
              id={`unit-title-${sectionIndex}-${unitIndex}`}
              value={unit.title}
              onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'title', e.target.value)}
              placeholder="Enter unit title"
            />
          </div>
          <div>
            <Label htmlFor={`unit-duration-${sectionIndex}-${unitIndex}`}>Duration (minutes)</Label>
            <Input
              id={`unit-duration-${sectionIndex}-${unitIndex}`}
              type="number"
              value={unit.duration_minutes}
              onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor={`unit-description-${sectionIndex}-${unitIndex}`}>Description</Label>
          <Textarea
            id={`unit-description-${sectionIndex}-${unitIndex}`}
            value={unit.description}
            onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'description', e.target.value)}
            placeholder="Enter unit description"
            rows={2}
          />
        </div>

        <Tabs defaultValue="video" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">Video Content</TabsTrigger>
            <TabsTrigger value="content">Text Content</TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-4">
            <div>
              <Label>Video Type</Label>
              <Select
                value={unit.video_type}
                onValueChange={(value: 'youtube' | 'upload') => 
                  onUpdateUnit(sectionIndex, unitIndex, 'video_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select video type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-2" />
                      YouTube URL
                    </div>
                  </SelectItem>
                  <SelectItem value="upload">
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Video File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {unit.video_type === 'youtube' ? (
              <div>
                <Label htmlFor={`unit-video-url-${sectionIndex}-${unitIndex}`}>YouTube URL</Label>
                <Input
                  id={`unit-video-url-${sectionIndex}-${unitIndex}`}
                  value={unit.video_url}
                  onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'video_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div>
                <Label htmlFor={`unit-video-file-${sectionIndex}-${unitIndex}`}>Upload Video File</Label>
                <Input
                  id={`unit-video-file-${sectionIndex}-${unitIndex}`}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onVideoFileChange(sectionIndex, unitIndex, file);
                  }}
                />
                {unit.video_file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {unit.video_file.name}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="content">
            <div>
              <Label htmlFor={`unit-content-${sectionIndex}-${unitIndex}`}>Content</Label>
              <Textarea
                id={`unit-content-${sectionIndex}-${unitIndex}`}
                value={unit.content}
                onChange={(e) => onUpdateUnit(sectionIndex, unitIndex, 'content', e.target.value)}
                placeholder="Enter unit content"
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UnitManager;
