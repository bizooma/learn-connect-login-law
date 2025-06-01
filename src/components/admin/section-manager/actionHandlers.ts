
import { SectionData, UnitData } from './types';

export const createVideoUnit = (sectionIndex: number, sections: SectionData[]): UnitData => {
  return {
    title: "",
    description: "",
    content: "",
    video_url: "",
    video_type: 'upload',
    duration_minutes: 0,
    sort_order: sections[sectionIndex].units.length
  };
};

export const addVideoUnitToSection = (
  sectionIndex: number,
  sections: SectionData[],
  onSectionsChange: (sections: SectionData[]) => void
) => {
  const newUnit = createVideoUnit(sectionIndex, sections);
  
  const updatedSections = sections.map((section, i) => 
    i === sectionIndex 
      ? { ...section, units: [...section.units, newUnit] }
      : section
  );
  onSectionsChange(updatedSections);
};

export const handleAddVideoUnit = (
  sections: SectionData[],
  addSection: () => void,
  expandedSections: Set<number>,
  toggleSectionExpanded: (index: number) => void,
  onSectionsChange: (sections: SectionData[]) => void
) => {
  console.log('Adding video unit...');
  
  if (sections.length === 0) {
    console.log('Creating section first...');
    addSection();
    setTimeout(() => {
      console.log('Adding video unit to new section...');
      addVideoUnitToSection(0, sections, onSectionsChange);
    }, 100);
  } else {
    console.log('Adding video unit to existing section...');
    addVideoUnitToSection(0, sections, onSectionsChange);
    
    if (!expandedSections.has(0)) {
      toggleSectionExpanded(0);
    }
  }
};

export const handleAddUnitToFirstSection = (
  sections: SectionData[],
  addSection: () => void,
  addUnit: (sectionIndex: number) => void,
  expandedSections: Set<number>,
  toggleSectionExpanded: (index: number) => void
) => {
  if (sections.length === 0) {
    addSection();
    setTimeout(() => {
      addUnit(0);
    }, 100);
  } else {
    addUnit(0);
    if (!expandedSections.has(0)) {
      toggleSectionExpanded(0);
    }
  }
};
