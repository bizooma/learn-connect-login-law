
import { MoreVertical, ArrowUp, ArrowDown, Package, FolderOpen, File, Move } from "lucide-react";
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
import { logger } from "@/utils/logger";

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
      if (itemType === 'lesson' && targetType === 'module') {
        // In our current inverted structure, "lessons" are displayed as modules
        // So we're moving a lesson to a different module
        const { error } = await supabase
          .from('lessons')
          .update({ module_id: targetId })
          .eq('id', itemId);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" moved to selected module`,
        });
      } else if (itemType === 'unit' && targetType === 'lesson') {
        // In our current structure, "units" are displayed as lessons
        // So we're moving a unit to a different lesson
        const { error } = await supabase
          .from('units')
          .update({ section_id: targetId })
          .eq('id', itemId);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `"${itemTitle}" moved to selected lesson`,
        });
      } else {
        toast({
          title: "Info",
          description: "This reclassification is not supported for the current structure",
        });
        return;
      }
      
      onRefetch();
    } catch (error) {
      logger.error('Error during reclassification:', error);
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
    if (itemType === 'lesson' && targetType === 'module') {
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
      return target.type === 'module';
    } else if (itemType === 'unit') {
      return target.type === 'lesson';
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs flex items-center space-x-2">
          <Move className="h-3 w-3" />
          <span>Move "{itemTitle}"</span>
        </DropdownMenuLabel>
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
                <span className="font-medium">{getActionText(target.type)}</span>
                <span className="text-muted-foreground">"{target.title}"</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          Use ↑↓ arrows for quick reordering
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReclassificationDropdown;
