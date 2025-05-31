
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Section = Tables<'sections'> & {
  units: Tables<'units'>[];
};

interface CourseSidebarProps {
  sections: Section[];
}

const CourseSidebar = ({ sections }: CourseSidebarProps) => {
  const navigate = useNavigate();

  const handleSectionClick = (sectionId: string) => {
    navigate(`/section/${sectionId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <div className="text-sm text-gray-500">
          {sections.length} sections
        </div>
      </div>
      
      <div className="space-y-3">
        {sections.map((section, index) => {
          const totalMinutes = section.units.reduce((acc, unit) => acc + (unit.duration_minutes || 0), 0);
          
          return (
            <Card 
              key={section.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSectionClick(section.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium line-clamp-2 pr-2">
                    {index + 1}. {section.title}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {section.units.length} units
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {section.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {totalMinutes} minutes
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    0 students
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {sections.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No sections available</p>
        </div>
      )}
    </div>
  );
};

export default CourseSidebar;
