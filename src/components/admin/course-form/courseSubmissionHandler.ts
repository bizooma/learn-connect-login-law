
import { CourseFormData, SectionData } from "./types";
import { createCourse } from "./services/courseCreation";
import { createSectionsAndUnits } from "./services/sectionCreation";
import { createCourseNotification } from "./services/notificationService";
import { createWelcomeCalendarEvent } from "./services/calendarService";

export const handleCourseSubmission = async (
  data: CourseFormData,
  sections: SectionData[]
) => {
  // Create the course first
  const courseDataResult = await createCourse(data);

  // Create notification for new course
  await createCourseNotification(data.title);

  // Create a default welcome calendar event for the new course
  await createWelcomeCalendarEvent(courseDataResult.id, data.title);

  // Create sections and units if any
  await createSectionsAndUnits(courseDataResult.id, sections);

  console.log('Course creation completed successfully');
};
