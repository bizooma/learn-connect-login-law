
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Play, FileText, Clock } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface SectionWithUnits extends Section {
  units: Unit[];
}

interface CourseSidebarProps {
  sections: SectionWithUnits[];
  selectedUnit: Unit | null;
  onUnitSelect: (unit: Unit) => void;
}

const CourseSidebar = ({ sections, selectedUnit, onUnitSelect }: CourseSidebarProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  const getTotalDuration = () => {
    return sections.reduce((total, section) => 
      total + section.units.reduce((sectionTotal, unit) => 
        sectionTotal + (unit.duration_minutes || 0), 0
      ), 0
    );
  };

  const getTotalUnits = () => {
    return sections.reduce((total, section) => total + section.units.length, 0);
  };

  return (
    <div className="space-y-4">
      {/* Course Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Course Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{sections.length} sections</span>
            <span className="text-gray-600">{getTotalUnits()} units</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            {getTotalDuration()} minutes total
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-1">
            {sections.map((section, sectionIndex) => (
              <Collapsible
                key={section.id}
                open={openSections.has(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {sectionIndex + 1}. {section.title}
                      </div>
                      {section.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {section.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {section.units.length} units
                      </div>
                    </div>
                    {openSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-4">
                    {section.units.map((unit, unitIndex) => (
                      <Button
                        key={unit.id}
                        variant="ghost"
                        className={`w-full justify-start p-3 h-auto text-left hover:bg-gray-50 ${
                          selectedUnit?.id === unit.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => onUnitSelect(unit)}
                      >
                        <div className="flex items-start space-x-3 w-full">
                          <div className="flex-shrink-0 mt-1">
                            {unit.video_url ? (
                              <Play className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">
                              {unitIndex + 1}. {unit.title}
                            </div>
                            {unit.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {unit.description}
                              </div>
                            )}
                            <div className="flex items-center mt-1 space-x-2">
                              {unit.duration_minutes && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {unit.duration_minutes}m
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseSidebar;
