
import { supabase } from "@/integrations/supabase/client";

const ensureBucketExists = async (bucketName: string) => {
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
  
  if (!bucketExists) {
    console.log(`Creating bucket: ${bucketName}`);
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: bucketName === 'course-images' 
        ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        : ['video/mp4', 'video/webm', 'video/ogg']
    });
    
    if (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      throw new Error(`Failed to create storage bucket: ${bucketName}`);
    }
  }
};

export const uploadImageFile = async (file: File): Promise<string> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists('course-images');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `course-images/${fileName}`;

    console.log('Uploading image file:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageFile:', error);
    throw error;
  }
};

export const uploadVideoFile = async (file: File): Promise<string> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists('course-videos');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `course-videos/${fileName}`;

    console.log('Uploading video file:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    console.log('Video uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadVideoFile:', error);
    throw error;
  }
};
