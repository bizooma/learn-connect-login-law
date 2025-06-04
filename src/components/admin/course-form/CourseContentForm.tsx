import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { ModuleData, LessonData, UnitData } from './types';
import UnitForm from './UnitForm';

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
      file_url: '',
      file_name: '',
      file_size: 0,
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
    const updatedModules = modules.filter((_, index) => index !== moduleIndex);
    onModulesChange(updatedModules);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson: LessonData = {
      title: '',
      description: '',
      image_url: '',
      file_url: '',
      file_name: '',
      file_size: 0,
      sort_order: modules[moduleIndex].lessons.length,
      units: []
    };
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    onModulesChange(updatedModules);
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof LessonData, value: any) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex] = {
      ...updatedModules[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    onModulesChange(updatedModules);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
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
      image_url: '',
      file_url: '',
      file_name: '',
      file_size: 0,
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
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex].units = 
      updatedModules[moduleIndex].lessons[lessonIndex].units.filter((_, index) => index !== unitIndex);
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

      {modules.map((module, moduleIndex) => (
        <Card key={moduleIndex} className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span>Module {moduleIndex + 1}</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeModule(moduleIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label>Module Title</Label>
              <Input
                value={module.title}
                onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                placeholder="Enter module title"
              />
            </div>
            
            <div>
              <Label>Module Description</Label>
              <Textarea
                value={module.description}
                onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                placeholder="Enter module description"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Lessons</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson(moduleIndex)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>

              {module.lessons.map((lesson, lessonIndex) => (
                <Card key={lessonIndex} className="border-green-200 ml-4">
                  <CardHeader className="bg-green-50 py-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Lesson {lessonIndex + 1}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLesson(moduleIndex, lessonIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Label>Lesson Title</Label>
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                        placeholder="Enter lesson title"
                      />
                    </div>
                    
                    <div>
                      <Label>Lesson Description</Label>
                      <Textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                        placeholder="Enter lesson description"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Units</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addUnit(moduleIndex, lessonIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Unit
                        </Button>
                      </div>

                      {lesson.units.map((unit, unitIndex) => (
                        <UnitForm
                          key={unitIndex}
                          unit={unit}
                          onUnitChange={(field, value) => updateUnit(moduleIndex, lessonIndex, unitIndex, field, value)}
                          onRemove={() => removeUnit(moduleIndex, lessonIndex, unitIndex)}
                          unitIndex={unitIndex}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

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
