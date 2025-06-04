
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type AdminResource = Tables<'admin_resources'>;

interface ResourceCardProps {
  resource: AdminResource;
  onEdit: (resource: AdminResource) => void;
  onDelete: (resource: AdminResource) => void;
  onToggleActive: (resource: AdminResource) => void;
}

const getFileIcon = (fileType: string) => {
  if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase())) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  if (['xls', 'xlsx'].includes(fileType.toLowerCase())) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  if (['ppt', 'pptx'].includes(fileType.toLowerCase())) {
    return <Presentation className="h-8 w-8 text-orange-500" />;
  }
  return <FileText className="h-8 w-8 text-gray-500" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const ResourceCard = ({ resource, onEdit, onDelete, onToggleActive }: ResourceCardProps) => {
  const handleDownload = () => {
    window.open(resource.file_url, '_blank');
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${!resource.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(resource.file_type)}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate" title={resource.title}>
                {resource.title}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {resource.category}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(resource)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(resource)}>
                {resource.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(resource)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {resource.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {resource.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{formatFileSize(resource.file_size)}</span>
          <Badge variant={resource.is_active ? "default" : "secondary"}>
            {resource.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-400">
          Created {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
