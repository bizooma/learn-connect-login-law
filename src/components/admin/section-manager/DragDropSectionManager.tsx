
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DraggableSectionCard from './DraggableSectionCard';
import EmptyState from './EmptyState';
import SectionManagerHeader from './SectionManagerHeader';
import DragOverlayContent from './DragOverlayContent';
import { useDragAndDrop } from './useDragAndDrop';
import { handleAddVideoUnit, handleAddUnitToFirstSection } from './actionHandlers';
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
  onSectionsChange,
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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    activeId,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop({
    sections,
    moveSectionToPosition,
    moveUnitToPosition,
    moveUnitWithinSection,
  });

  const handleAddSection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addSection();
  };

  const handleAddUnitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddUnitToFirstSection(
      sections,
      addSection,
      addUnit,
      expandedSections,
      toggleSectionExpanded
    );
  };

  const handleAddVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddVideoUnit(
      sections,
      addSection,
      expandedSections,
      toggleSectionExpanded,
      onSectionsChange
    );
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
        <SectionManagerHeader
          onAddSection={handleAddSection}
          onAddUnit={handleAddUnitClick}
          onAddVideo={handleAddVideoClick}
        />

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
        <DragOverlayContent activeId={activeId} activeItem={activeItem} />
      </DragOverlay>
    </DndContext>
  );
};

export default DragDropSectionManager;
