
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNotifications } from "./notification-management/useNotifications";
import NotificationForm from "./notification-management/NotificationForm";
import NotificationList from "./notification-management/NotificationList";
import { Notification } from "./notification-management/types";

const NotificationManagement = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  
  const {
    notifications,
    loading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleActive
  } = useNotifications();

  const handleSubmit = async (formData: any) => {
    if (editingNotification) {
      const success = await updateNotification(editingNotification.id, formData);
      if (success) {
        setEditingNotification(null);
      }
      return success;
    } else {
      return await createNotification(formData);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingNotification(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Notification Management</h3>
          <p className="text-sm text-gray-600">Create and manage system-wide notifications</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center"
          disabled={isCreating}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {isCreating && (
        <NotificationForm
          editingNotification={editingNotification}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
        />
      )}

      <NotificationList
        notifications={notifications}
        onEdit={handleEdit}
        onDelete={deleteNotification}
        onToggleActive={toggleActive}
      />
    </div>
  );
};

export default NotificationManagement;
