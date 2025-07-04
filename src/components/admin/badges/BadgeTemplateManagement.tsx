import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload } from "lucide-react";

interface BadgeTemplate {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  badge_color: string;
  is_active: boolean;
  created_at: string;
}

const BadgeTemplateManagement = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    badge_color: "#FFD700",
    image_file: null as File | null
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('badge_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load badge templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('badge-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('badge-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.image_file) {
      toast({
        title: "Error",
        description: "Please provide a name and image for the badge template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const imageUrl = await handleImageUpload(templateForm.image_file);

      const { error } = await supabase
        .from('badge_templates')
        .insert({
          name: templateForm.name,
          description: templateForm.description,
          image_url: imageUrl,
          badge_color: templateForm.badge_color
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Badge template created successfully",
      });

      setTemplateForm({
        name: "",
        description: "",
        badge_color: "#FFD700",
        image_file: null
      });
      setDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create badge template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this badge template?')) return;

    try {
      const { error } = await supabase
        .from('badge_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Badge template deleted successfully",
      });
      fetchTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete badge template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Badge Templates</h3>
          <p className="text-sm text-muted-foreground">Create and manage badge templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Template</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Badge Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Badge Name</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Sales 100 Master"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Badge description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template-image">Badge Image</Label>
                <Input
                  id="template-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTemplateForm({ ...templateForm, image_file: e.target.files?.[0] || null })}
                />
              </div>

              <div>
                <Label htmlFor="template-color">Badge Color</Label>
                <Input
                  id="template-color"
                  type="color"
                  value={templateForm.badge_color}
                  onChange={(e) => setTemplateForm({ ...templateForm, badge_color: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleCreateTemplate} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No badge templates created yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first badge template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => t.is_active).map((template) => (
            <Card key={template.id} className="relative group">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                    style={{ backgroundColor: template.badge_color }}
                  >
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeTemplateManagement;