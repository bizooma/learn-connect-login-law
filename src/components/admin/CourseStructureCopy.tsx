
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, AlertTriangle } from "lucide-react";
import { copyStructureToAllCourses } from "./course-form/services/courseStructureCopy";
import { logger } from "@/utils/logger";

const CourseStructureCopy = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopyStructure = async () => {
    if (!confirm(
      "This will copy the module-lesson-unit structure from 'Legal Training-100' to all other courses. " +
      "Courses that already have content will be skipped. This action cannot be undone. Continue?"
    )) {
      return;
    }

    setIsProcessing(true);
    try {
      await copyStructureToAllCourses();
    } catch (error) {
      logger.error('Copy failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Copy Course Structure
        </CardTitle>
        <CardDescription>
          Copy the module-lesson-unit structure from "Legal Training-100" to all other courses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This copies the organizational structure (titles and hierarchy)</li>
              <li>Content fields will be empty for you to fill in later</li>
              <li>Each course will have independent, non-shared relationships</li>
              <li>Courses that already have modules will be skipped</li>
              <li>The source course "Legal Training-100" will not be modified</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={handleCopyStructure}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            "Copying Structure..."
          ) : (
            "Copy Structure to All Courses"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseStructureCopy;
