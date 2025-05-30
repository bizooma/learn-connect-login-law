
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Unit = Tables<'units'>;

interface CourseContentProps {
  unit: Unit | null;
}

const CourseContent = ({ unit }: CourseContentProps) => {
  if (!unit) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a unit to view the content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{unit.title}</CardTitle>
          {unit.description && (
            <p className="text-gray-600">{unit.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {unit.content ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {unit.content}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content available for this unit</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseContent;
