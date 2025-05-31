
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus } from "lucide-react";
import SectionImageUpload from "../SectionImageUpload";
import DraggableUnitManager from "./DraggableUnitManager";
import { UnitData, SectionData } from "./types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
  dragHandleProps?: any;
  isDragging?: boolean;
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
  dragHandleProps,
  isDragging,
}: SectionCardProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUnitDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === 'unit' && overData?.type === 'unit') {
      const activeUnit = activeData.unitIndex;
      const overUnit = overData.unitIndex;
      
      if (activeUnit !== overUnit) {
        // Move unit within this section
        const newUnits = [...section.units];
        const [movedUnit] = newUnits.splice(activeUnit, 1);
        newUnits.splice(overUnit, 0, movedUnit);
        
        // Update sort orders and trigger the update
        const reorderedUnits = newUnits.map((unit, index) => ({
          ...unit,
          sort_order: index
        }));
        
        onUpdateSection(sectionIndex, 'units', reorderedUnits);
      }
    }
  };

  const unitIds = section.units.map((_, index) => `unit-${sectionIndex}-${index}`);

  return (
    <Card className={`w-full ${isDragging ? 'shadow-lg' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleUnitDragEnd}
            >
              <SortableContext items={unitIds} strategy={verticalListSortingStrategy}>
                {section.units.map((unit, unitIndex) => (
                  <DraggableUnitManager
                    key={unitIndex}
                    unit={unit}
                    unitIndex={unitIndex}
                    sectionIndex={sectionIndex}
                    onUpdateUnit={onUpdateUnit}
                    onDeleteUnit={onDeleteUnit}
                    onVideoFileChange={onVideoFileChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionCard;
