
import { Tables } from "@/integrations/supabase/types";
import CourseVideo from "./CourseVideo";

type Unit = Tables<'units'>;

interface CourseContentProps {
  unit: Unit | null;
  courseId: string;
}

const CourseContent = ({ unit, courseId }: CourseContentProps) => {
  return (
    <div className="space-y-6">
      <CourseVideo unit={unit} courseId={courseId} />
      
      {unit?.content && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Unit Content</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{unit.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContent;
