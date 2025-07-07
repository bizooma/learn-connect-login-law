
import { supabase } from "@/integrations/supabase/client";
import { ReorderConfig } from "../types/reorderTypes";
import { validateReorderBounds, swapSortOrders } from "./reorderUtils";
import { logger } from "@/utils/logger";

export const reorderUnit = async (unitId: string, direction: 'up' | 'down', config: ReorderConfig) => {
  try {
    logger.log('=== REORDER UNIT DEBUG ===');
    logger.log('Unit ID:', unitId);
    logger.log('Direction:', direction);

    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('sort_order, section_id, title')
      .eq('id', unitId)
      .maybeSingle();

    if (unitError) {
      logger.error('Error fetching unit:', unitError);
      throw unitError;
    }

    if (!unitData) {
      throw new Error('Unit not found');
    }

    logger.log('Unit data:', unitData);

    const { data: siblings, error: siblingsError } = await supabase
      .from('units')
      .select('id, sort_order, title')
      .eq('section_id', unitData.section_id)
      .order('sort_order');

    if (siblingsError) {
      logger.error('Error fetching unit siblings:', siblingsError);
      throw siblingsError;
    }

    logger.log('Unit siblings:', siblings);

    const currentIndex = siblings.findIndex(s => s.id === unitId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (!validateReorderBounds(currentIndex, targetIndex, siblings, direction, config)) {
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];

    await swapSortOrders('units', current, target, config);
  } catch (error) {
    logger.error('Error reordering unit:', error);
    config.toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to reorder unit",
      variant: "destructive",
    });
  }
};
