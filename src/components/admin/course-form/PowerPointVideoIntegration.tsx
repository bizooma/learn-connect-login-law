
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, Presentation } from 'lucide-react';
import PowerPointVideoGenerator from '../PowerPointVideoGenerator';

interface PowerPointVideoIntegrationProps {
  onVideoGenerated: (videoUrl: string) => void;
}

const PowerPointVideoIntegration = ({ onVideoGenerated }: PowerPointVideoIntegrationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleVideoGenerated = (videoUrl: string) => {
    onVideoGenerated(videoUrl);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Presentation className="h-4 w-4 mr-2" />
          Generate from PowerPoint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Generate Video from PowerPoint
          </DialogTitle>
          <DialogDescription>
            Upload a PowerPoint presentation to automatically generate an AI avatar video for this unit.
          </DialogDescription>
        </DialogHeader>
        <PowerPointVideoGenerator onVideoGenerated={handleVideoGenerated} />
      </DialogContent>
    </Dialog>
  );
};

export default PowerPointVideoIntegration;
