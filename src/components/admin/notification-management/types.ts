
import { Tables } from "@/integrations/supabase/types";

export type NotificationRow = Tables<'notifications'>;

export type NotificationAudience = 
  | 'new_frontier_only'
  | 'all_students' 
  | 'all_free'
  | 'all_owners'
  | 'all_users';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_active: boolean;
  created_by: string;
  audience: NotificationAudience;
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  audience: NotificationAudience;
}
