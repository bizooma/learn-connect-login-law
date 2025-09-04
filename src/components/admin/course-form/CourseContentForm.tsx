
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ModuleData, LessonData, UnitData } from './types';
import ModuleForm from './ModuleForm';

interface CourseContentFormProps {
  modules: ModuleData[];
  onModulesChange: (modules: ModuleData[]) => void;
}

const CourseContentForm = ({ modules, onModulesChange }: CourseContentFormProps) => {
  const addModule = () => {
    const newModule: ModuleData = {
      title: '',
      description: '',
      image_url: '',
      sort_order: modules.length,
      lessons: []
    };
    onModulesChange([...modules, newModule]);
  };

  const updateModule = (moduleIndex: number, field: keyof ModuleData, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], [field]: value };
    onModulesChange(updatedModules);
  };

  const removeModule = (moduleIndex: number) => {
    console.log('Marking module for deletion at index:', moduleIndex);
    const updatedModules = [...modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], _deletedInForm: true };
    onModulesChange(updatedModules);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: LessonData = {
      title: '',
      description: '',
      image_url: '',
      sort_order: modules[moduleIndex].lessons.length,
      units: []
    };
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    onModulesChange(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    onModulesChange(updatedModules);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    console.log('Marking lesson for deletion at module:', moduleIndex, 'lesson:', lessonIndex);
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      _deletedInForm: true
    };
    onModulesChange(updatedModules);
  };

  const addUnit = (moduleIndex: number, lessonIndex: number) => {
    const newUnit: UnitData = {
      title: '',
      description: '',
      content: '',
      video_url: '',
      video_type: 'youtube',
      duration_minutes: 0,
      sort_order: modules[moduleIndex].lessons[lessonIndex].units.length,
      quiz_id: undefined,
    };
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].units.push(newUnit);
    onModulesChange(updatedModules);
  };

  const updateUnit = (moduleIndex: number, lessonIndex: number, unitIndex: number, field: string, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].units[unitIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex].units[unitIndex],
      [field]: value
    };
    onModulesChange(updatedModules);
  };

  const removeUnit = (moduleIndex: number, lessonIndex: number, unitIndex: number) => {
    console.log('Marking unit for deletion at module:', moduleIndex, 'lesson:', lessonIndex, 'unit:', unitIndex);
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].units[unitIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex].units[unitIndex],
      _deletedInForm: true
    };
    onModulesChange(updatedModules);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <Button type="button" onClick={addModule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      {modules.filter(module => !module._deletedInForm).map((module, displayIndex) => {
        // Find the original index in the full modules array for callback functions
        const originalModuleIndex = modules.findIndex(m => m === module);
        
        return (
          <ModuleForm
            key={originalModuleIndex}
            module={module}
            moduleIndex={displayIndex}
            onModuleUpdate={(field, value) => updateModule(originalModuleIndex, field, value)}
            onModuleRemove={() => removeModule(originalModuleIndex)}
            onAddLesson={() => addLesson(originalModuleIndex)}
            onLessonUpdate={(lessonIndex, field, value) => updateLesson(originalModuleIndex, lessonIndex, field, value)}
            onLessonRemove={(lessonIndex) => removeLesson(originalModuleIndex, lessonIndex)}
            onAddUnit={(lessonIndex) => addUnit(originalModuleIndex, lessonIndex)}
            onUnitUpdate={(lessonIndex, unitIndex, field, value) => updateUnit(originalModuleIndex, lessonIndex, unitIndex, field, value)}
            onUnitRemove={(lessonIndex, unitIndex) => removeUnit(originalModuleIndex, lessonIndex, unitIndex)}
          />
        );
      })}

      {modules.length === 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No modules added yet.</p>
            <Button type="button" onClick={addModule}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Module
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseContentForm;
