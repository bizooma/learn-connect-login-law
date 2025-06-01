
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
    handleAddLesson,
    handleAddUnit,
    handleUpdateLesson,
    handleDeleteLesson,
    handleAddUnitToAnyLesson,
    handleUpdateUnit,
    handleDeleteUnit,
    handleVideoFileChange,
    handleLessonImageUpdate,
    handleMoveLessonUp,
    handleMoveLessonDown,
    handleMoveUnitUp,
    handleMoveUnitDown,
    handleMoveUnitToLesson,
  } = useLessonManager(lessons, onLessonsChange);

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

  if (lessons.length === 0) {
    return (
      <div className="space-y-6">
        <SimpleLessonManagerHeader
          onAddLesson={handleAddLesson}
          onAddUnit={handleAddUnitToAnyLesson}
          onAddModule={handleAddModule}
        />
        <EmptyState onAddLesson={handleAddLesson} />
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
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            onAddUnit={(lessonIndex) => handleAddUnit(lessonIndex)}
            onUpdateUnit={handleUpdateUnit}
            onDeleteUnit={handleDeleteUnit}
            onVideoFileChange={handleVideoFileChange}
            onLessonImageUpdate={handleLessonImageUpdate}
            onMoveLessonUp={() => handleMoveLessonUp(lessonIndex)}
            onMoveLessonDown={() => handleMoveLessonDown(lessonIndex)}
            onMoveUnitUp={handleMoveUnitUp}
            onMoveUnitDown={handleMoveUnitDown}
            onMoveUnitToLesson={handleMoveUnitToLesson}
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
