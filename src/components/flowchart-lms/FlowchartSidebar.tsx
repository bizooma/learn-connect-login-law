
import React, { useState } from 'react';
import { Search, Filter, BookOpen, Package, FileText, Video, HelpCircle, Download, Users, Star, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlowchart } from './FlowchartContext';
import SidebarItem from './SidebarItem';
import CreateLessonModal from './modals/CreateLessonModal';
import CreateUnitModal from './modals/CreateUnitModal';

const FlowchartSidebar = () => {
  const { 
    sidebarItems, 
    searchTerm, 
    setSearchTerm, 
    selectedCategory, 
    setSelectedCategory,
    loading,
    refetchData
  } = useFlowchart();

  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [createUnitOpen, setCreateUnitOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All Items', icon: Filter, count: sidebarItems.length },
    { id: 'course', label: 'Courses', icon: BookOpen, count: sidebarItems.filter(i => i.type === 'course').length },
    { id: 'module', label: 'Modules', icon: Package, count: sidebarItems.filter(i => i.type === 'module').length },
    { id: 'lesson', label: 'Lessons', icon: FileText, count: sidebarItems.filter(i => i.type === 'lesson').length },
    { id: 'unit', label: 'Units', icon: Video, count: sidebarItems.filter(i => i.type === 'unit').length },
    { id: 'quiz', label: 'Quizzes', icon: HelpCircle, count: sidebarItems.filter(i => i.type === 'quiz').length },
    { id: 'resource', label: 'Resources', icon: Download, count: sidebarItems.filter(i => i.type === 'resource').length },
  ];

  const groupedItems = {
    courses: sidebarItems.filter(item => item.type === 'course'),
    modules: sidebarItems.filter(item => item.type === 'module'),
    lessons: sidebarItems.filter(item => item.type === 'lesson'),
    units: sidebarItems.filter(item => item.type === 'unit'),
    quizzes: sidebarItems.filter(item => item.type === 'quiz'),
    resources: sidebarItems.filter(item => item.type === 'resource'),
  };

  const handleContentCreated = () => {
    refetchData();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">LMS Flowchart Builder</h2>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Loading your courses and content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">LMS Flowchart Builder</h2>
        </div>
        
        {/* Create Content Section */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Create Content</h3>
          <div className="space-y-2">
            <Button
              onClick={() => setCreateLessonOpen(true)}
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Lesson
            </Button>
            <Button
              onClick={() => setCreateUnitOpen(true)}
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Unit
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-2 gap-2">
          {categories.slice(0, 4).map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="justify-between h-8 text-xs"
            >
              <div className="flex items-center space-x-1">
                <category.icon className="h-3 w-3" />
                <span>{category.label}</span>
              </div>
              <Badge variant="secondary" className="h-4 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-2">
          {categories.slice(4).map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="justify-between h-8 text-xs"
            >
              <div className="flex items-center space-x-1">
                <category.icon className="h-3 w-3" />
                <span className="truncate">{category.label}</span>
              </div>
              <Badge variant="secondary" className="h-4 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Content Groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedCategory === 'all' ? (
          <>
            {groupedItems.courses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Your Courses ({groupedItems.courses.length})
                </h3>
                <div className="space-y-2">
                  {groupedItems.courses.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {groupedItems.modules.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Available Modules ({groupedItems.modules.length})
                </h3>
                <div className="space-y-2">
                  {groupedItems.modules.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {groupedItems.lessons.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Available Lessons ({groupedItems.lessons.length})
                  <Badge variant="outline" className="ml-2 h-4 text-xs">
                    Reusable
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {groupedItems.lessons.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {groupedItems.units.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Video className="h-4 w-4 mr-1" />
                  Available Units ({groupedItems.units.length})
                  <Badge variant="outline" className="ml-2 h-4 text-xs">
                    Reusable
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {groupedItems.units.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {groupedItems.quizzes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Available Quizzes ({groupedItems.quizzes.length})
                  <Badge variant="outline" className="ml-2 h-4 text-xs">
                    Reusable
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {groupedItems.quizzes.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {groupedItems.resources.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  Resource Downloads ({groupedItems.resources.length})
                  <Badge variant="outline" className="ml-2 h-4 text-xs">
                    Reusable
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {groupedItems.resources.map((item) => (
                    <SidebarItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {sidebarItems.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items match your search</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-medium">How to use:</p>
          <p>• Create lessons and units using the buttons above</p>
          <p>• Drag your courses to the canvas to build course structures</p>
          <p>• Connect elements by dragging between connection points</p>
          <p>• Units, quizzes, and resources can be reused across courses</p>
        </div>
      </div>

      {/* Modals */}
      <CreateLessonModal
        open={createLessonOpen}
        onOpenChange={setCreateLessonOpen}
        onLessonCreated={handleContentCreated}
      />
      <CreateUnitModal
        open={createUnitOpen}
        onOpenChange={setCreateUnitOpen}
        onUnitCreated={handleContentCreated}
      />
    </div>
  );
};

export default FlowchartSidebar;
