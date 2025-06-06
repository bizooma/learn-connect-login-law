
import { useState } from "react";
import SimpleLessonManagerHeader from "./lesson-manager/SimpleLessonManagerHeader";
import SimpleLessonCard from "./lesson-manager/SimpleLessonCard";
import EmptyState from "./lesson-manager/EmptyState";
import { useLessonManager } from "./lesson-manager/useLessonManager";
import { SectionData } from "./lesson-manager/types";

interface SimpleLessonManagerProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

const SimpleLessonManager = ({ lessons, onLessonsChange }: SimpleLessonManagerProps) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
  
  const {
    addLesson,
    updateLesson,
    deleteLesson,
    addUnit,
    updateUnit,
    deleteUnit,
    handleVideoFileChange,
    handleLessonImageUpdate,
    handleLessonVideoFileChange,
    moveLessonToPosition,
    moveUnitWithinLesson,
    moveUnitToLesson,
  } = useLessonManager({ lessons, onLessonsChange });

  const handleAddLesson = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addLesson();
  };

  const handleAddUnitToAnyLesson = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lessons.length === 0) {
      addLesson();
      setTimeout(() => {
        addUnit(0);
      }, 100);
    } else {
      addUnit(0);
    }
  };

  const handleAddModule = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newModule: SectionData = {
      title: `Module ${lessons.length + 1}`,
      description: '',
      image_url: '',
      sort_order: lessons.length,
      units: []
    };
    
    onLessonsChange([...lessons, newModule]);
  };

  const handleMoveLessonUp = (lessonIndex: number) => {
    if (lessonIndex > 0) {
      moveLessonToPosition(lessonIndex, lessonIndex - 1);
    }
  };

  const handleMoveLessonDown = (lessonIndex: number) => {
    if (lessonIndex < lessons.length - 1) {
      moveLessonToPosition(lessonIndex, lessonIndex + 1);
    }
  };

  const handleMoveUnitUp = (lessonIndex: number, unitIndex: number) => {
    if (unitIndex > 0) {
      moveUnitWithinLesson(lessonIndex, unitIndex, unitIndex - 1);
    }
  };

  const handleMoveUnitDown = (lessonIndex: number, unitIndex: number) => {
    const lesson = lessons[lessonIndex];
    if (unitIndex < lesson.units.length - 1) {
      moveUnitWithinLesson(lessonIndex, unitIndex, unitIndex + 1);
    }
  };

  const toggleExpanded = (lessonIndex: number) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonIndex)) {
        newSet.delete(lessonIndex);
      } else {
        newSet.add(lessonIndex);
      }
      return newSet;
    });
  };

  const handleAddUnitToLesson = (lessonIndex: number) => {
    console.log('SimpleLessonManager: Adding unit to lesson:', lessonIndex);
    addUnit(lessonIndex);
  };

  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <SimpleLessonManagerHeader
          onAddLesson={handleAddLesson}
          onAddUnit={handleAddUnitToAnyLesson}
          onAddModule={handleAddModule}
        />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimpleLessonManagerHeader
        onAddLesson={handleAddLesson}
        onAddUnit={handleAddUnitToAnyLesson}
        onAddModule={handleAddModule}
      />
      
      <div className="space-y-4">
        {lessons.map((lesson, lessonIndex) => (
          <SimpleLessonCard
            key={lessonIndex}
            lesson={lesson}
            lessonIndex={lessonIndex}
            isExpanded={expandedLessons.has(lessonIndex)}
            onToggleExpanded={toggleExpanded}
            onUpdateLesson={updateLesson}
            onDeleteLesson={deleteLesson}
            onAddUnit={handleAddUnitToLesson}
            onUpdateUnit={updateUnit}
            onDeleteUnit={deleteUnit}
            onVideoFileChange={handleVideoFileChange}
            onLessonImageUpdate={handleLessonImageUpdate}
            onLessonVideoFileChange={handleLessonVideoFileChange}
            onMoveLessonUp={() => handleMoveLessonUp(lessonIndex)}
            onMoveLessonDown={() => handleMoveLessonDown(lessonIndex)}
            onMoveUnitUp={handleMoveUnitUp}
            onMoveUnitDown={handleMoveUnitDown}
            onMoveUnitToLesson={moveUnitToLesson}
            canMoveLessonUp={lessonIndex > 0}
            canMoveLessonDown={lessonIndex < lessons.length - 1}
            totalLessons={lessons.length}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleLessonManager;
