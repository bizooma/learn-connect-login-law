
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Video, Upload, Youtube } from 'lucide-react';
import PowerPointVideoIntegration from './PowerPointVideoIntegration';
import MultipleFileUpload from '../MultipleFileUpload';
import EnhancedQuizSelector from './EnhancedQuizSelector';

interface UnitFormProps {
  unit: any;
  onUnitChange: (field: string, value: any) => void;
  onRemove: () => void;
  unitIndex: number;
}

const UnitForm = ({ unit, onUnitChange, onRemove, unitIndex }: UnitFormProps) => {
  const handleVideoGenerated = (videoUrl: string) => {
    onUnitChange('video_url', videoUrl);
    onUnitChange('video_type', 'upload');
  };

  const handleQuizUpdate = (quizId: string | undefined) => {
    onUnitChange('quiz_id', quizId);
  };

  const handleMultipleFilesUpdate = (files: Array<{ url: string; name: string; size: number }>) => {
    onUnitChange('files', files);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Unit: {unit.title || 'New Unit'}</span>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="unit-title">Title</Label>
          <Input
            id="unit-title"
            value={unit.title}
            onChange={(e) => onUnitChange('title', e.target.value)}
            placeholder="Enter unit title"
          />
        </div>
        
        <div>
          <Label htmlFor="unit-description">Description</Label>
          <Textarea
            id="unit-description"
            value={unit.description}
            onChange={(e) => onUnitChange('description', e.target.value)}
            placeholder="Enter unit description"
          />
        </div>
        
        <div>
          <Label htmlFor="unit-content">Content</Label>
          <Textarea
            id="unit-content"
            value={unit.content}
            onChange={(e) => onUnitChange('content', e.target.value)}
            placeholder="Enter unit content"
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <Label>Video Content</Label>
          
          {/* AI Avatar Video Generation */}
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <Video className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <h3 className="text-lg font-semibold text-blue-700">Generate AI Avatar Video</h3>
              <p className="text-sm text-gray-600">Upload a PowerPoint to create an AI avatar narration video</p>
            </div>
            <PowerPointVideoIntegration onVideoGenerated={handleVideoGenerated} />
          </div>

          {/* Manual Video Upload */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-5 w-5" />
              <Label>Or upload video manually</Label>
            </div>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onUnitChange('video_file', file);
                  onUnitChange('video_type', 'upload');
                }
              }}
            />
          </div>

          {/* YouTube URL */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Youtube className="h-5 w-5 text-red-500" />
              <Label>Or add YouTube URL</Label>
            </div>
            <Input
              value={unit.video_url || ''}
              onChange={(e) => {
                onUnitChange('video_url', e.target.value);
                onUnitChange('video_type', 'youtube');
              }}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {unit.video_url && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700">
                ✓ Video URL set: {unit.video_url.substring(0, 50)}...
              </p>
            </div>
          )}
        </div>

        <MultipleFileUpload
          currentFiles={unit.files || []}
          onFilesUpdate={handleMultipleFilesUpdate}
          label="Unit Download Files"
          contentType="unit"
          contentIndex={unitIndex}
        />

        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={unit.duration_minutes || ''}
            onChange={(e) => onUnitChange('duration_minutes', parseInt(e.target.value) || 0)}
            placeholder="Enter duration in minutes"
          />
        </div>

        {/* Enhanced Quiz Assignment */}
        <div className="space-y-2">
          <Label>Quiz Assignment</Label>
          <EnhancedQuizSelector
            quizId={unit.quiz_id}
            onQuizUpdate={handleQuizUpdate}
            unitTitle={unit.title}
            unitId={unit.id}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitForm;
