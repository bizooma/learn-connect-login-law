
export const detectMeetingPlatform = (url: string) => {
  if (!url) return null;
  
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('zoom.us')) {
    return { platform: 'zoom', icon: 'Video' };
  } else if (normalizedUrl.includes('teams.microsoft.com') || normalizedUrl.includes('teams.live.com')) {
    return { platform: 'teams', icon: 'Video' };
  } else if (normalizedUrl.includes('meet.google.com')) {
    return { platform: 'google-meet', icon: 'Video' };
  } else {
    return { platform: 'other', icon: 'ExternalLink' };
  }
};

export const validateMeetingUrl = (url: string): boolean => {
  if (!url) return true; // Empty URL is valid (optional field)
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatMeetingPlatform = (platform: string): string => {
  switch (platform) {
    case 'zoom':
      return 'Zoom';
    case 'teams':
      return 'Microsoft Teams';
    case 'google-meet':
      return 'Google Meet';
    default:
      return 'Meeting';
  }
};
