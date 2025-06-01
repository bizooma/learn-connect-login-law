
import { SectionData } from "../types";
import { createDefaultModule } from "./moduleCreation";
import { createLesson } from "./sectionService";
import { createUnit, linkQuizToUnit } from "./unitService";

export const createLessonsAndUnits = async (courseId: string, lessons: SectionData[]) => {
  if (lessons.length === 0) return;

  // First, create a default module for the course if lessons exist
  const moduleData = await createDefaultModule(courseId);

  for (const lesson of lessons) {
    const lessonData = await createLesson(courseId, moduleData.id, lesson);

    // Create units for this lesson
    if (lesson.units.length > 0) {
      for (const unit of lesson.units) {
        const unitData = await createUnit(lessonData.id, unit);

        // Link existing quiz to this unit if quiz_id is provided
        if (unit.quiz_id) {
          await linkQuizToUnit(unitData.id, unit.quiz_id);
        }
      }
    }
  }
};
