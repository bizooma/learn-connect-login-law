
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import ResourcesGrid from "@/components/admin/resources/ResourcesGrid";
import ResourcesHeader from "@/components/admin/resources/ResourcesHeader";
import UploadResourceDialog from "@/components/admin/resources/UploadResourceDialog";
import EditResourceDialog from "@/components/admin/resources/EditResourceDialog";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type AdminResource = Tables<'admin_resources'>;

const AdminResources = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: resources = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminResource[];
    },
  });

  const handleEdit = (resource: AdminResource) => {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  };

  const handleDelete = async (resource: AdminResource) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('admin_resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;

      // Delete file from storage
      if (resource.file_url) {
        const fileName = resource.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('admin-resources')
            .remove([fileName]);
        }
      }

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (resource: AdminResource) => {
    try {
      const { error } = await supabase
        .from('admin_resources')
        .update({ is_active: !resource.is_active })
        .eq('id', resource.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Resource ${resource.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <AdminDashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResourcesHeader 
          onUpload={() => setUploadDialogOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resourceCount={resources.length}
        />
        
        <ResourcesGrid 
          resources={filteredResources}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      <UploadResourceDialog 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={refetch}
      />

      <EditResourceDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        resource={selectedResource}
        onSuccess={refetch}
      />
    </div>
  );
};

export default AdminResources;
