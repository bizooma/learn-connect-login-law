
import { MoreVertical, ArrowUp, ArrowDown, Package, FolderOpen, File } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReclassificationDropdownProps {
  itemId: string;
  itemType: 'lesson' | 'unit';
  itemTitle: string;
  currentParentId: string;
  availableTargets: Array<{
    id: string;
    title: string;
    type: 'course' | 'module' | 'lesson';
  }>;
  onRefetch: () => void;
}

const ReclassificationDropdown = ({
  itemId,
  itemType,
  itemTitle,
  currentParentId,
  availableTargets,
  onRefetch
}: ReclassificationDropdownProps) => {
  const { toast } = useToast();

  const handleReclassify = async (targetId: string, targetType: string) => {
    try {
      if (itemType === 'lesson' && targetType === 'course') {
        // Reclassify lesson to module
        const { error } = await supabase.rpc('reclassify_section_to_module', {
          p_section_id: itemId,
          p_course_id: targetId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" reclassified as a module`,
        });
      } else if (itemType === 'unit' && targetType === 'module') {
        // Reclassify unit to lesson
        const { error } = await supabase.rpc('reclassify_unit_to_section', {
          p_unit_id: itemId,
          p_module_id: targetId
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" reclassified as a lesson`,
        });
      } else if (itemType === 'lesson' && targetType === 'module') {
        // Move lesson to different module
        const { error } = await supabase.rpc('move_content_to_level', {
          p_content_id: itemId,
          p_content_type: 'section',
          p_target_parent_id: targetId,
          p_target_parent_type: 'module'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" moved to selected module`,
        });
      } else if (itemType === 'unit' && targetType === 'lesson') {
        // Move unit to different lesson
        const { error } = await supabase.rpc('move_content_to_level', {
          p_content_id: itemId,
          p_content_type: 'unit',
          p_target_parent_id: targetId,
          p_target_parent_type: 'section'
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" moved to selected lesson`,
        });
      }
      
      onRefetch();
    } catch (error) {
      console.error('Error during reclassification:', error);
      toast({
        title: "Error",
        description: "Failed to reclassify content",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <Package className="h-3 w-3" />;
      case 'module':
        return <FolderOpen className="h-3 w-3" />;
      case 'lesson':
        return <File className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getActionText = (targetType: string) => {
    if (itemType === 'lesson' && targetType === 'course') {
      return 'Reclassify as Module';
    } else if (itemType === 'unit' && targetType === 'module') {
      return 'Reclassify as Lesson';
    } else if (itemType === 'lesson' && targetType === 'module') {
      return 'Move to Module';
    } else if (itemType === 'unit' && targetType === 'lesson') {
      return 'Move to Lesson';
    }
    return 'Move to';
  };

  const filteredTargets = availableTargets.filter(target => {
    // Don't show current parent as an option
    if (target.id === currentParentId) return false;
    
    // Filter based on item type and valid target types
    if (itemType === 'lesson') {
      return target.type === 'course' || target.type === 'module';
    } else if (itemType === 'unit') {
      return target.type === 'module' || target.type === 'lesson';
    }
    
    return false;
  });

  if (filteredTargets.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Reclassify "{itemTitle}"</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filteredTargets.map((target) => (
          <DropdownMenuItem
            key={target.id}
            onClick={() => handleReclassify(target.id, target.type)}
            className="text-xs"
          >
            <div className="flex items-center space-x-2">
              {getIcon(target.type)}
              <div className="flex flex-col">
                <span>{getActionText(target.type)}</span>
                <span className="text-muted-foreground">"{target.title}"</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReclassificationDropdown;
