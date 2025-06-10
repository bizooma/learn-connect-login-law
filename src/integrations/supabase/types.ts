export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_image_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_image_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          is_mandatory: boolean
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_calendars: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          meeting_link: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          meeting_link?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          meeting_link?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_calendars_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_drafts: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          draft_data: Json | null
          duration: string | null
          id: string
          image_url: string | null
          instructor: string | null
          level: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          draft_data?: Json | null
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          level?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          draft_data?: Json | null
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          level?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration: string
          id: string
          image_url: string | null
          instructor: string
          is_draft: boolean
          level: string
          rating: number | null
          students_enrolled: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration: string
          id?: string
          image_url?: string | null
          instructor: string
          is_draft?: boolean
          level: string
          rating?: number | null
          students_enrolled?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration?: string
          id?: string
          image_url?: string | null
          instructor?: string
          is_draft?: boolean
          level?: string
          rating?: number | null
          students_enrolled?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_courses_level"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["code"]
          },
        ]
      }
      flowchart_canvases: {
        Row: {
          created_at: string
          description: string | null
          edges_data: Json
          id: string
          is_active: boolean
          name: string
          nodes_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges_data?: Json
          id?: string
          is_active?: boolean
          name: string
          nodes_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edges_data?: Json
          id?: string
          is_active?: boolean
          name?: string
          nodes_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      law_firm_calendars: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          law_firm_id: string
          meeting_link: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          law_firm_id: string
          meeting_link?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          law_firm_id?: string
          meeting_link?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "law_firm_calendars_law_firm_id_fkey"
            columns: ["law_firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          total_seats: number
          updated_at: string
          used_seats: number
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          image_url: string | null
          is_draft: boolean
          module_id: string
          sort_order: number
          title: string
          updated_at: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          image_url: string | null
          is_draft: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_draft?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      powerpoint_imports: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_data: Json | null
          file_url: string
          filename: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_data?: Json | null
          file_url: string
          filename: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_data?: Json | null
          file_url?: string
          filename?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      powerpoint_video_imports: {
        Row: {
          avatar_id: string | null
          created_at: string
          error_message: string | null
          file_url: string
          filename: string
          heygen_job_id: string | null
          heygen_video_url: string | null
          id: string
          script_content: string | null
          status: string
          updated_at: string
          user_id: string
          voice_id: string | null
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          error_message?: string | null
          file_url: string
          filename: string
          heygen_job_id?: string | null
          heygen_video_url?: string | null
          id?: string
          script_content?: string | null
          status?: string
          updated_at?: string
          user_id: string
          voice_id?: string | null
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          error_message?: string | null
          file_url?: string
          filename?: string
          heygen_job_id?: string | null
          heygen_video_url?: string | null
          id?: string
          script_content?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          is_deleted: boolean | null
          last_name: string | null
          law_firm_id: string | null
          law_firm_name: string | null
          profile_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_name?: string | null
          law_firm_id?: string | null
          law_firm_name?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_name?: string | null
          law_firm_id?: string | null
          law_firm_name?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_law_firm_id_fkey"
            columns: ["law_firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_audit_log: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quiz_question_options: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_correct: boolean
          is_deleted: boolean | null
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_correct?: boolean
          is_deleted?: boolean | null
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_correct?: boolean
          is_deleted?: boolean | null
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_question_options_question_id"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          points: number
          question_text: string
          question_type: string
          quiz_id: string
          sort_order: number
          source_slide_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          points?: number
          question_text: string
          question_type?: string
          quiz_id: string
          sort_order?: number
          source_slide_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          points?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
          source_slide_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_questions_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          import_id: string | null
          is_active: boolean
          is_deleted: boolean | null
          passing_score: number
          source_type: string | null
          time_limit_minutes: number | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          import_id?: string | null
          is_active?: boolean
          is_deleted?: boolean | null
          passing_score?: number
          source_type?: string | null
          time_limit_minutes?: number | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          import_id?: string | null
          is_active?: boolean
          is_deleted?: boolean | null
          passing_score?: number
          source_type?: string | null
          time_limit_minutes?: number | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "powerpoint_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          files: Json | null
          id: string
          is_draft: boolean
          section_id: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          files?: Json | null
          id?: string
          is_draft?: boolean
          section_id: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          files?: Json | null
          id?: string
          is_draft?: boolean
          section_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          course_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          quiz_id: string | null
          session_id: string | null
          unit_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          quiz_id?: string | null
          session_id?: string | null
          unit_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          quiz_id?: string | null
          session_id?: string | null
          unit_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certificates: {
        Row: {
          certificate_number: string
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_at: string
          recipient_name: string
          template_id: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          course_title: string
          created_at?: string
          id?: string
          issued_at?: string
          recipient_name: string
          template_id: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          course_title?: string
          created_at?: string
          id?: string
          issued_at?: string
          recipient_name?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          progress_percentage: number
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_import_batches: {
        Row: {
          created_at: string
          duplicate_emails: number
          failed_imports: number
          filename: string
          id: string
          import_errors: Json | null
          imported_by: string
          successful_imports: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          duplicate_emails?: number
          failed_imports?: number
          filename: string
          id?: string
          import_errors?: Json | null
          imported_by: string
          successful_imports?: number
          total_rows: number
        }
        Update: {
          created_at?: string
          duplicate_emails?: number
          failed_imports?: number
          filename?: string
          id?: string
          import_errors?: Json | null
          imported_by?: string
          successful_imports?: number
          total_rows?: number
        }
        Relationships: []
      }
      user_management_audit: {
        Row: {
          action_type: string
          id: string
          ip_address: unknown | null
          is_reversible: boolean | null
          new_data: Json | null
          old_data: Json | null
          performed_at: string | null
          performed_by: string | null
          reason: string | null
          session_id: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          id?: string
          ip_address?: unknown | null
          is_reversible?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          session_id?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          id?: string
          ip_address?: unknown | null
          is_reversible?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          session_id?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_role_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: unknown | null
          new_role: string
          old_role: string | null
          reason: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          new_role: string
          old_role?: string | null
          reason?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: unknown | null
          new_role?: string
          old_role?: string | null
          reason?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unit_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          completion_method: string | null
          course_id: string
          created_at: string
          id: string
          quiz_completed: boolean | null
          quiz_completed_at: string | null
          unit_id: string
          updated_at: string
          user_id: string
          video_completed: boolean | null
          video_completed_at: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completion_method?: string | null
          course_id: string
          created_at?: string
          id?: string
          quiz_completed?: boolean | null
          quiz_completed_at?: string | null
          unit_id: string
          updated_at?: string
          user_id: string
          video_completed?: boolean | null
          video_completed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completion_method?: string | null
          course_id?: string
          created_at?: string
          id?: string
          quiz_completed?: boolean | null
          quiz_completed_at?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string
          video_completed?: boolean | null
          video_completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_unit_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unit_progress_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unit_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          is_completed: boolean
          last_watched_at: string
          total_duration_seconds: number | null
          unit_id: string
          updated_at: string
          user_id: string
          watch_percentage: number
          watched_duration_seconds: number
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          total_duration_seconds?: number | null
          unit_id: string
          updated_at?: string
          user_id: string
          watch_percentage?: number
          watched_duration_seconds?: number
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          last_watched_at?: string
          total_duration_seconds?: number | null
          unit_id?: string
          updated_at?: string
          user_id?: string
          watch_percentage?: number
          watched_duration_seconds?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_mark_unit_completed: {
        Args: {
          p_user_id: string
          p_unit_id: string
          p_course_id: string
          p_reason?: string
          p_performed_by?: string
        }
        Returns: Json
      }
      cleanup_old_drafts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_law_firm_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_management_history: {
        Args: { p_user_id?: string; p_limit?: number }
        Returns: {
          id: string
          target_user_id: string
          target_email: string
          action_type: string
          performed_by: string
          performer_email: string
          performed_at: string
          reason: string
          old_data: Json
          new_data: Json
          is_reversible: boolean
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_law_firm_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_owner_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_activity_type: Database["public"]["Enums"]["activity_type"]
          p_course_id?: string
          p_unit_id?: string
          p_quiz_id?: string
          p_session_id?: string
          p_duration_seconds?: number
          p_metadata?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      mark_course_completed: {
        Args: {
          p_user_id: string
          p_course_id: string
          p_completion_date?: string
        }
        Returns: undefined
      }
      move_content_to_level: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_target_parent_id: string
          p_target_parent_type: string
          p_new_sort_order?: number
        }
        Returns: boolean
      }
      reclassify_section_to_module: {
        Args: { p_section_id: string; p_course_id: string }
        Returns: string
      }
      reclassify_unit_to_section: {
        Args: { p_unit_id: string; p_module_id: string }
        Returns: string
      }
      restore_quiz: {
        Args: { quiz_id: string }
        Returns: boolean
      }
      restore_user: {
        Args: { p_user_id: string; p_reason?: string; p_performed_by?: string }
        Returns: Json
      }
      soft_delete_quiz: {
        Args: { quiz_id: string }
        Returns: boolean
      }
      soft_delete_user: {
        Args: { p_user_id: string; p_reason?: string; p_performed_by?: string }
        Returns: Json
      }
      update_user_role_safe: {
        Args: {
          p_user_id: string
          p_new_role: string
          p_reason?: string
          p_performed_by?: string
        }
        Returns: Json
      }
    }
    Enums: {
      activity_type:
        | "login"
        | "logout"
        | "course_access"
        | "unit_access"
        | "unit_complete"
        | "quiz_start"
        | "quiz_complete"
        | "video_play"
        | "video_pause"
        | "video_complete"
        | "page_view"
      app_role: "admin" | "owner" | "student" | "client" | "free"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "login",
        "logout",
        "course_access",
        "unit_access",
        "unit_complete",
        "quiz_start",
        "quiz_complete",
        "video_play",
        "video_pause",
        "video_complete",
        "page_view",
      ],
      app_role: ["admin", "owner", "student", "client", "free"],
    },
  },
} as const
