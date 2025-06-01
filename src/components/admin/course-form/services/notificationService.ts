
import { supabase } from "@/integrations/supabase/client";

export const createCourseNotification = async (courseTitle: string) => {
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: 'New Course Available',
        message: `A new course "${courseTitle}" has been added to the catalog. Check it out now!`,
        type: 'info',
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    } else {
      console.log('Notification created for new course');
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
