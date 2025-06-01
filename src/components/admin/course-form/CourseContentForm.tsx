
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
  const handleAddModule = () => {
    const newModule: SectionData = {
      title: `Module ${lessons.length + 1}`,
      description: '',
      image_url: '',
      sort_order: lessons.length,
      units: []
    };
    
    onLessonsChange([...lessons, newModule]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddModule}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Module
          </button>
        </div>
      </div>
      
      <LessonManager
        lessons={lessons}
        onLessonsChange={onLessonsChange}
      />
    </div>
  );
};

export default CourseContentForm;
