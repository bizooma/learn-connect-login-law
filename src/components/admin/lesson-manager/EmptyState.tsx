
import { BookOpen } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first lesson.
      </p>
    </div>
  );
};

export default EmptyState;
