
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const uploadImageFile = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    logger.log('Uploading image file:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, file);

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath);

    logger.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    logger.error('Error in uploadImageFile:', error);
    throw error;
  }
};

export const uploadVideoFile = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    logger.log('Uploading video file:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) {
      logger.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    logger.log('Video uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    logger.error('Error in uploadVideoFile:', error);
    throw error;
  }
};
