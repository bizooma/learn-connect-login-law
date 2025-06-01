
import { BookOpen } from "lucide-react";

const EmptyCoursesState = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first course.
        </p>
      </div>
    </div>
  );
};

export default EmptyCoursesState;
