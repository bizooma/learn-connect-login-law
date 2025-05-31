
import { Tables } from "@/integrations/supabase/types";

export type NotificationRow = Tables<'notifications'>;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_active: boolean;
  created_by: string;
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
}
