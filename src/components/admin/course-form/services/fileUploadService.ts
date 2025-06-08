
import { supabase } from "@/integrations/supabase/client";

export const createMultipleFileUpload = async (
  files: File[], 
  contentType: string, 
  contentIndex: number
): Promise<Array<{ url: string; name: string; size: number }>> => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${contentType}-${contentIndex}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${contentType}-files/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      name: file.name,
      size: file.size
    };
  });

  return Promise.all(uploadPromises);
};
