
import { SectionData, UnitData } from './types';

export const handleAddUnitToFirstSection = (
  sections: SectionData[],
  addSection: () => void,
  addUnit: (sectionIndex: number) => void,
  expandedSections: Set<number>,
  toggleSectionExpanded: (index: number) => void
) => {
  if (sections.length === 0) {
    addSection();
    // Expand the first section after adding it
    setTimeout(() => {
      if (!expandedSections.has(0)) {
        toggleSectionExpanded(0);
      }
      addUnit(0);
    }, 100);
  } else {
    // Expand the first section if not already expanded
    if (!expandedSections.has(0)) {
      toggleSectionExpanded(0);
    }
    addUnit(0);
  }
};

export const handleAddVideoUnit = (
  sections: SectionData[],
  addSection: () => void,
  expandedSections: Set<number>,
  toggleSectionExpanded: (index: number) => void,
  onSectionsChange: (sections: SectionData[]) => void
) => {
  // This function is no longer needed since videos should be section-level content
  // Instead, we'll just ensure there's a section to work with
  if (sections.length === 0) {
    addSection();
    setTimeout(() => {
      if (!expandedSections.has(0)) {
        toggleSectionExpanded(0);
      }
    }, 100);
  } else {
    // Just expand the first section so user can add content
    if (!expandedSections.has(0)) {
      toggleSectionExpanded(0);
    }
  }
};
