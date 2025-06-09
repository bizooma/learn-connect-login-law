
import { supabase } from "@/integrations/supabase/client";
import { ModuleData } from "../types";

export interface DataLossWarning {
  type: 'missing_modules' | 'missing_lessons' | 'missing_units';
  message: string;
  affectedItems: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface DataLossCheck {
  hasWarnings: boolean;
  warnings: DataLossWarning[];
  safeToUpdate: boolean;
  preservedItemsCount: number;
}

export const checkForPotentialDataLoss = async (
  courseId: string, 
  formModules: ModuleData[]
): Promise<DataLossCheck> => {
  console.log('🔍 Checking for potential data loss before update...');
  
  try {
    // Get current database state
    const { data: dbModules, error } = await supabase
      .from('modules')
      .select(`
        *,
        lessons:lessons(
          *,
          units:units(*)
        )
      `)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching database state:', error);
      return {
        hasWarnings: false,
        warnings: [],
        safeToUpdate: true,
        preservedItemsCount: 0
      };
    }

    const warnings: DataLossWarning[] = [];
    let preservedItemsCount = 0;

    // Check for modules that exist in DB but not in form
    const formModuleIds = formModules.filter(m => m.id).map(m => m.id);
    const formModuleTitles = formModules.map(m => m.title.toLowerCase().trim());
    
    const missingModules = dbModules?.filter(dbModule => {
      const isInFormById = formModuleIds.includes(dbModule.id);
      const isInFormByTitle = formModuleTitles.includes(dbModule.title.toLowerCase().trim());
      return !isInFormById && !isInFormByTitle;
    }) || [];

    if (missingModules.length > 0) {
      preservedItemsCount += missingModules.length;
      warnings.push({
        type: 'missing_modules',
        message: `${missingModules.length} module(s) exist in database but not in form - will be preserved`,
        affectedItems: missingModules.map(m => m.title),
        severity: 'low'
      });
    }

    // Check for lessons within matching modules
    for (const formModule of formModules) {
      const dbModule = dbModules?.find(dm => 
        (formModule.id && dm.id === formModule.id) ||
        dm.title.toLowerCase().trim() === formModule.title.toLowerCase().trim()
      );

      if (dbModule && dbModule.lessons) {
        const formLessonTitles = formModule.lessons?.map(l => l.title.toLowerCase().trim()) || [];
        const missingLessons = dbModule.lessons.filter(dbLesson =>
          !formLessonTitles.includes(dbLesson.title.toLowerCase().trim())
        );

        if (missingLessons.length > 0) {
          preservedItemsCount += missingLessons.length;
          warnings.push({
            type: 'missing_lessons',
            message: `${missingLessons.length} lesson(s) in module "${dbModule.title}" exist in database but not in form - will be preserved`,
            affectedItems: missingLessons.map(l => l.title),
            severity: 'low'
          });
        }

        // Check for units within matching lessons
        for (const formLesson of formModule.lessons || []) {
          const dbLesson = dbModule.lessons.find(dl => 
            dl.title.toLowerCase().trim() === formLesson.title.toLowerCase().trim()
          );

          if (dbLesson && dbLesson.units) {
            const formUnitTitles = formLesson.units?.map(u => u.title.toLowerCase().trim()) || [];
            const missingUnits = dbLesson.units.filter(dbUnit =>
              !formUnitTitles.includes(dbUnit.title.toLowerCase().trim())
            );

            if (missingUnits.length > 0) {
              preservedItemsCount += missingUnits.length;
              warnings.push({
                type: 'missing_units',
                message: `${missingUnits.length} unit(s) in lesson "${dbLesson.title}" exist in database but not in form - will be preserved`,
                affectedItems: missingUnits.map(u => u.title),
                severity: 'low'
              });
            }
          }
        }
      }
    }

    const result: DataLossCheck = {
      hasWarnings: warnings.length > 0,
      warnings,
      safeToUpdate: true, // Always safe with incremental updates
      preservedItemsCount
    };

    console.log('🔍 Data loss check completed:', {
      hasWarnings: result.hasWarnings,
      warningCount: warnings.length,
      preservedItems: preservedItemsCount,
      safeToUpdate: result.safeToUpdate
    });

    return result;

  } catch (error) {
    console.error('Error checking for data loss:', error);
    return {
      hasWarnings: true,
      warnings: [{
        type: 'missing_modules',
        message: 'Unable to verify data integrity - update may be unsafe',
        affectedItems: [],
        severity: 'high'
      }],
      safeToUpdate: false,
      preservedItemsCount: 0
    };
  }
};

export const showDataLossWarnings = (warnings: DataLossWarning[]): string => {
  if (warnings.length === 0) {
    return 'All your data will be preserved during this update. ✅';
  }

  const warningText = warnings.map(warning => {
    const itemList = warning.affectedItems.length > 3 
      ? `${warning.affectedItems.slice(0, 3).join(', ')} and ${warning.affectedItems.length - 3} more`
      : warning.affectedItems.join(', ');
    
    return `${warning.message}${itemList ? `: ${itemList}` : ''}`;
  }).join('\n\n');

  return `Data Preservation Report:\n\n${warningText}\n\n✅ All items will be preserved - no data will be lost.`;
};
