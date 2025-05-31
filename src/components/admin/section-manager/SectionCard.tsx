import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus } from "lucide-react";
import SectionImageUpload from "../SectionImageUpload";
import UnitManager from "./UnitManager";
import { UnitData, SectionData } from "./types";

interface SectionCardProps {
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
}

const SectionCard = ({
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
}: SectionCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
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
              onClick={() => onToggleExpanded(sectionIndex)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
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

            {section.units.map((unit, unitIndex) => (
              <UnitManager
                key={unitIndex}
                unit={unit}
                unitIndex={unitIndex}
                sectionIndex={sectionIndex}
                onUpdateUnit={onUpdateUnit}
                onDeleteUnit={onDeleteUnit}
                onVideoFileChange={onVideoFileChange}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionCard;
