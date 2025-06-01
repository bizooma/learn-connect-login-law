
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import SectionImageUpload from "../SectionImageUpload";
import SimpleUnitManager from "./SimpleUnitManager";
import { UnitData, SectionData } from "./types";

interface SimpleSectionCardProps {
  section: SectionData;
  sectionIndex: number;
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
  onUpdateSection: (index: number, field: keyof SectionData, value: any) => void;
  onDeleteSection: (index: number) => void;
  onAddUnit: (sectionIndex: number) => void;
  onUpdateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (sectionIndex: number, unitIndex: number) => void;
  onVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
  onSectionImageUpdate: (sectionIndex: number, imageUrl: string | null) => void;
  onMoveSectionUp: () => void;
  onMoveSectionDown: () => void;
  onMoveUnitUp: (sectionIndex: number, unitIndex: number) => void;
  onMoveUnitDown: (sectionIndex: number, unitIndex: number) => void;
  onMoveUnitToSection: (fromSectionIndex: number, unitIndex: number, toSectionIndex: number) => void;
  canMoveSectionUp: boolean;
  canMoveSectionDown: boolean;
  totalSections: number;
}

const SimpleSectionCard = ({
  section,
  sectionIndex,
  isExpanded,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onVideoFileChange,
  onSectionImageUpdate,
  onMoveSectionUp,
  onMoveSectionDown,
  onMoveUnitUp,
  onMoveUnitDown,
  onMoveUnitToSection,
  canMoveSectionUp,
  canMoveSectionDown,
  totalSections,
}: SimpleSectionCardProps) => {
  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleExpanded(sectionIndex);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveSectionUp}
                disabled={!canMoveSectionUp}
                className="h-6 w-6 p-0"
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveSectionDown}
                disabled={!canMoveSectionDown}
                className="h-6 w-6 p-0"
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <CardTitle className="text-base">
              Section {sectionIndex + 1}
            </CardTitle>
            <Badge variant="secondary">
              {section.units.length} units
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="flex items-center space-x-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Expand</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteSection(sectionIndex)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`section-title-${sectionIndex}`}>Section Title</Label>
            <Input
              id={`section-title-${sectionIndex}`}
              value={section.title}
              onChange={(e) => onUpdateSection(sectionIndex, 'title', e.target.value)}
              placeholder="Enter section title"
            />
          </div>
          <div>
            <Label htmlFor={`section-description-${sectionIndex}`}>Description</Label>
            <Input
              id={`section-description-${sectionIndex}`}
              value={section.description}
              onChange={(e) => onUpdateSection(sectionIndex, 'description', e.target.value)}
              placeholder="Enter section description"
            />
          </div>
        </div>

        <SectionImageUpload
          currentImageUrl={section.image_url}
          onImageUpdate={(imageUrl) => onSectionImageUpdate(sectionIndex, imageUrl)}
          sectionIndex={sectionIndex}
        />

        {isExpanded && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Units</h4>
              <Button
                onClick={() => onAddUnit(sectionIndex)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>

            <div className="space-y-3">
              {section.units.map((unit, unitIndex) => (
                <SimpleUnitManager
                  key={unitIndex}
                  unit={unit}
                  unitIndex={unitIndex}
                  sectionIndex={sectionIndex}
                  totalSections={totalSections}
                  onUpdateUnit={onUpdateUnit}
                  onDeleteUnit={onDeleteUnit}
                  onVideoFileChange={onVideoFileChange}
                  onMoveUnitUp={() => onMoveUnitUp(sectionIndex, unitIndex)}
                  onMoveUnitDown={() => onMoveUnitDown(sectionIndex, unitIndex)}
                  onMoveUnitToSection={(toSectionIndex) => onMoveUnitToSection(sectionIndex, unitIndex, toSectionIndex)}
                  canMoveUnitUp={unitIndex > 0}
                  canMoveUnitDown={unitIndex < section.units.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleSectionCard;
