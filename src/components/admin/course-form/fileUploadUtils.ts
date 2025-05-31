
import { supabase } from "@/integrations/supabase/client";

export const uploadImageFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `course-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('course-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('course-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const uploadVideoFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `course-videos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('course-videos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('course-videos')
    .getPublicUrl(filePath);

  return publicUrl;
};
