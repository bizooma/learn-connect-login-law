
import { supabase } from "@/integrations/supabase/client";
import { CourseFormData, SectionData } from "./types";
import { uploadImageFile, uploadVideoFile } from "./fileUploadUtils";

export const handleCourseSubmission = async (
  data: CourseFormData,
  sections: SectionData[]
) => {
  let imageUrl = null;
  
  // Upload image file if provided
  if (data.image_file) {
    try {
      console.log('Starting image upload...');
      imageUrl = await uploadImageFile(data.image_file);
      console.log('Image upload completed:', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  // Create the course first
  const courseData = {
    title: data.title,
    description: data.description,
    instructor: data.instructor,
    category: data.category,
    level: data.level || 'beginner',
    duration: data.duration,
    image_url: imageUrl,
    rating: 0,
    students_enrolled: 0,
  };

  console.log('Creating course with data:', courseData);

  const { data: courseDataResult, error: courseError } = await supabase
    .from('courses')
    .insert(courseData)
    .select()
    .single();

  if (courseError) {
    console.error('Error creating course:', courseError);
    throw new Error(`Failed to create course: ${courseError.message}`);
  }

  console.log('Course created successfully:', courseDataResult);

  // Create notification for new course
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: 'New Course Available',
        message: `A new course "${data.title}" has been added to the catalog. Check it out now!`,
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

  // Create a default welcome calendar event for the new course
  try {
    const currentDate = new Date();
    const welcomeDate = new Date(currentDate);
    welcomeDate.setDate(currentDate.getDate() + 1);

    await supabase
      .from('course_calendars')
      .insert({
        course_id: courseDataResult.id,
        title: `Welcome to ${data.title}`,
        description: 'Course introduction and overview',
        event_date: welcomeDate.toISOString().split('T')[0],
        event_type: 'general',
      });

    console.log('Default calendar event created for course');
  } catch (error) {
    console.error('Error creating default calendar event:', error);
  }

  // Create sections and units if any
  if (sections.length > 0) {
    for (const section of sections) {
      console.log('Creating section:', section.title);
      
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .insert({
          course_id: courseDataResult.id,
          title: section.title,
          description: section.description,
          sort_order: section.sort_order,
        })
        .select()
        .single();

      if (sectionError) {
        console.error('Error creating section:', sectionError);
        throw new Error(`Failed to create section: ${sectionError.message}`);
      }

      // Create units for this section
      if (section.units.length > 0) {
        for (const unit of section.units) {
          let videoUrl = unit.video_url;
          
          // Upload video file if it's an upload type and has a file
          if (unit.video_type === 'upload' && unit.video_file) {
            try {
              console.log('Uploading video for unit:', unit.title);
              videoUrl = await uploadVideoFile(unit.video_file);
            } catch (error) {
              console.error('Error uploading video:', error);
              throw new Error(`Failed to upload video for unit "${unit.title}": ${error.message}`);
            }
          }

          const { data: unitData, error: unitError } = await supabase
            .from('units')
            .insert({
              section_id: sectionData.id,
              title: unit.title,
              description: unit.description,
              content: unit.content,
              video_url: videoUrl || null,
              duration_minutes: unit.duration_minutes,
              sort_order: unit.sort_order,
            })
            .select()
            .single();

          if (unitError) {
            console.error('Error creating unit:', unitError);
            throw new Error(`Failed to create unit: ${unitError.message}`);
          }

          // Link existing quiz to this unit if quiz_id is provided
          if (unit.quiz_id) {
            console.log('Linking quiz to unit:', unit.title, 'Quiz ID:', unit.quiz_id);
            
            const { error: quizUpdateError } = await supabase
              .from('quizzes')
              .update({ unit_id: unitData.id })
              .eq('id', unit.quiz_id);

            if (quizUpdateError) {
              console.error('Error linking quiz to unit:', quizUpdateError);
              throw new Error(`Failed to link quiz to unit: ${quizUpdateError.message}`);
            }
          }
        }
      }
    }
  }

  console.log('Course creation completed successfully');
};
