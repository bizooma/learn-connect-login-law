
import ModuleManager from "../ModuleManager";

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
}

interface LessonData {
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
  quiz_id?: string;
}

interface CourseContentFormProps {
  modules: ModuleData[];
  onModulesChange: (modules: ModuleData[]) => void;
}

const CourseContentForm = ({ modules, onModulesChange }: CourseContentFormProps) => {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <p className="text-sm text-gray-600 mt-1">
          Structure: Modules → Lessons → Units. Modules group related lessons together.
        </p>
      </div>
      
      <ModuleManager
        modules={modules}
        onModulesChange={onModulesChange}
      />
    </div>
  );
};

export default CourseContentForm;
