
import { Button } from "@/components/ui/button";
import { ExternalLink, Video } from "lucide-react";
import { detectMeetingPlatform, formatMeetingPlatform } from "@/utils/meetingUtils";

interface MeetingLinkProps {
  url: string;
  className?: string;
}

const MeetingLink = ({ url, className = "" }: MeetingLinkProps) => {
  if (!url) return null;

  const meetingInfo = detectMeetingPlatform(url);
  if (!meetingInfo) return null;

  const IconComponent = meetingInfo.icon === 'Video' ? Video : ExternalLink;

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-8 ${className}`}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
    >
      <IconComponent className="h-3 w-3 mr-2" />
      Join {formatMeetingPlatform(meetingInfo.platform)}
    </Button>
  );
};

export default MeetingLink;
