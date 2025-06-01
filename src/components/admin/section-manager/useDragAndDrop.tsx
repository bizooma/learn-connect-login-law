
import { useState } from 'react';
import {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { SectionData } from './types';

interface UseDragAndDropProps {
  sections: SectionData[];
  moveSectionToPosition: (fromIndex: number, toIndex: number) => void;
  moveUnitToPosition: (fromSectionIndex: number, fromUnitIndex: number, toSectionIndex: number, toUnitIndex: number) => void;
  moveUnitWithinSection: (sectionIndex: number, fromIndex: number, toIndex: number) => void;
}

export const useDragAndDrop = ({
  sections,
  moveSectionToPosition,
  moveUnitToPosition,
  moveUnitWithinSection,
}: UseDragAndDropProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

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

  return {
    activeId,
    activeItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
