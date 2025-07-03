
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Bell } from "lucide-react";
import { Notification, NotificationAudience } from "./types";

interface NotificationListProps {
  notifications: Notification[];
  onEdit: (notification: Notification) => void;
  onDelete: (notificationId: string) => void;
  onToggleActive: (notificationId: string, currentStatus: boolean) => void;
}

const NotificationList = ({ notifications, onEdit, onDelete, onToggleActive }: NotificationListProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getAudienceLabel = (audience: NotificationAudience) => {
    switch (audience) {
      case 'new_frontier_only': return 'New Frontier Only';
      case 'all_students': return 'All Students';
      case 'all_free': return 'All Free';
      case 'all_owners': return 'All Owners';
      case 'all_users': return 'All Users';
      default: return 'All Users';
    }
  };

  const getAudienceColor = (audience: NotificationAudience) => {
    switch (audience) {
      case 'new_frontier_only': return 'bg-purple-100 text-purple-800';
      case 'all_students': return 'bg-blue-100 text-blue-800';
      case 'all_free': return 'bg-gray-100 text-gray-800';
      case 'all_owners': return 'bg-orange-100 text-orange-800';
      case 'all_users': return 'bg-green-100 text-green-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No notifications created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="bg-[#FFF7ED]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)} bg-gray-100`}>
                    {notification.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notification.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {notification.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getAudienceColor(notification.audience)}`}>
                    {getAudienceLabel(notification.audience)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleActive(notification.id, notification.is_active)}
                >
                  {notification.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(notification)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationList;
