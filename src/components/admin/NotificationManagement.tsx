
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Edit, Trash2, Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_active: boolean;
  created_by: string;
}

const NotificationManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    is_active: true
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNotification) {
        // Update existing notification
        const { error } = await supabase
          .from('notifications')
          .update({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            is_active: formData.is_active
          })
          .eq('id', editingNotification.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Notification updated successfully",
        });
      } else {
        // Create new notification
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
      }

      // Reset form and refresh
      setFormData({ title: '', message: '', type: 'info', is_active: true });
      setIsCreating(false);
      setEditingNotification(null);
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: "Error",
        description: "Failed to save notification",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (notification: Notification) => {
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      is_active: notification.is_active
    });
    setEditingNotification(notification);
    setIsCreating(true);
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

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
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
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
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast({
        title: "Error",
        description: "Failed to update notification status",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setFormData({ title: '', message: '', type: 'info', is_active: true });
    setIsCreating(false);
    setEditingNotification(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
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
        <Card>
          <CardHeader>
            <CardTitle>
              {editingNotification ? 'Edit Notification' : 'Create New Notification'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'info' | 'warning' | 'success' | 'error') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingNotification ? 'Update' : 'Create'} Notification
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No notifications created yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
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
                      onClick={() => toggleActive(notification.id, notification.is_active)}
                    >
                      {notification.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(notification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationManagement;
