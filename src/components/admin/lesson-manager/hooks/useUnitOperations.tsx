
import { UnitData, SectionData } from "../types";

interface UseUnitOperationsProps {
  lessons: SectionData[];
  onLessonsChange: (lessons: SectionData[]) => void;
}

export const useUnitOperations = ({ lessons, onLessonsChange }: UseUnitOperationsProps) => {
  const addUnit = (lessonIndex: number) => {
    console.log('useUnitOperations: Adding unit to lesson index:', lessonIndex);
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
    console.log('Deleting unit:', lessonIndex, unitIndex);
    
    const updatedLessons = lessons.map((lesson, i) => 
      i === lessonIndex 
        ? { 
            ...lesson, 
            units: lesson.units.map((unit, j) => 
              j === unitIndex 
                ? { ...unit, _deletedInForm: true, is_draft: true }  // Mark as deleted AND draft
                : unit
            )
          }
        : lesson
    );
    
    console.log('Updated lessons after unit deletion:', updatedLessons);
    onLessonsChange(updatedLessons);
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

  return {
    addUnit,
    updateUnit,
    deleteUnit,
    handleVideoFileChange,
  };
};
