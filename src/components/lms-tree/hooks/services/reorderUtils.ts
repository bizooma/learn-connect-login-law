
import { supabase } from "@/integrations/supabase/client";
import { SiblingItem, ReorderConfig } from "../types/reorderTypes";
import { logger } from "@/utils/logger";

export const validateReorderBounds = (
  currentIndex: number,
  targetIndex: number,
  siblings: SiblingItem[],
  direction: 'up' | 'down',
  config: ReorderConfig
): boolean => {
  if (currentIndex === -1) {
    logger.error('Current item not found in siblings array');
    config.toast({
      title: "Error",
      description: "Item not found in list",
      variant: "destructive",
    });
    return false;
  }

  if (targetIndex < 0 || targetIndex >= siblings.length) {
    config.toast({
      title: "Info",
      description: `Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`,
    });
    return false;
  }
  return true;
};

export const swapSortOrders = async (
  tableName: 'modules' | 'lessons' | 'units',
  current: SiblingItem,
  target: SiblingItem,
  config: ReorderConfig
): Promise<void> => {
  logger.log(`Swapping ${tableName}:`, current.title, 'with:', target.title);
  logger.log('Current sort_order:', current.sort_order, 'Target sort_order:', target.sort_order);

  try {
    // Use individual updates to swap sort orders
    const { error: updateError1 } = await supabase
      .from(tableName)
      .update({ sort_order: target.sort_order })
      .eq('id', current.id);

    if (updateError1) {
      logger.error(`Error updating first ${tableName}:`, updateError1);
      throw updateError1;
    }

    const { error: updateError2 } = await supabase
      .from(tableName)
      .update({ sort_order: current.sort_order })
      .eq('id', target.id);

    if (updateError2) {
      logger.error(`Error updating second ${tableName}:`, updateError2);
      throw updateError2;
    }

    logger.log(`Successfully swapped ${tableName} sort orders`);
    config.toast({
      title: "Success",
      description: `${tableName.slice(0, -1).charAt(0).toUpperCase() + tableName.slice(1, -1)} reordered successfully`,
    });
    config.onRefetch();
  } catch (error) {
    logger.error(`Failed to swap ${tableName} sort orders:`, error);
    config.toast({
      title: "Error",
      description: `Failed to reorder ${tableName.slice(0, -1)}. Please try again.`,
      variant: "destructive",
    });
    throw error;
  }
};
