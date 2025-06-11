
import { useState } from "react";

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
  _deletedInForm?: boolean;
}

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
  _deletedInForm?: boolean;
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  video_type: 'youtube' | 'upload';
  video_file?: File;
  duration_minutes: number;
  sort_order: number;
  quiz_id?: string;
  _deletedInForm?: boolean;
}

interface UseModuleManagerProps {
  modules: ModuleData[];
  onModulesChange: (modules: ModuleData[]) => void;
}

export const useModuleManager = ({ modules, onModulesChange }: UseModuleManagerProps) => {
  const addModule = () => {
    const newModule: ModuleData = {
      title: `Module ${modules.length + 1}`,
      description: "",
      image_url: "",
      sort_order: modules.length,
      lessons: []
    };
    onModulesChange([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof ModuleData, value: any) => {
    const updatedModules = modules.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    );
    onModulesChange(updatedModules);
  };

  const deleteModule = (index: number) => {
    const updatedModules = modules.map((module, i) => 
      i === index ? { ...module, _deletedInForm: true } : module
    );
    onModulesChange(updatedModules);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: LessonData = {
      title: `Lesson ${modules[moduleIndex].lessons.length + 1}`,
      description: "",
      image_url: "",
      sort_order: modules[moduleIndex].lessons.length,
      units: []
    };
    
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    );
    onModulesChange(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof LessonData, value: any) => {
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? {
            ...module,
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex ? { ...lesson, [field]: value } : lesson
            )
          }
        : module
    );
    onModulesChange(updatedModules);
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? { 
            ...module, 
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex 
                ? { ...lesson, _deletedInForm: true }  // Mark as deleted instead of removing
                : lesson
            )
          }
        : module
    );
    onModulesChange(updatedModules);
  };

  const addUnit = (moduleIndex: number, lessonIndex: number) => {
    const lesson = modules[moduleIndex].lessons[lessonIndex];
    const newUnit: UnitData = {
      title: `Unit ${lesson.units.length + 1}`,
      description: "",
      content: "",
      video_url: "",
      video_type: 'youtube',
      duration_minutes: 0,
      sort_order: lesson.units.length
    };
    
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? {
            ...module,
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex 
                ? { ...lesson, units: [...lesson.units, newUnit] }
                : lesson
            )
          }
        : module
    );
    onModulesChange(updatedModules);
  };

  const updateUnit = (moduleIndex: number, lessonIndex: number, unitIndex: number, field: keyof UnitData, value: any) => {
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? {
            ...module,
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex 
                ? {
                    ...lesson,
                    units: lesson.units.map((unit, k) => 
                      k === unitIndex ? { ...unit, [field]: value } : unit
                    )
                  }
                : lesson
            )
          }
        : module
    );
    onModulesChange(updatedModules);
  };

  const deleteUnit = (moduleIndex: number, lessonIndex: number, unitIndex: number) => {
    const updatedModules = modules.map((module, i) => 
      i === moduleIndex 
        ? {
            ...module,
            lessons: module.lessons.map((lesson, j) => 
              j === lessonIndex 
                ? { 
                    ...lesson, 
                    units: lesson.units.map((unit, k) => 
                      k === unitIndex 
                        ? { ...unit, _deletedInForm: true }  // Mark as deleted instead of removing
                        : unit
                    )
                  }
                : lesson
            )
          }
        : module
    );
    onModulesChange(updatedModules);
  };

  const handleVideoFileChange = (moduleIndex: number, lessonIndex: number, unitIndex: number, file: File | null) => {
    if (file) {
      updateUnit(moduleIndex, lessonIndex, unitIndex, 'video_file', file);
      const fileUrl = URL.createObjectURL(file);
      updateUnit(moduleIndex, lessonIndex, unitIndex, 'video_url', fileUrl);
      updateUnit(moduleIndex, lessonIndex, unitIndex, 'video_type', 'upload');
    } else {
      updateUnit(moduleIndex, lessonIndex, unitIndex, 'video_file', undefined);
      updateUnit(moduleIndex, lessonIndex, unitIndex, 'video_url', '');
    }
  };

  const handleLessonImageUpdate = (moduleIndex: number, lessonIndex: number, imageUrl: string | null) => {
    updateLesson(moduleIndex, lessonIndex, 'image_url', imageUrl || '');
  };

  const moveModuleToPosition = (fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [movedModule] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, movedModule);
    
    const reorderedModules = newModules.map((module, index) => ({
      ...module,
      sort_order: index
    }));
    
    onModulesChange(reorderedModules);
  };

  const moveLessonWithinModule = (moduleIndex: number, fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [movedLesson] = newModules[moduleIndex].lessons.splice(fromIndex, 1);
    newModules[moduleIndex].lessons.splice(toIndex, 0, movedLesson);
    
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.map((lesson, index) => ({
      ...lesson,
      sort_order: index
    }));
    
    onModulesChange(newModules);
  };

  const moveUnitWithinLesson = (moduleIndex: number, lessonIndex: number, fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [movedUnit] = newModules[moduleIndex].lessons[lessonIndex].units.splice(fromIndex, 1);
    newModules[moduleIndex].lessons[lessonIndex].units.splice(toIndex, 0, movedUnit);
    
    newModules[moduleIndex].lessons[lessonIndex].units = newModules[moduleIndex].lessons[lessonIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onModulesChange(newModules);
  };

  return {
    addModule,
    updateModule,
    deleteModule,
    addLesson,
    updateLesson,
    deleteLesson,
    addUnit,
    updateUnit,
    deleteUnit,
    handleVideoFileChange,
    handleLessonImageUpdate,
    moveModuleToPosition,
    moveLessonWithinModule,
    moveUnitWithinLesson,
  };
};
