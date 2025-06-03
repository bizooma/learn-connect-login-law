
export const getActivityBadge = (activityType: string) => {
  const colors = {
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-800',
    course_access: 'bg-blue-100 text-blue-800',
    unit_access: 'bg-purple-100 text-purple-800',
    unit_complete: 'bg-emerald-100 text-emerald-800',
    quiz_start: 'bg-orange-100 text-orange-800',
    quiz_complete: 'bg-yellow-100 text-yellow-800',
    video_play: 'bg-pink-100 text-pink-800',
    video_pause: 'bg-indigo-100 text-indigo-800',
    video_complete: 'bg-teal-100 text-teal-800',
    page_view: 'bg-slate-100 text-slate-800'
  };

  return colors[activityType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
