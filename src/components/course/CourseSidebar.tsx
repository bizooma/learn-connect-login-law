
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Play, ChevronDown, ChevronRight } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";

type Section = Tables<'sections'> & {
  units: Tables<'units'>[];
};

type Unit = Tables<'units'>;

interface CourseSidebarProps {
  sections: Section[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit) => void;
}

const CourseSidebar = ({ sections, selectedUnit, onUnitSelect }: CourseSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mt-1 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mt-1 shrink-0" />
                    )}
                    <CardTitle className="text-sm font-medium line-clamp-2 pr-2">
                      {index + 1}. {section.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {section.units.length} units
                  </Badge>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {totalMinutes} minutes
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      0 students
                    </div>
                  </div>
                  
                  {/* Units List */}
                  <div className="space-y-1">
                    {section.units.map((unit, unitIndex) => (
                      <button
                        key={unit.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnitSelect(unit);
                        }}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors border-l-2 ${
                          selectedUnit?.id === unit.id
                            ? 'border-l-blue-500 bg-blue-50'
                            : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Play className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium">
                              {unitIndex + 1}. {unit.title}
                            </span>
                          </div>
                          {unit.duration_minutes && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {unit.duration_minutes}m
                            </Badge>
                          )}
                        </div>
                        {unit.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate ml-5">
                            {unit.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
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
