
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { logger } from "@/utils/logger";

type Lesson = Tables<'lessons'>;
type Unit = Tables<'units'>;

interface LessonWithUnits extends Lesson {
  units: Unit[];
}

export const useSection = (id: string | undefined) => {
  const { toast } = useToast();
  const [section, setSection] = useState<LessonWithUnits | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSection = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      logger.log('Fetching lesson:', id);
      
      // Fetch lesson with units
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) {
        logger.error('Error fetching lesson:', lessonError);
        throw lessonError;
      }

      logger.log('Lesson data fetched:', lessonData);

      // Fetch units for this lesson - exclude draft units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('section_id', id)
        .eq('is_draft', false)
        .order('sort_order', { ascending: true });

      if (unitsError) {
        logger.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      logger.log('Units data fetched (excluding drafts):', unitsData);

      const lessonWithUnits: LessonWithUnits = {
        ...lessonData,
        units: unitsData || []
      };

      setSection(lessonWithUnits);

      // Set first unit as selected by default
      if (unitsData && unitsData.length > 0) {
        setSelectedUnit(unitsData[0]);
      }
    } catch (error) {
      logger.error('Error fetching lesson:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson",
        variant: "destructive",
      });
      setSection(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      logger.log('useSection: Starting to fetch lesson:', id);
      fetchSection();
    } else {
      logger.log('useSection: No lesson ID provided');
      setLoading(false);
    }
  }, [id]);

  return {
    section,
    selectedUnit,
    setSelectedUnit,
    loading
  };
};
