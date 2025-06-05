
export interface CertificateData {
  courseId: string;
  userId: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
}

export interface Course {
  title: string;
}

export interface CertificateTemplate {
  id: string;
  template_image_url: string;
}

export interface CertificateRecord {
  id: string;
  user_id: string;
  course_id: string;
  template_id: string;
  recipient_name: string;
  course_title: string;
  certificate_number: string;
  issued_at: string;
}
