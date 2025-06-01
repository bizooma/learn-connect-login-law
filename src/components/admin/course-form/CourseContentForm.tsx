
import LessonManager from "../LessonManager";

interface SectionData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
}

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
}

interface CourseContentFormProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

const CourseContentForm = ({ lessons, onLessonsChange }: CourseContentFormProps) => {
  return (
    <div className="space-y-4">
      <LessonManager
        lessons={lessons}
        onLessonsChange={onLessonsChange}
      />
    </div>
  );
};

export default CourseContentForm;
