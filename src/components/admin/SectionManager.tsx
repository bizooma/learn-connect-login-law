
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface SectionData {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  sort_order: number;
}

interface SectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SectionManager = ({ sections, onSectionsChange }: SectionManagerProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const addSection = () => {
    const newSection: SectionData = {
      title: "",
      description: "",
      sort_order: sections.length,
      units: []
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (index: number, field: keyof Omit<SectionData, 'units'>, value: string | number) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    onSectionsChange(updatedSections);
  };

  const removeSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    onSectionsChange(updatedSections);
  };

  const addUnit = (sectionIndex: number) => {
    const newUnit: UnitData = {
      title: "",
      description: "",
      content: "",
      video_url: "",
      duration_minutes: 0,
      sort_order: sections[sectionIndex].units.length
    };
    const updatedSections = [...sections];
    updatedSections[sectionIndex].units.push(newUnit);
    onSectionsChange(updatedSections);
  };

  const updateUnit = (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: string | number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].units[unitIndex] = {
      ...updatedSections[sectionIndex].units[unitIndex],
      [field]: value
    };
    onSectionsChange(updatedSections);
  };

  const removeUnit = (sectionIndex: number, unitIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].units = updatedSections[sectionIndex].units.filter((_, i) => i !== unitIndex);
    onSectionsChange(updatedSections);
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Sections</h3>
        <Button type="button" onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  {expandedSections.has(sectionIndex) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Section title"
                    value={section.title}
                    onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Section description"
                    value={section.description}
                    onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeSection(sectionIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {expandedSections.has(sectionIndex) && (
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Units</h4>
                  <Button
                    type="button"
                    onClick={() => addUnit(sectionIndex)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>

                {section.units.map((unit, unitIndex) => (
                  <Card key={unitIndex} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between space-x-4">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Unit title"
                            value={unit.title}
                            onChange={(e) => updateUnit(sectionIndex, unitIndex, 'title', e.target.value)}
                          />
                          <Textarea
                            placeholder="Unit description"
                            value={unit.description}
                            onChange={(e) => updateUnit(sectionIndex, unitIndex, 'description', e.target.value)}
                            rows={2}
                          />
                          <Textarea
                            placeholder="Unit content"
                            value={unit.content}
                            onChange={(e) => updateUnit(sectionIndex, unitIndex, 'content', e.target.value)}
                            rows={3}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Video URL"
                              value={unit.video_url}
                              onChange={(e) => updateUnit(sectionIndex, unitIndex, 'video_url', e.target.value)}
                            />
                            <Input
                              type="number"
                              placeholder="Duration (minutes)"
                              value={unit.duration_minutes}
                              onChange={(e) => updateUnit(sectionIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeUnit(sectionIndex, unitIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SectionManager;
