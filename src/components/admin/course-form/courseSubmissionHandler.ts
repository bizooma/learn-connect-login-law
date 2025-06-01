
import { CourseFormData, SectionData } from "./types";
import { createCourse } from "./services/courseCreation";
import { createLessonsAndUnits } from "./services/sectionCreation";
import { createCourseNotification } from "./services/notificationService";
import { createWelcomeCalendarEvent } from "./services/calendarService";

export const handleCourseSubmission = async (
  data: CourseFormData,
  lessons: SectionData[]
) => {
  // Create the course first
  const courseDataResult = await createCourse(data);

  // Create notification for new course
  await createCourseNotification(data.title);

  // Create a default welcome calendar event for the new course
  await createWelcomeCalendarEvent(courseDataResult.id, data.title);

  // Create lessons and units if any
  await createLessonsAndUnits(courseDataResult.id, lessons);

  console.log('Course creation completed successfully');
};
