import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Play, Upload } from "lucide-react";
import SectionImageUpload from "./SectionImageUpload";

interface SectionData {
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
}

interface SectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

const SectionManager = ({ sections, onSectionsChange }: SectionManagerProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const addSection = () => {
    const newSection: SectionData = {
      title: "",
      description: "",
      image_url: "",
      sort_order: sections.length,
      units: []
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (index: number, field: keyof SectionData, value: any) => {
    const updatedSections = sections.map((section, i) => 
      i === index ? { ...section, [field]: value } : section
    );
    onSectionsChange(updatedSections);
  };

  const deleteSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    onSectionsChange(updatedSections);
  };

  const addUnit = (sectionIndex: number) => {
    const newUnit: UnitData = {
      title: "",
      description: "",
      content: "",
      video_url: "",
      video_type: 'youtube',
      duration_minutes: 0,
      sort_order: sections[sectionIndex].units.length
    };
    
    const updatedSections = sections.map((section, i) => 
      i === sectionIndex 
        ? { ...section, units: [...section.units, newUnit] }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const updateUnit = (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => {
    const updatedSections = sections.map((section, i) => 
      i === sectionIndex 
        ? {
            ...section,
            units: section.units.map((unit, j) => 
              j === unitIndex ? { ...unit, [field]: value } : unit
            )
          }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const deleteUnit = (sectionIndex: number, unitIndex: number) => {
    const updatedSections = sections.map((section, i) => 
      i === sectionIndex 
        ? { ...section, units: section.units.filter((_, j) => j !== unitIndex) }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const toggleSectionExpanded = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const handleVideoFileChange = (sectionIndex: number, unitIndex: number, file: File | null) => {
    if (file) {
      updateUnit(sectionIndex, unitIndex, 'video_file', file);
      // Create a temporary URL for preview (you might want to upload this to storage)
      const fileUrl = URL.createObjectURL(file);
      updateUnit(sectionIndex, unitIndex, 'video_url', fileUrl);
    }
  };

  const handleSectionImageUpdate = (sectionIndex: number, imageUrl: string | null) => {
    updateSection(sectionIndex, 'image_url', imageUrl || '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Sections</h3>
        <Button onClick={addSection} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <CardTitle className="text-base">
                  Section {sectionIndex + 1}
                </CardTitle>
                <Badge variant="secondary">
                  {section.units.length} units
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSectionExpanded(sectionIndex)}
                >
                  {expandedSections.has(sectionIndex) ? 'Collapse' : 'Expand'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(sectionIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`section-title-${sectionIndex}`}>Section Title</Label>
                <Input
                  id={`section-title-${sectionIndex}`}
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <Label htmlFor={`section-description-${sectionIndex}`}>Description</Label>
                <Input
                  id={`section-description-${sectionIndex}`}
                  value={section.description}
                  onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                  placeholder="Enter section description"
                />
              </div>
            </div>

            <SectionImageUpload
              currentImageUrl={section.image_url}
              onImageUpdate={(imageUrl) => handleSectionImageUpdate(sectionIndex, imageUrl)}
              sectionIndex={sectionIndex}
            />

            {expandedSections.has(sectionIndex) && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Units</h4>
                  <Button
                    onClick={() => addUnit(sectionIndex)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                  </Button>
                </div>

                {section.units.map((unit, unitIndex) => (
                  <Card key={unitIndex} className="border-l-4 border-l-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium">Unit {unitIndex + 1}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUnit(sectionIndex, unitIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor={`unit-title-${sectionIndex}-${unitIndex}`}>Unit Title</Label>
                          <Input
                            id={`unit-title-${sectionIndex}-${unitIndex}`}
                            value={unit.title}
                            onChange={(e) => updateUnit(sectionIndex, unitIndex, 'title', e.target.value)}
                            placeholder="Enter unit title"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`unit-duration-${sectionIndex}-${unitIndex}`}>Duration (minutes)</Label>
                          <Input
                            id={`unit-duration-${sectionIndex}-${unitIndex}`}
                            type="number"
                            value={unit.duration_minutes}
                            onChange={(e) => updateUnit(sectionIndex, unitIndex, 'duration_minutes', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label htmlFor={`unit-description-${sectionIndex}-${unitIndex}`}>Description</Label>
                        <Textarea
                          id={`unit-description-${sectionIndex}-${unitIndex}`}
                          value={unit.description}
                          onChange={(e) => updateUnit(sectionIndex, unitIndex, 'description', e.target.value)}
                          placeholder="Enter unit description"
                          rows={2}
                        />
                      </div>

                      <Tabs defaultValue="video" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="video">Video Content</TabsTrigger>
                          <TabsTrigger value="content">Text Content</TabsTrigger>
                        </TabsList>

                        <TabsContent value="video" className="space-y-4">
                          <div>
                            <Label>Video Type</Label>
                            <Select
                              value={unit.video_type}
                              onValueChange={(value: 'youtube' | 'upload') => 
                                updateUnit(sectionIndex, unitIndex, 'video_type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select video type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="youtube">
                                  <div className="flex items-center">
                                    <Play className="h-4 w-4 mr-2" />
                                    YouTube URL
                                  </div>
                                </SelectItem>
                                <SelectItem value="upload">
                                  <div className="flex items-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Video File
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {unit.video_type === 'youtube' ? (
                            <div>
                              <Label htmlFor={`unit-video-url-${sectionIndex}-${unitIndex}`}>YouTube URL</Label>
                              <Input
                                id={`unit-video-url-${sectionIndex}-${unitIndex}`}
                                value={unit.video_url}
                                onChange={(e) => updateUnit(sectionIndex, unitIndex, 'video_url', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor={`unit-video-file-${sectionIndex}-${unitIndex}`}>Upload Video File</Label>
                              <Input
                                id={`unit-video-file-${sectionIndex}-${unitIndex}`}
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleVideoFileChange(sectionIndex, unitIndex, file);
                                }}
                              />
                              {unit.video_file && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Selected: {unit.video_file.name}
                                </p>
                              )}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="content">
                          <div>
                            <Label htmlFor={`unit-content-${sectionIndex}-${unitIndex}`}>Content</Label>
                            <Textarea
                              id={`unit-content-${sectionIndex}-${unitIndex}`}
                              value={unit.content}
                              onChange={(e) => updateUnit(sectionIndex, unitIndex, 'content', e.target.value)}
                              placeholder="Enter unit content"
                              rows={6}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {sections.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sections yet. Add your first section to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SectionManager;
