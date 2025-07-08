
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
  const { isAdmin, isStudent, isFree, isOwner, loading: roleLoading } = useUserRole();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  useEffect(() => {
    console.log('NotificationBanner: useEffect triggered', {
      hasUser: !!user,
      roleLoading,
      isAdmin,
      isOwner,
      isStudent,
      isFree
    });

    if (user && !roleLoading) {
      console.log('NotificationBanner: Fetching notifications for user with roles:', {
        isAdmin,
        isOwner,
        isStudent,
        isFree,
        userEmail: user.email
      });
      fetchNotifications();
      loadDismissedNotifications();
    }
  }, [user, roleLoading, isAdmin, isOwner, isStudent, isFree]);

  const fetchNotifications = async () => {
    try {
      console.log('NotificationBanner: Starting to fetch notifications');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('NotificationBanner: Raw notifications from database:', data);
      
      // Type assertion to ensure proper typing
      const typedNotifications = (data || []) as Notification[];
      
      // Filter notifications based on audience and user role/email
      const filteredNotifications = typedNotifications.filter(notification => {
        console.log('NotificationBanner: Filtering notification:', {
          notificationId: notification.id,
          audience: notification.audience,
          isAdmin,
          isOwner,
          isStudent,
          isFree,
          userEmail: user?.email
        });

        // Admins see all notifications
        if (isAdmin) {
          console.log('NotificationBanner: User is admin, showing notification');
          return true;
        }
        
        switch (notification.audience) {
          case 'all_users':
            console.log('NotificationBanner: Notification for all users, showing');
            return true;
          case 'new_frontier_only':
            const isNewFrontier = user?.email?.endsWith('@newfrontier.us') || false;
            console.log('NotificationBanner: New Frontier only notification, user qualifies:', isNewFrontier);
            return isNewFrontier;
          case 'all_students':
            console.log('NotificationBanner: Student notification, user is student:', isStudent);
            return isStudent;
          case 'all_free':
            console.log('NotificationBanner: Free user notification, user is free:', isFree);
            return isFree;
          case 'all_owners':
            console.log('NotificationBanner: Owner notification, user is owner:', isOwner);
            return isOwner;
          default:
            console.log('NotificationBanner: Unknown audience, hiding notification');
            return false;
        }
      });
      
      console.log('NotificationBanner: Filtered notifications:', filteredNotifications);
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('NotificationBanner: Error fetching notifications:', error);
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
        return 'border-orange-200 text-orange-800' + ' ' + 'bg-[#FFF7ED]';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-orange-200 text-blue-800' + ' ' + 'bg-[#F9E8CD]';
    }
  };

  // Don't render if we're still loading roles
  if (roleLoading) {
    console.log('NotificationBanner: Still loading roles, not rendering');
    return null;
  }

  const activeNotifications = notifications.filter(
    notification => !dismissedNotifications.includes(notification.id)
  );

  console.log('NotificationBanner: Active notifications after filtering dismissed:', activeNotifications);

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
