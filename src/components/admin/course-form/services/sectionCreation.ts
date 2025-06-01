
import { SectionData } from "../types";
import { createDefaultModule } from "./moduleCreation";
import { createSection } from "./sectionService";
import { createUnit, linkQuizToUnit } from "./unitService";

export const createSectionsAndUnits = async (courseId: string, sections: SectionData[]) => {
  if (sections.length === 0) return;

  // First, create a default module for the course if sections exist
  const moduleData = await createDefaultModule(courseId);

  for (const section of sections) {
    const sectionData = await createSection(courseId, moduleData.id, section);

    // Create units for this section
    if (section.units.length > 0) {
      for (const unit of section.units) {
        const unitData = await createUnit(sectionData.id, unit);

        // Link existing quiz to this unit if quiz_id is provided
        if (unit.quiz_id) {
          await linkQuizToUnit(unitData.id, unit.quiz_id);
        }
      }
    }
  }
};
