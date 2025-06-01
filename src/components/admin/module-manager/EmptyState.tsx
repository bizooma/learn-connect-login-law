
import { Package, BookOpen, FileText } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex justify-center space-x-4 mb-4">
        <Package className="h-8 w-8 text-gray-400" />
        <BookOpen className="h-8 w-8 text-gray-400" />
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        Start building your course by creating modules. Each module can contain multiple lessons, and each lesson can have multiple units.
      </p>
      <div className="text-sm text-gray-500">
        <div className="flex justify-center items-center space-x-2 mb-2">
          <Package className="h-4 w-4" />
          <span>Modules group related content together</span>
        </div>
        <div className="flex justify-center items-center space-x-2 mb-2">
          <BookOpen className="h-4 w-4" />
          <span>Lessons contain specific topics within a module</span>
        </div>
        <div className="flex justify-center items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Units are individual pieces of content (videos, texts, etc.)</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
