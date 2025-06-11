
import { useState } from "react";
import ModuleManagerHeader from "./module-manager/ModuleManagerHeader";
import ModuleCard from "./module-manager/ModuleCard";
import EmptyState from "./module-manager/EmptyState";
import { useModuleManager } from "./module-manager/useModuleManager";

interface ModuleData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  lessons: LessonData[];
}

interface LessonData {
  id?: string;
  title: string;
  description: string;
  image_url?: string;
  sort_order: number;
  units: UnitData[];
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
}

interface ModuleManagerProps {
  modules: ModuleData[];
  onModulesChange: (modules: ModuleData[]) => void;
}

const ModuleManager = ({ modules, onModulesChange }: ModuleManagerProps) => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  const {
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
  } = useModuleManager({ modules, onModulesChange });

  const handleAddModule = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addModule();
  };

  const toggleExpanded = (moduleIndex: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex);
      } else {
        newSet.add(moduleIndex);
      }
      return newSet;
    });
  };

  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <ModuleManagerHeader onAddModule={handleAddModule} />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleManagerHeader onAddModule={handleAddModule} />
      
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <ModuleCard
            key={moduleIndex}
            module={module}
            moduleIndex={moduleIndex}
            isExpanded={expandedModules.has(moduleIndex)}
            onToggleExpanded={() => toggleExpanded(moduleIndex)}
            onUpdate={(field, value) => updateModule(moduleIndex, field as keyof ModuleData, value)}
            onDelete={() => deleteModule(moduleIndex)}
            onAddLesson={() => addLesson(moduleIndex)}
            onUpdateLesson={(lessonIndex, field, value) => updateLesson(moduleIndex, lessonIndex, field as keyof LessonData, value)}
            onDeleteLesson={(lessonIndex) => deleteLesson(moduleIndex, lessonIndex)}
            onAddUnit={(lessonIndex) => addUnit(moduleIndex, lessonIndex)}
            onUpdateUnit={(lessonIndex, unitIndex, field, value) => updateUnit(moduleIndex, lessonIndex, unitIndex, field as keyof UnitData, value)}
            onDeleteUnit={(lessonIndex, unitIndex) => deleteUnit(moduleIndex, lessonIndex, unitIndex)}
            onVideoFileChange={(lessonIndex, unitIndex, file) => handleVideoFileChange(moduleIndex, lessonIndex, unitIndex, file)}
            onMoveModuleUp={() => moveModuleToPosition(moduleIndex, moduleIndex - 1)}
            onMoveModuleDown={() => moveModuleToPosition(moduleIndex, moduleIndex + 1)}
            canMoveModuleUp={moduleIndex > 0}
            canMoveModuleDown={moduleIndex < modules.length - 1}
            onMoveLessonUp={(lessonIndex: number) => moveLessonWithinModule(moduleIndex, lessonIndex, lessonIndex - 1)}
            onMoveLessonDown={(lessonIndex: number) => moveLessonWithinModule(moduleIndex, lessonIndex, lessonIndex + 1)}
          />
        ))}
      </div>
    </div>
  );
};

export default ModuleManager;
