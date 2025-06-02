
import { supabase } from "@/integrations/supabase/client";
import { SiblingItem, ReorderConfig } from "../types/reorderTypes";

export const validateReorderBounds = (
  currentIndex: number,
  targetIndex: number,
  siblings: SiblingItem[],
  direction: 'up' | 'down',
  config: ReorderConfig
): boolean => {
  if (currentIndex === -1) {
    console.error('Current item not found in siblings array');
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
  console.log(`Swapping ${tableName}:`, current.title, 'with:', target.title);
  console.log('Current sort_order:', current.sort_order, 'Target sort_order:', target.sort_order);

  try {
    // Use a transaction to ensure both updates succeed or fail together
    const { error } = await supabase.rpc('swap_sort_orders', {
      table_name: tableName,
      id1: current.id,
      id2: target.id,
      sort_order1: target.sort_order,
      sort_order2: current.sort_order
    });

    if (error) {
      // Fallback to individual updates if RPC fails
      console.log('RPC failed, using fallback method');
      
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
    }

    console.log(`Successfully swapped ${tableName} sort orders`);
    config.toast({
      title: "Success",
      description: `${tableName.slice(0, -1).charAt(0).toUpperCase() + tableName.slice(1, -1)} reordered successfully`,
    });
    config.onRefetch();
  } catch (error) {
    console.error(`Failed to swap ${tableName} sort orders:`, error);
    config.toast({
      title: "Error",
      description: `Failed to reorder ${tableName.slice(0, -1)}. Please try again.`,
      variant: "destructive",
    });
    throw error;
  }
};
