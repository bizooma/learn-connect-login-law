
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import type { UserProfile, Course, CertificateTemplate, CertificateRecord } from './types.ts';

export async function getUserProfile(supabaseClient: any, userId: string): Promise<UserProfile> {
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return profile;
}

export async function getCourseDetails(supabaseClient: any, courseId: string): Promise<Course> {
  const { data: course, error: courseError } = await supabaseClient
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    throw new Error('Course not found');
  }

  return course;
}

export async function getCertificateTemplate(supabaseClient: any): Promise<CertificateTemplate> {
  const { data: template, error: templateError } = await supabaseClient
    .from('certificate_templates')
    .select('*')
    .eq('is_active', true)
    .single();

  if (templateError || !template) {
    throw new Error('Certificate template not found');
  }

  if (!template.template_image_url && !template.storage_path) {
    throw new Error('Template image not found');
  }

  return template;
}

export async function getOrCreateCertificateRecord(
  supabaseClient: any,
  userId: string,
  courseId: string,
  template: CertificateTemplate,
  profile: UserProfile,
  course: Course
): Promise<CertificateRecord> {
  // Check if certificate already exists
  const { data: existingCert, error: certCheckError } = await supabaseClient
    .from('user_certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (certCheckError) {
    throw new Error('Error checking existing certificate');
  }

  if (existingCert) {
    return existingCert;
  }

  // Create new certificate record
  const recipientName = `${profile.first_name} ${profile.last_name}`;
  
  // Generate certificate number
  const { data: certNumberResult, error: certNumberError } = await supabaseClient
    .rpc('generate_certificate_number');

  if (certNumberError) {
    throw new Error('Failed to generate certificate number');
  }

  const { data: newCert, error: createError } = await supabaseClient
    .from('user_certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      template_id: template.id,
      recipient_name: recipientName,
      course_title: course.title,
      certificate_number: certNumberResult
    })
    .select()
    .single();

  if (createError) {
    throw new Error('Failed to create certificate record');
  }

  return newCert;
}
