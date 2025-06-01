
import { useState } from "react";
import { UnitData, SectionData } from "./types";

interface UseLessonManagerProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useLessonManager = ({ lessons, onLessonsChange }: UseLessonManagerProps) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

  const addLesson = () => {
    const newLesson: SectionData = {
      title: "",
      description: "",
      image_url: "",
      sort_order: lessons.length,
      units: []
    };
    onLessonsChange([...lessons, newLesson]);
  };

  const updateLesson = (index: number, field: keyof SectionData, value: any) => {
    const updatedLessons = lessons.map((lesson, i) => 
      i === index ? { ...lesson, [field]: value } : lesson
    );
    onLessonsChange(updatedLessons);
  };

  const deleteLesson = (index: number) => {
    const updatedLessons = lessons.filter((_, i) => i !== index);
    // Update sort orders
    const reorderedLessons = updatedLessons.map((lesson, i) => ({
      ...lesson,
      sort_order: i
    }));
    onLessonsChange(reorderedLessons);
  };

  const addUnit = (lessonIndex: number) => {
    console.log('useLessonManager: Adding unit to lesson index:', lessonIndex);
    console.log('Current lessons:', lessons);
    
    if (lessonIndex < 0 || lessonIndex >= lessons.length) {
      console.error('Invalid lesson index:', lessonIndex);
      return;
    }

    const newUnit: UnitData = {
      title: "",
      description: "",
      content: "",
      video_url: "",
      video_type: 'youtube',
      duration_minutes: 0,
      sort_order: lessons[lessonIndex].units.length,
      image_url: ""
    };
    
    const updatedLessons = lessons.map((lesson, i) => 
      i === lessonIndex 
        ? { ...lesson, units: [...lesson.units, newUnit] }
        : lesson
    );
    
    console.log('Updated lessons after adding unit:', updatedLessons);
    onLessonsChange(updatedLessons);
  };

  const updateUnit = (lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => {
    console.log('Updating unit:', lessonIndex, unitIndex, field, value);
    
    const updatedLessons = lessons.map((lesson, i) => 
      i === lessonIndex 
        ? {
            ...lesson,
            units: lesson.units.map((unit, j) => 
              j === unitIndex ? { ...unit, [field]: value } : unit
            )
          }
        : lesson
    );
    
    console.log('Updated lessons:', updatedLessons);
    onLessonsChange(updatedLessons);
  };

  const deleteUnit = (lessonIndex: number, unitIndex: number) => {
    const updatedLessons = lessons.map((lesson, i) => 
      i === lessonIndex 
        ? { 
            ...lesson, 
            units: lesson.units.filter((_, j) => j !== unitIndex)
              .map((unit, index) => ({ ...unit, sort_order: index }))
          }
        : lesson
    );
    onLessonsChange(updatedLessons);
  };

  const toggleLessonExpanded = (index: number) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLessons(newExpanded);
  };

  const handleVideoFileChange = (lessonIndex: number, unitIndex: number, file: File | null) => {
    console.log('Video file changed:', lessonIndex, unitIndex, file?.name);
    
    if (file) {
      // Store the actual file object
      updateUnit(lessonIndex, unitIndex, 'video_file', file);
      
      // Create a temporary URL for preview (will be replaced with actual URL on save)
      const fileUrl = URL.createObjectURL(file);
      updateUnit(lessonIndex, unitIndex, 'video_url', fileUrl);
      
      // Set video type to upload since we're uploading a file
      updateUnit(lessonIndex, unitIndex, 'video_type', 'upload');
    } else {
      // Clear the file and URL if no file is selected
      updateUnit(lessonIndex, unitIndex, 'video_file', undefined);
      updateUnit(lessonIndex, unitIndex, 'video_url', '');
    }
  };

  const handleLessonImageUpdate = (lessonIndex: number, imageUrl: string | null) => {
    updateLesson(lessonIndex, 'image_url', imageUrl || '');
  };

  // Simplified move methods for up/down arrows
  const moveLessonToPosition = (fromIndex: number, toIndex: number) => {
    const newLessons = [...lessons];
    const [movedLesson] = newLessons.splice(fromIndex, 1);
    newLessons.splice(toIndex, 0, movedLesson);
    
    // Update sort orders
    const reorderedLessons = newLessons.map((lesson, index) => ({
      ...lesson,
      sort_order: index
    }));
    
    onLessonsChange(reorderedLessons);
  };

  const moveUnitWithinLesson = (lessonIndex: number, fromIndex: number, toIndex: number) => {
    const newLessons = [...lessons];
    const [movedUnit] = newLessons[lessonIndex].units.splice(fromIndex, 1);
    newLessons[lessonIndex].units.splice(toIndex, 0, movedUnit);
    
    // Update sort orders
    newLessons[lessonIndex].units = newLessons[lessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onLessonsChange(newLessons);
  };

  const moveUnitToLesson = (fromLessonIndex: number, unitIndex: number, toLessonIndex: number) => {
    const newLessons = [...lessons];
    
    // Remove unit from source lesson
    const [movedUnit] = newLessons[fromLessonIndex].units.splice(unitIndex, 1);
    
    // Add unit to target lesson
    newLessons[toLessonIndex].units.push(movedUnit);
    
    // Update sort orders for both lessons
    newLessons[fromLessonIndex].units = newLessons[fromLessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    newLessons[toLessonIndex].units = newLessons[toLessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onLessonsChange(newLessons);
  };

  return {
    expandedLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    addUnit,
    updateUnit,
    deleteUnit,
    toggleLessonExpanded,
    handleVideoFileChange,
    handleLessonImageUpdate,
    moveLessonToPosition,
    moveUnitWithinLesson,
    moveUnitToLesson,
  };
};
