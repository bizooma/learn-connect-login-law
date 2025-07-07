
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

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
      logger.error('Error creating notification:', notificationError);
    } else {
      logger.log('Notification created for new course');
    }
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};
