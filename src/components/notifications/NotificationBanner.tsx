
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables } from "@/integrations/supabase/types";

type NotificationRow = Tables<'notifications'>;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_active: boolean;
  audience: string;
}

const NotificationBanner = () => {
  const { user } = useAuth();
  const { isAdmin, isStudent, isFree, isOwner } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      loadDismissedNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedNotifications = (data || []) as Notification[];
      
      // Filter notifications based on audience and user role/email
      const filteredNotifications = typedNotifications.filter(notification => {
        // Admins see all notifications
        if (isAdmin) return true;
        
        switch (notification.audience) {
          case 'all_users':
            return true;
          case 'new_frontier_only':
            return user?.email?.endsWith('@newfrontier.us') || false;
          case 'all_students':
            return isStudent;
          case 'all_free':
            return isFree;
          case 'all_owners':
            return isOwner;
          default:
            return false;
        }
      });
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const loadDismissedNotifications = () => {
    const dismissed = localStorage.getItem(`dismissed_notifications_${user?.id}`);
    if (dismissed) {
      setDismissedNotifications(JSON.parse(dismissed));
    }
  };

  const dismissNotification = (notificationId: string) => {
    const newDismissed = [...dismissedNotifications, notificationId];
    setDismissedNotifications(newDismissed);
    localStorage.setItem(`dismissed_notifications_${user?.id}`, JSON.stringify(newDismissed));
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const activeNotifications = notifications.filter(
    notification => !dismissedNotifications.includes(notification.id)
  );

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {activeNotifications.map((notification) => (
        <Card key={notification.id} className={`${getTypeStyles(notification.type)} border`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Bell className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <p className="text-xs mt-2 opacity-75">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="h-8 w-8 p-0 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationBanner;
