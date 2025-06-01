
import { useState } from "react";
import { UnitData, SectionData } from "./types";

interface UseSectionManagerProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
}

export const useSectionManager = ({ sections, onSectionsChange }: UseSectionManagerProps) => {
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
    // Update sort orders
    const reorderedSections = updatedSections.map((section, i) => ({
      ...section,
      sort_order: i
    }));
    onSectionsChange(reorderedSections);
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
    console.log('Updating unit:', sectionIndex, unitIndex, field, value);
    
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
    
    console.log('Updated sections:', updatedSections);
    onSectionsChange(updatedSections);
  };

  const deleteUnit = (sectionIndex: number, unitIndex: number) => {
    const updatedSections = sections.map((section, i) => 
      i === sectionIndex 
        ? { 
            ...section, 
            units: section.units.filter((_, j) => j !== unitIndex)
              .map((unit, index) => ({ ...unit, sort_order: index }))
          }
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
    console.log('Video file changed:', sectionIndex, unitIndex, file?.name);
    
    if (file) {
      // Store the actual file object
      updateUnit(sectionIndex, unitIndex, 'video_file', file);
      
      // Create a temporary URL for preview (will be replaced with actual URL on save)
      const fileUrl = URL.createObjectURL(file);
      updateUnit(sectionIndex, unitIndex, 'video_url', fileUrl);
      
      // Set video type to upload since we're uploading a file
      updateUnit(sectionIndex, unitIndex, 'video_type', 'upload');
    } else {
      // Clear the file and URL if no file is selected
      updateUnit(sectionIndex, unitIndex, 'video_file', undefined);
      updateUnit(sectionIndex, unitIndex, 'video_url', '');
    }
  };

  const handleSectionImageUpdate = (sectionIndex: number, imageUrl: string | null) => {
    updateSection(sectionIndex, 'image_url', imageUrl || '');
  };

  // Simplified move methods for up/down arrows
  const moveSectionToPosition = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Update sort orders
    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      sort_order: index
    }));
    
    onSectionsChange(reorderedSections);
  };

  const moveUnitWithinSection = (sectionIndex: number, fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedUnit] = newSections[sectionIndex].units.splice(fromIndex, 1);
    newSections[sectionIndex].units.splice(toIndex, 0, movedUnit);
    
    // Update sort orders
    newSections[sectionIndex].units = newSections[sectionIndex].units.map((unit, index) => ({
      ...unit,
      sort_order: index
    }));
    
    onSectionsChange(newSections);
  };

  return {
    expandedSections,
    addSection,
    updateSection,
    deleteSection,
    addUnit,
    updateUnit,
    deleteUnit,
    toggleSectionExpanded,
    handleVideoFileChange,
    handleSectionImageUpdate,
    moveSectionToPosition,
    moveUnitWithinSection,
  };
};
