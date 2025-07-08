import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload, Download, Eye } from "lucide-react";
import { logger } from "@/utils/logger";

interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  template_image_url: string;
  storage_path?: string;
  file_size?: number;
  content_type?: string;
  is_active: boolean;
  created_at: string;
}

const CertificateTemplateManagement = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    image_file: null as File | null
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      logger.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<{ url: string; path: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `templates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('certificate-templates')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('certificate-templates')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, path: filePath };
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.image_file) {
      toast({
        title: "Error",
        description: "Please provide a name and image for the certificate template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { url, path } = await handleImageUpload(templateForm.image_file);

      const { error } = await supabase
        .from('certificate_templates')
        .insert({
          name: templateForm.name,
          description: templateForm.description,
          template_image_url: url,
          storage_path: path,
          file_size: templateForm.image_file.size,
          content_type: templateForm.image_file.type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certificate template created successfully",
      });

      setTemplateForm({
        name: "",
        description: "",
        image_file: null
      });
      setDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      logger.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !templateForm.name) {
      toast({
        title: "Error",
        description: "Please provide a name for the certificate template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let updateData: any = {
        name: templateForm.name,
        description: templateForm.description,
      };

      // If new image is provided, upload it
      if (templateForm.image_file) {
        const { url, path } = await handleImageUpload(templateForm.image_file);
        updateData.template_image_url = url;
        updateData.storage_path = path;
        updateData.file_size = templateForm.image_file.size;
        updateData.content_type = templateForm.image_file.type;
      }

      const { error } = await supabase
        .from('certificate_templates')
        .update(updateData)
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certificate template updated successfully",
      });

      setTemplateForm({
        name: "",
        description: "",
        image_file: null
      });
      setEditingTemplate(null);
      setDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      logger.error('Error updating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update certificate template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this certificate template?')) return;

    try {
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Certificate template deleted successfully",
      });
      fetchTemplates();
    } catch (error: any) {
      logger.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete certificate template",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      image_file: null
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      image_file: null
    });
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Certificate Templates</h2>
          <p className="text-muted-foreground">Manage certificate templates for course completion</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Certificate Template' : 'Create Certificate Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Course Completion Certificate"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Template description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template-image">Certificate Template Image</Label>
                <Input
                  id="template-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTemplateForm({ ...templateForm, image_file: e.target.files?.[0] || null })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a high-quality image template. Student name and course title will be added automatically.
                </p>
              </div>

              <Button 
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                disabled={loading}
                className="w-full"
              >
                {loading ? (editingTemplate ? "Updating..." : "Creating...") : (editingTemplate ? "Update Template" : "Create Template")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && !dialogOpen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No certificate templates created yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => t.is_active).map((template) => (
            <Card key={template.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(template.template_image_url, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                  <img
                    src={template.template_image_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                  <span>
                    {template.file_size ? `${(template.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                  </span>
                  <span>{template.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateTemplateManagement;