
import React, { useState } from 'react';
import { Upload, Video, FileText, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PowerPointVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const PowerPointVideoGenerator = ({ onVideoGenerated }: PowerPointVideoGeneratorProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'generating_script' | 'script_ready' | 'generating_video' | 'completed' | 'error'>('idle');
  const [script, setScript] = useState<string>('');
  const [editedScript, setEditedScript] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const heygenAvatars = [
    { id: 'josh_lite3_20230714', name: 'Josh - Professional Male' },
    { id: 'susan_lite3_20230714', name: 'Susan - Professional Female' },
    { id: 'tyler_lite3_20230714', name: 'Tyler - Casual Male' },
    { id: 'monica_lite3_20230714', name: 'Monica - Casual Female' },
  ];

  const heygenVoices = [
    { id: '2d5b0e6cf36f460aa7fc47e3eee4ba54', name: 'Professional Male Voice' },
    { id: '47d7046c4bfe4d7f864b0d2e3d3b2a85', name: 'Professional Female Voice' },
    { id: '8b5e3f2a9c4e4d1f8e7b9a6c5d4e3f2a', name: 'Friendly Male Voice' },
    { id: '9c6f4e3a8b5d4c2f9e8a7b6c5d4e3f2b', name: 'Friendly Female Voice' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pptx') && !selectedFile.name.toLowerCase().endsWith('.ppt')) {
      toast.error('Please select a PowerPoint file (.ppt or .pptx)');
      return;
    }

    setFile(selectedFile);
    setStatus('uploading');
    setProgress(10);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('powerpoint-uploads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      setProgress(30);

      // Create import record with user_id
      const { data: importRecord, error: insertError } = await supabase
        .from('powerpoint_video_imports')
        .insert({
          filename: selectedFile.name,
          file_url: fileName,
          status: 'uploaded',
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setImportId(importRecord.id);
      setProgress(50);
      setStatus('generating_script');

      // Generate script
      await generateScript(importRecord.id);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const generateScript = async (recordId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-heygen-video', {
        body: { 
          importId: recordId,
          action: 'generate_script'
        }
      });

      if (error) throw error;

      setScript(data.script);
      setEditedScript(data.script);
      setStatus('script_ready');
      setProgress(70);
      toast.success('Script generated successfully! Review and edit if needed.');

    } catch (error) {
      console.error('Script generation error:', error);
      toast.error('Failed to generate script');
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const generateVideo = async () => {
    if (!avatarId || !voiceId) {
      toast.error('Please select an avatar and voice');
      return;
    }

    setStatus('generating_video');
    setProgress(80);

    try {
      // Update script if edited
      if (editedScript !== script) {
        await supabase
          .from('powerpoint_video_imports')
          .update({ script_content: editedScript })
          .eq('id', importId);
      }

      const { data, error } = await supabase.functions.invoke('generate-heygen-video', {
        body: { 
          importId,
          action: 'generate_video',
          avatarId,
          voiceId
        }
      });

      if (error) throw error;

      setStatus('completed');
      setProgress(100);
      toast.success('Video generated successfully!');
      
      if (onVideoGenerated) {
        onVideoGenerated(data.videoUrl);
      }

    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Failed to generate video');
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const resetGenerator = () => {
    setFile(null);
    setImportId(null);
    setStatus('idle');
    setScript('');
    setEditedScript('');
    setAvatarId('');
    setVoiceId('');
    setProgress(0);
    setErrorMessage('');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          PowerPoint to Video Generator
        </CardTitle>
        <CardDescription>
          Upload a PowerPoint presentation to generate an AI avatar narration video
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === 'idle' && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload PowerPoint File</p>
              <p className="text-sm text-gray-500">Select a .ppt or .pptx file to generate video content</p>
            </div>
            <input
              type="file"
              accept=".ppt,.pptx"
              onChange={handleFileUpload}
              className="mt-4"
            />
          </div>
        )}

        {(status === 'uploading' || status === 'generating_script') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Processing PowerPoint: {file?.name}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              {status === 'uploading' ? 'Uploading file...' : 'Generating narration script...'}
            </p>
          </div>
        )}

        {status === 'script_ready' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Generated Script</label>
              <p className="text-xs text-gray-500">Review and edit the script before generating the video</p>
              <Textarea
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Avatar</label>
                <Select value={avatarId} onValueChange={setAvatarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    {heygenAvatars.map((avatar) => (
                      <SelectItem key={avatar.id} value={avatar.id}>
                        {avatar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Voice</label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {heygenVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={generateVideo} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Generate Video
            </Button>
          </div>
        )}

        {status === 'generating_video' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 animate-spin" />
              <span>Generating video with HeyGen...</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              This may take several minutes. Please don't close this window.
            </p>
          </div>
        )}

        {status === 'completed' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Video className="h-5 w-5" />
              <span className="font-medium">Video generated successfully!</span>
            </div>
            <Button onClick={resetGenerator} variant="outline">
              Generate Another Video
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <p className="font-medium">Error occurred</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
            <Button onClick={resetGenerator} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PowerPointVideoGenerator;
