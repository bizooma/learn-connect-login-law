
import { supabase } from "@/integrations/supabase/client";

export const createWelcomeCalendarEvent = async (courseId: string, courseTitle: string) => {
  try {
    const currentDate = new Date();
    const welcomeDate = new Date(currentDate);
    welcomeDate.setDate(currentDate.getDate() + 1);

    await supabase
      .from('course_calendars')
      .insert({
        course_id: courseId,
        title: `Welcome to ${courseTitle}`,
        description: 'Course introduction and overview',
        event_date: welcomeDate.toISOString().split('T')[0],
        event_type: 'general',
      });

    console.log('Default calendar event created for course');
  } catch (error) {
    console.error('Error creating default calendar event:', error);
  }
};
