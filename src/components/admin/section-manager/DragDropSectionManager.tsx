
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DraggableSectionCard from './DraggableSectionCard';
import EmptyState from './EmptyState';
import { SectionData, UnitData } from './types';

interface DragDropSectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
  expandedSections: Set<number>;
  addSection: () => void;
  updateSection: (index: number, field: keyof SectionData, value: any) => void;
  deleteSection: (index: number) => void;
  addUnit: (sectionIndex: number) => void;
  updateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  deleteUnit: (sectionIndex: number, unitIndex: number) => void;
  toggleSectionExpanded: (index: number) => void;
  handleVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
  handleSectionImageUpdate: (sectionIndex: number, imageUrl: string | null) => void;
  moveSectionToPosition: (fromIndex: number, toIndex: number) => void;
  moveUnitToPosition: (fromSectionIndex: number, fromUnitIndex: number, toSectionIndex: number, toUnitIndex: number) => void;
  moveUnitWithinSection: (sectionIndex: number, fromIndex: number, toIndex: number) => void;
}

const DragDropSectionManager = ({
  sections,
  expandedSections,
  addSection,
  updateSection,
  deleteSection,
  addUnit,
  updateUnit,
  deleteUnit,
  toggleSectionExpanded,
  handleVideoFileChange,
  handleSectionImageUpdate,
  moveSectionToPosition,
  moveUnitToPosition,
  moveUnitWithinSection,
}: DragDropSectionManagerProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === 'section') {
      setActiveItem(sections[active.data.current.index]);
    } else if (active.data.current?.type === 'unit') {
      const { sectionIndex, unitIndex } = active.data.current;
      setActiveItem(sections[sectionIndex]?.units[unitIndex]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Handle unit moving between sections
    if (activeData?.type === 'unit' && overData?.type === 'unit') {
      const activeSection = activeData.sectionIndex;
      const activeUnit = activeData.unitIndex;
      const overSection = overData.sectionIndex;
      const overUnit = overData.unitIndex;
      
      if (activeSection !== overSection) {
        moveUnitToPosition(activeSection, activeUnit, overSection, overUnit);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === 'section' && overData?.type === 'section') {
      const oldIndex = activeData.index;
      const newIndex = overData.index;
      
      if (oldIndex !== newIndex) {
        moveSectionToPosition(oldIndex, newIndex);
      }
    } else if (activeData?.type === 'unit' && overData?.type === 'unit') {
      const activeSection = activeData.sectionIndex;
      const activeUnit = activeData.unitIndex;
      const overSection = overData.sectionIndex;
      const overUnit = overData.unitIndex;
      
      if (activeSection === overSection && activeUnit !== overUnit) {
        moveUnitWithinSection(activeSection, activeUnit, overUnit);
      }
    }
    
    setActiveId(null);
    setActiveItem(null);
  };

  const sectionIds = sections.map((_, index) => `section-${index}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Course Sections</h3>
          <Button onClick={addSection} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>

        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {sections.map((section, sectionIndex) => (
            <DraggableSectionCard
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              isExpanded={expandedSections.has(sectionIndex)}
              onToggleExpanded={toggleSectionExpanded}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
              onAddUnit={addUnit}
              onUpdateUnit={updateUnit}
              onDeleteUnit={deleteUnit}
              onVideoFileChange={handleVideoFileChange}
              onSectionImageUpdate={handleSectionImageUpdate}
            />
          ))}
        </SortableContext>

        {sections.length === 0 && <EmptyState />}
      </div>

      <DragOverlay>
        {activeId && activeItem && (
          <div className="opacity-90 rotate-3 shadow-lg">
            {activeItem.title ? (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium">{activeItem.title}</h4>
                <p className="text-sm text-gray-600">{activeItem.description}</p>
              </div>
            ) : null}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropSectionManager;
