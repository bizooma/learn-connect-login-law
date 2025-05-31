
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Notification, NotificationFormData } from "./types";

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedNotifications = (data || []) as Notification[];
      setNotifications(typedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (formData: NotificationFormData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          is_active: formData.is_active,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification created successfully",
      });
      
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateNotification = async (notificationId: string, formData: NotificationFormData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          is_active: formData.is_active
        })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification updated successfully",
      });
      
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
      
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleActive = async (notificationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_active: !currentStatus })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Notification ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      
      await fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast({
        title: "Error",
        description: "Failed to update notification status",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleActive,
    refreshNotifications: fetchNotifications
  };
};
