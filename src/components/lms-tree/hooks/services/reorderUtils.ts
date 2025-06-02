
import { supabase } from "@/integrations/supabase/client";
import { SiblingItem, ReorderConfig } from "../types/reorderTypes";

export const validateReorderBounds = (
  currentIndex: number,
  targetIndex: number,
  siblings: SiblingItem[],
  direction: 'up' | 'down',
  config: ReorderConfig
): boolean => {
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
  tableName: string,
  current: SiblingItem,
  target: SiblingItem,
  config: ReorderConfig
): Promise<void> => {
  console.log(`Swapping ${tableName}:`, current.title, 'with:', target.title);

  // Swap sort orders with proper error handling
  const { error: updateError1 } = await supabase
    .from(tableName)
    .update({ sort_order: target.sort_order })
    .eq('id', current.id);

  if (updateError1) {
    console.error(`Error updating first ${tableName}:`, updateError1);
    throw updateError1;
  }

  const { error: updateError2 } = await supabase
    .from(tableName)
    .update({ sort_order: current.sort_order })
    .eq('id', target.id);

  if (updateError2) {
    console.error(`Error updating second ${tableName}:`, updateError2);
    throw updateError2;
  }

  console.log(`Successfully swapped ${tableName} sort orders`);
  config.toast({
    title: "Success",
    description: `${tableName.slice(0, -1).charAt(0).toUpperCase() + tableName.slice(1, -1)} reordered successfully`,
  });
  config.onRefetch();
};
